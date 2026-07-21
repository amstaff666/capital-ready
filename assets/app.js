
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
function collectCase(form){
  // The public frontend is a demo until the authenticated API and private
  // document storage are connected. Never persist form PII or filenames.
  return {
    applicationType: form.dataset.type === 'company' ? 'company' : 'personal',
    demo: true,
    submittedAt: new Date().toISOString()
  };
}
function setupApplicationForm(){
  const form = qs('#applicationForm');
  if(!form) return;
  qsa('[data-jump]').forEach(btn => btn.addEventListener('click', () => jumpToSection(btn.dataset.jump, btn)));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const errorBox = qs('#formError');
    if(!form.reportValidity()){
      if(errorBox){ errorBox.textContent = 'Täida enne kohustuslikud väljad ja kinnita nõusolek.'; errorBox.classList.add('show'); }
      return;
    }
    const data = collectCase(form);
    localStorage.setItem('aimoneyflowCase', JSON.stringify(data));
    window.location.href = 'submitted.html?type=' + encodeURIComponent(data.applicationType);
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
  box.innerHTML = `<strong>${type}</strong><span>Demo — andmeid ei edastatud</span><span>Turvaline API on ühendamata</span>`;
}
function setupDashboard(){
  const data = getCase();
  const title = qs('[data-case-title]');
  const amount = qs('[data-case-amount]');
  const type = qs('[data-case-type]');
  const task = qs('[data-dynamic-task]');
  if(title) title.textContent = data.applicationType === 'company' ? 'Demo Ettevõte OÜ' : 'Demo Klient';
  if(amount) amount.textContent = '50 000 €';
  if(type) type.textContent = data.applicationType === 'company' ? 'Ettevõtte taotlus' : 'Eraisiku taotlus';
  if(task) task.textContent = 'Demo: ühenda turvaline API enne pärisandmete vastuvõttu.';
  const detail = qs('[data-case-detail]');
  if(detail){
    detail.textContent = data.applicationType === 'company' ? 'Ettevõtte rahastuse democase' : 'Eraisiku laenuteekonna democase';
  }
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
