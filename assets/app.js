
const MARKET_META = {
  EE: { name: 'Eesti', currency: 'EUR' },
  FI: { name: 'Soome', currency: 'EUR' },
  PL: { name: 'Poola', currency: 'PLN' },
  ZA: { name: 'Lõuna-Aafrika Vabariik', currency: 'ZAR' },
  KE: { name: 'Keenia', currency: 'KES' }
};

function qs(sel, root=document){ return root.querySelector(sel); }
function qsa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }
function setActiveButton(button){
  qsa('.sideNav button').forEach(b => b.classList.remove('active'));
  if(button) button.classList.add('active');
}
function jumpToSection(id, button){
  const target = document.getElementById(id);
  if(target){ target.scrollIntoView({behavior:'smooth', block:'start'}); }
  setActiveButton(button);
}
function getMarket(){
  const fromUrl = new URLSearchParams(location.search).get('market');
  const market = String(fromUrl || sessionStorage.getItem('aimoneyflowMarket') || 'EE').toUpperCase();
  if(!MARKET_META[market]) return 'EE';
  sessionStorage.setItem('aimoneyflowMarket', market);
  return market;
}
async function loadRules(market){
  const response = await fetch('rules/' + encodeURIComponent(market) + '.json', {cache:'no-store'});
  if(!response.ok) throw new Error('Riigi reegleid ei õnnestunud laadida.');
  return response.json();
}
function applyMarketUi(market, rules){
  const meta = MARKET_META[market];
  qsa('[data-market-label]').forEach(el => { el.textContent = meta.name + ' · ' + market + ' · ' + meta.currency; });
  const residence = qs('[name="residenceCountry"]');
  const citizenship = qs('[name="citizenship"]');
  if(residence && residence.value === 'Eesti') residence.value = meta.name;
  if(citizenship && citizenship.value === 'Eesti') citizenship.value = meta.name;
  const personalCode = qs('[name="personalCode"]');
  const companyCode = qs('[name="companyRegCode"]');
  if(personalCode && rules?.validation?.personalCode?.label) personalCode.placeholder = rules.validation.personalCode.label;
  if(companyCode && rules?.validation?.companyRegCode?.label) companyCode.placeholder = rules.validation.companyRegCode.label;
}
function collectForm(form){
  const data = {};
  const files = [];
  for(const element of Array.from(form.elements)){
    if(!element.name) continue;
    if(element.type === 'file'){
      for(const file of Array.from(element.files || [])){
        if(file.size){
          files.push({fieldName:element.name, file});
        }
      }
      continue;
    }
    if(element.name === 'bot-field' || element.name === 'applicationType') continue;
    if((element.type === 'checkbox' || element.type === 'radio') && !element.checked){
      if(element.type === 'checkbox') data[element.name] = false;
      continue;
    }
    data[element.name] = element.value;
  }
  return {
    payload:{
      market:getMarket(),
      applicationType:form.dataset.type === 'company' ? 'company' : 'personal',
      submittedAt:new Date().toISOString(),
      botField:form.elements['bot-field']?.value || '',
      data
    },
    files
  };
}
async function readJson(response){
  const text = await response.text();
  try { return text ? JSON.parse(text) : {}; }
  catch { return {error:text || 'unknown_error'}; }
}
async function createCase(payload){
  const response = await fetch('/api/cases', {
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify(payload)
  });
  const body = await readJson(response);
  if(!response.ok) throw new Error(body?.detail?.code || body?.error || body?.detail || 'Taotluse salvestamine ebaõnnestus.');
  return body;
}
async function uploadFile(market, caseId, item){
  const ticketResponse = await fetch('/api/uploads', {
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({
      market, caseId,
      filename:item.file.name,
      contentType:item.file.type || 'application/octet-stream',
      size:item.file.size,
      fieldName:item.fieldName
    })
  });
  const ticket = await readJson(ticketResponse);
  if(!ticketResponse.ok) throw new Error(ticket?.error || ticket?.detail || 'Faili üleslaadimise luba ebaõnnestus.');

  const put = await fetch(ticket.uploadUrl, {
    method:ticket.method || 'PUT',
    headers:ticket.headers || {'Content-Type':item.file.type || 'application/octet-stream'},
    body:item.file
  });
  if(!put.ok) throw new Error('Faili privaatne üleslaadimine ebaõnnestus.');

  const complete = await fetch('/api/uploads', {
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({action:'complete', market, caseId, documentId:ticket.documentId})
  });
  if(!complete.ok) throw new Error('Faili salvestuse kinnitamine ebaõnnestus.');
}
function showError(box, message){
  if(!box) return;
  box.textContent = typeof message === 'string' ? message : JSON.stringify(message);
  box.classList.add('show');
}
async function setupApplicationForm(){
  const form = qs('#applicationForm');
  if(!form) return;
  const market = getMarket();
  let rules;
  try {
    rules = await loadRules(market);
    applyMarketUi(market, rules);
  } catch(error) {
    showError(qs('#formError'), error.message);
    return;
  }

  qsa('[data-jump]').forEach(btn => btn.addEventListener('click', () => jumpToSection(btn.dataset.jump, btn)));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const errorBox = qs('#formError');
    errorBox?.classList.remove('show');
    if(!form.reportValidity()){
      showError(errorBox, 'Täida enne kohustuslikud väljad ja kinnita nõusolek.');
      return;
    }

    const submitButtons = qsa('button[type="submit"]', form.closest('.content') || document);
    submitButtons.forEach(btn => { btn.disabled = true; btn.textContent = 'Saadan…'; });

    try {
      const {payload, files} = collectForm(form);
      const created = await createCase(payload);
      await Promise.all(files.map(item => uploadFile(payload.market, created.caseId, item)));
      localStorage.setItem('aimoneyflowCase', JSON.stringify({
        applicationType:payload.applicationType,
        market:payload.market,
        caseId:created.caseId,
        reference:created.reference,
        submittedAt:payload.submittedAt
      }));
      window.location.href = 'submitted.html?market=' + encodeURIComponent(payload.market);
    } catch(error) {
      showError(errorBox, error.message || 'Taotluse saatmine ebaõnnestus.');
      submitButtons.forEach(btn => { btn.disabled = false; btn.textContent = 'Esita taotlus'; });
    }
  });
}
function getCase(){
  try { return JSON.parse(localStorage.getItem('aimoneyflowCase') || '{}'); }
  catch(e){ return {}; }
}
function setupSubmitted(){
  const box = qs('[data-submitted-summary]');
  if(!box) return;
  const data = getCase();
  const type = data.applicationType === 'company' ? 'Ettevõtte taotlus' : 'Eraisiku taotlus';
  box.innerHTML = '<strong>' + type + '</strong><span>Riik: ' + (data.market || getMarket()) + '</span><span>Viide: ' + (data.reference || '—') + '</span>';
}
function setupDashboard(){
  const data = getCase();
  const title = qs('[data-case-title]');
  const amount = qs('[data-case-amount]');
  const type = qs('[data-case-type]');
  const task = qs('[data-dynamic-task]');
  if(title) title.textContent = data.reference || 'Uus taotlus';
  if(amount) amount.textContent = data.market || getMarket();
  if(type) type.textContent = data.applicationType === 'company' ? 'Ettevõtte taotlus' : 'Eraisiku taotlus';
  if(task) task.textContent = data.reference ? 'Taotlus on vastu võetud. Järgmine samm: dokumentide analüüs.' : 'Alusta uuest riigipõhisest taotlusest.';
  const detail = qs('[data-case-detail]');
  if(detail) detail.textContent = data.reference || 'Riigipõhine case';
  qsa('.bottom-nav button').forEach(btn => btn.addEventListener('click', () => {
    qsa('.bottom-nav button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }));
}
document.addEventListener('DOMContentLoaded', () => {
  setupApplicationForm();
  setupSubmitted();
  setupDashboard();
});
