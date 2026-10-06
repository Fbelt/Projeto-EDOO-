import { useEffect, useRef, useState } from "react";
import { GraduationCap, HelpCircle, LogOut, Search, ChevronRight } from "lucide-react";
import { useApp } from "../App.jsx";
import { Avatar, Icon, Tally } from "./primitives.jsx";
import { Dialog } from "./feedback.jsx";
import { StatusBadge } from "./academic.jsx";
import { semestreAtual } from "../lib/rules.js";

export const Brand = ({ onClick, inverse = true }) => (
  <a className="brand" href="#/" onClick={onClick} aria-label="EDOO Sistema Acadêmico">
    <span className="brand-mark"><GraduationCap size={18} strokeWidth={2} aria-hidden /></span>
    <span className="brand-name"><b style={inverse ? null : { color: "var(--navy)" }}>EDOO</b><span>Sistema Acadêmico</span></span>
  </a>
);

// Moldura: sidebar navy no desktop · topo compacto + barra inferior no celular
export function Shell({ user, nav, mobileNav, current, trail, children }) {
  const { d, go, chrome, openHelp, openPalette, logout } = useApp();
  const [menu, setMenu] = useState(false);
  const menuRef = useRef();
  const bottom = mobileNav || nav;
  const mainCls = ["main", chrome.dock && "has-dock", chrome.hideNav && "no-nav"].filter(Boolean).join(" ");

  useEffect(() => {
    if (!menu) return;
    const close = (e) => { if (!menuRef.current?.contains(e.target)) setMenu(false); };
    const esc = (e) => e.key === "Escape" && setMenu(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [menu]);

  return (
    <div className="app">
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById("main")?.focus(); }}>Pular para o conteúdo</a>

      <aside className="sidebar" aria-label="Navegação principal">
        <Brand onClick={(e) => { e.preventDefault(); go(nav[0].to); }} />
        <nav className="side-nav" aria-label="Seções">
          <div className="side-label">Menu</div>
          {nav.map((it) => (
            <button key={it.key} type="button" className="side-link" aria-current={current === it.key ? "page" : undefined} onClick={() => go(it.to)}>
              <Icon as={it.icon} size={18} />{it.label}<Tally n={it.tally} />
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <button type="button" className="side-link" onClick={openHelp}><Icon as={HelpCircle} size={18} />Ajuda<kbd style={{ marginLeft: "auto", background: "rgb(255 255 255 / .08)", borderColor: "rgb(255 255 255 / .14)", color: "var(--navy-text)" }}>?</kbd></button>
          <button type="button" className="side-link" onClick={logout}><Icon as={LogOut} size={18} />Sair</button>
          <div className="side-user"><Avatar name={user.name} /><div style={{ minWidth: 0 }}><b>{user.name}</b><span>{user.role}</span></div></div>
        </div>
      </aside>

      <div className={mainCls}>
        <header className="topbar">
          <nav className="crumbs" aria-label="Você está em">
            {trail.map((t, i) => (
              <span key={i} style={{ display: "contents" }}>
                {i > 0 && <ChevronRight size={14} aria-hidden />}
                {i === trail.length - 1 ? <span className="here" aria-current="page">{t.label}</span> : <button type="button" onClick={() => go(t.to)}>{t.label}</button>}
              </span>
            ))}
          </nav>
          <div className="topbar-right">
            <button type="button" className="search-trigger" onClick={openPalette} aria-label="Buscar (Ctrl K)">
              <Icon as={Search} size={16} /><span>Buscar turma, aluno ou disciplina...</span><kbd>⌘K</kbd>
            </button>
            <span className="period-chip">{semestreAtual(d)}</span>
          </div>
        </header>

        <header className="mobile-head">
          <Brand onClick={(e) => { e.preventDefault(); go(nav[0].to); }} />
          <div className="head-actions" ref={menuRef}>
            <button type="button" className="head-btn" onClick={openPalette} aria-label="Buscar"><Icon as={Search} size={20} /></button>
            <button type="button" className="head-btn" onClick={() => setMenu((m) => !m)} aria-label={`${user.name}. Abrir menu`} aria-expanded={menu}><Avatar name={user.name} /></button>
            {menu && (
              <div className="menu" role="menu">
                <div className="who"><b>{user.name}</b><span>{user.role}</span></div>
                <button type="button" role="menuitem" onClick={() => { setMenu(false); openHelp(); }}><Icon as={HelpCircle} size={18} />Ajuda</button>
                <button type="button" role="menuitem" onClick={logout}><Icon as={LogOut} size={18} />Sair</button>
              </div>
            )}
          </div>
        </header>

        <main id="main" tabIndex={-1} style={{ outline: "none" }}>{children}</main>
      </div>

      {!chrome.hideNav && (
        <nav className="bottom-nav" aria-label="Seções">
          {bottom.map((it) => (
            <button key={it.key} type="button" className="bottom-link" aria-current={(it.match || [it.key]).includes(current) ? "page" : undefined} onClick={() => go(it.to)}>
              <Icon as={it.icon} size={20} />{it.label}<Tally n={it.tally} />
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

// Cabeçalho de página: título · subtítulo · ações
export function PageHeader({ title, subtitle, actions, children }) {
  return (
    <header className="page-head">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="sub">{subtitle}</p>}
        {children}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </header>
  );
}

export function HelpDialog({ onClose }) {
  return (
    <Dialog title="Ajuda" onClose={onClose} wide>
      <div className="stack-24" style={{ fontSize: 14, color: "var(--text-2)", lineHeight: "21px" }}>
        <section className="stack-8">
          <h3 className="card-title" style={{ color: "var(--text)" }}>Atalhos</h3>
          <p><kbd>⌘K</kbd> ou <kbd>Ctrl K</kbd> abre a busca e os atalhos de navegação. <kbd>?</kbd> abre esta ajuda e <kbd>Esc</kbd> fecha janelas.</p>
        </section>
        <section className="stack-8">
          <h3 className="card-title" style={{ color: "var(--text)" }}>Como a situação é calculada</h3>
          <p><b>Sem prova final:</b> frequência abaixo de 75% reprova por falta; média 7 ou mais aprova.</p>
          <p><b>Com prova final:</b> média 7 ou mais aprova, abaixo de 3 reprova. Entre 3 e 7, o aluno faz a final e passa se (média + final) ÷ 2 for 5 ou mais.</p>
          <p>Enquanto a turma está em andamento, “se encerrasse hoje” é uma projeção (borda tracejada). O resultado oficial vale só depois de encerrar.</p>
        </section>
        <section className="stack-8">
          <h3 className="card-title" style={{ color: "var(--text)" }}>Legenda</h3>
          <div className="row">
            <StatusBadge status="Aprovado" /><StatusBadge status="Em prova final" /><StatusBadge status="Reprovado por nota" /><StatusBadge status="Cursando" />
            <StatusBadge status="Aprovado" projection prefix="Projeção: " />
          </div>
        </section>
      </div>
    </Dialog>
  );
}
