import "./styles.css";

const banks = ["Swedbank", "SEB", "LHV", "Coop", "Luminor", "Citadele"];

export default function App() {
  return (
    <main className="landing">
      <header className="topbar">
        <div className="logo"><span>AI</span><b>AI Money Flow</b></div>
        <nav><a href="#routes">Eraisik / Ettevõte</a><a href="#start">Alusta</a></nav>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">AI-põhine laenuteekonna otsing</p>
          <h1>Üks “ei” ei lõpeta rahastuse otsimist.</h1>
          <p className="lead">Laenuportaal eraisikule ja ettevõttele. Soovitud summa, sissetulek, kohustused, varad, pangad ja dokumendid pannakse üheks selgeks teekonnaks.</p>
          <div className="actions"><a className="btn" href="#start">Alusta laenuteekonda</a><a className="btn ghost" href="#routes">Vaata radu</a></div>
        </div>
        <div className="glass">
          <p className="eyebrow">Näide</p>
          <h2>Mitu teed sama summani</h2>
          <div className="stats"><span><b>72%</b> ettevalmistus</span><span><b>4</b> võimalikku rada</span></div>
          <ul><li>Pank + lisadokument</li><li>Refinantseerimine</li><li>Tagatisega variant</li></ul>
        </div>
      </section>

      <section id="routes" className="section">
        <h2>Kaks selget rada. Üks portaal.</h2>
        <div className="cards">
          <article><small>isikulaen / kodu / auto</small><h3>Eraisikule</h3><p>Isikuandmed, töökoht, netosissetulek, kohustused, varad, tagatised ja dokumendid.</p></article>
          <article><small>ettevõtte lisablokk</small><h3>Ettevõttele</h3><p>Sama kontaktisiku baas + ettevõtte nimi, registrikood, KMKR, käive, kasum, pangad ja rahastuse eesmärk.</p></article>
        </div>
      </section>

      <section className="section">
        <h2>6 panga kontroll</h2>
        <div className="banks">{banks.map((bank) => <span key={bank}>{bank}</span>)}</div>
      </section>

      <section id="start" className="section start">
        <h2>Vali, kellele rahastust otsid.</h2>
        <p>Järgmises kihis liigub klient õigesse vormi: eraisiku intake või ettevõtte lisablokiga intake.</p>
        <div className="actions"><a className="btn" href="#">Alusta eraisikuna</a><a className="btn ghost" href="#">Alusta ettevõttena</a></div>
      </section>
    </main>
  );
}
