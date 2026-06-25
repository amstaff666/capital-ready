import React, { useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  CircleAlert,
  FileText,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  WalletCards
} from "lucide-react";
import "./styles.css";
const banks = [
  { name: "Swedbank", account: true, iban: true, statement: false },
  { name: "SEB", account: true, iban: true, statement: true },
  { name: "LHV", account: true, iban: true, statement: true },
  { name: "Coop", account: true, iban: true, statement: true },
  { name: "Luminor", account: false, iban: false, statement: false },
  { name: "Citadele", account: false, iban: false, statement: false }
];
const docs = [
  { title: "Bilanss 31.05.2026", done: false },
  { title: "Kasumiaruanne", done: true },
  { title: "Maksuvõla puudumise kontroll", done: true },
  { title: "Juhatuse liikme kinnitus", done: false }
];
function LoginScreen({ onLogin }) {
  return (
    <main className="authPage">
      <section className="brandPanel">
        <div className="brandMark">
          <ShieldCheck size={30} />
        </div>
        <p className="eyebrow">Premium finance readiness portal</p>
        <h1>CapitalReady</h1>
        <p className="lead">
          Ettevõtte laenuvalmiduse töölaud, mis viib kliendi samm-sammult läbi
          dokumentide, pangakontrollide ja halduri küsimuste.
        </p>
        <div className="heroStats">
          <div>
            <strong>6</strong>
            <span>panga kontroll</span>
          </div>
          <div>
            <strong>78%</strong>
            <span>laenuvalmidus</span>
          </div>
          <div>
            <strong>24h</strong>
            <span>halduri ülevaade</span>
          </div>
        </div>
      </section>
      <section className="loginCard">
        <div className="cardIcon">
          <LockKeyhole size={22} />
        </div>
        <h2>Sisene kliendiportaali</h2>
        <p>Jätka ettevõtte laenutaotluse ettevalmistamist.</p>
        <label>Ettevõtte e-post</label>
        <input defaultValue="demo@ettevote.ee" />
        <label>Parool</label>
        <input type="password" defaultValue="capitalready" />
        <button onClick={onLogin}>Logi sisse</button>
        <div className="authFooter">
          <span>Uus klient?</span>
          <a>Loo konto ja alusta kontrolli</a>
        </div>
      </section>
    </main>
  );
}
function BankCard({ bank }) {
  const score = [bank.account, bank.iban, bank.statement].filter(Boolean).length;
  return (
    <article className={`bankCard ${score === 3 ? "done" : score === 0 ? "missing" : ""}`}>
      <div className="bankTop">
        <h3>{bank.name}</h3>
        <span>{score}/3</span>
      </div>
      <ul>
        <li className={bank.account ? "ok" : "bad"}>
          {bank.account ? <CheckCircle2 size={16} /> : <CircleAlert size={16} />}
          konto avatud
        </li>
        <li className={bank.iban ? "ok" : "bad"}>
          {bank.iban ? <CheckCircle2 size={16} /> : <CircleAlert size={16} />}
          IBAN sisestatud
        </li>
        <li className={bank.statement ? "ok" : "bad"}>
          {bank.statement ? <CheckCircle2 size={16} /> : <CircleAlert size={16} />}
          6–12 kuu väljavõte lisatud
        </li>
      </ul>
    </article>
  );
}
function Dashboard() {
  const readyBanks = useMemo(() => banks.filter((b) => b.account && b.iban).length, []);
  const completedDocs = docs.filter((d) => d.done).length;
  return (
    <main className="dashboard">
      <aside className="sidebar">
        <div className="sideBrand">
          <div className="smallMark">CR</div>
          <div>
            <strong>CapitalReady</strong>
            <span>Client Portal</span>
          </div>
        </div>
        <nav>
          <a className="active"><WalletCards size={18} /> Ülevaade</a>
          <a><Building2 size={18} /> Ettevõtte andmed</a>
          <a><UploadCloud size={18} /> Dokumendid</a>
          <a><MessageSquareText size={18} /> Halduri küsimused</a>
          <a><Sparkles size={18} /> AI abiline</a>
        </nav>
      </aside>
      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Laenutaotluse ettevalmistus</p>
            <h1>OÜ Demo Capital</h1>
          </div>
          <button>Jätka taotlust</button>
        </header>
        <section className="summaryGrid">
          <div className="summaryCard main">
            <span>Laenuvalmidus</span>
            <strong>78%</strong>
            <p>Valmis esitamiseks pärast puuduvate pangaväljavõtete ja bilansi lisamist.</p>
          </div>
          <div className="summaryCard">
            <span>6 panga baas</span>
            <strong>{readyBanks}/6</strong>
            <p>Swedbanki väljavõte ning Luminor/Citadele konto info on puudu.</p>
          </div>
          <div className="summaryCard">
            <span>Dokumendid</span>
            <strong>{completedDocs}/{docs.length}</strong>
            <p>Bilanss ja juhatuse kinnitus vajavad lisamist.</p>
          </div>
        </section>
        <section className="panel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Kohustuslik kontroll</p>
              <h2>6 põhipanka</h2>
            </div>
            <span className="pill">4 / 6 panga baas olemas</span>
          </div>
          <div className="bankGrid">
            {banks.map((bank) => (
              <BankCard key={bank.name} bank={bank} />
            ))}
          </div>
        </section>
        <section className="lowerGrid">
          <div className="panel">
            <div className="panelHeader">
              <h2>Puuduvad tegevused</h2>
            </div>
            <div className="todoList">
              <div><CircleAlert size={18} /> Lisa Swedbanki 12 kuu väljavõte</div>
              <div><CircleAlert size={18} /> Ava või kinnita Luminor konto</div>
              <div><CircleAlert size={18} /> Ava või kinnita Citadele konto</div>
              <div><CircleAlert size={18} /> Lisa bilanss seisuga 31.05.2026</div>
            </div>
          </div>
          <div className="panel">
            <div className="panelHeader">
              <h2>Halduri küsimused</h2>
            </div>
            <div className="questionBox">
              <MessageSquareText size={20} />
              <div>
                <strong>Mis on laenu kasutamise eesmärk?</strong>
                <p>Vasta enne panga paketi lõplikku koostamist.</p>
              </div>
            </div>
            <div className="aiBox">
              <Sparkles size={20} />
              <div>
                <strong>AI abiline</strong>
                <p>Saan aidata väljavõtte, bilansi ja seletuskirja ettevalmistusega.</p>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  return loggedIn ? <Dashboard /> : <LoginScreen onLogin={() => setLoggedIn(true)} />;
}