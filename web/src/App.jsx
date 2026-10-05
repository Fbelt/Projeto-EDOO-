import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, School, ScrollText, HelpCircle, LogOut,
  CheckCircle2, AlertOctagon, X, ChevronRight, CalendarDays, Home, Layers, WifiOff, RefreshCw,
} from "lucide-react";
import { loadAll, send } from "./api.js";
import { indexData } from "./lib.js";
import { Avatar, Button, SearchInput } from "./components/ui.jsx";
import { HelpModal } from "./components/shared.jsx";
import { Welcome, PersonPicker } from "./pages/Welcome.jsx";
import * as Admin from "./pages/Admin.jsx";
import * as Teacher from "./pages/Teacher.jsx";
import * as Student from "./pages/Student.jsx";

// ── Contexto: dados + ações disponíveis para todas as telas ──
const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

// Rotas pelo "#" da URL: #/admin/turmas/EDOO-2026.2 → ["admin","turmas","EDOO-2026.2"]
function useHashRoute() {
  const read = () => window.location.hash.replace(/^#\/?/, "").split("?")[0].split("/").filter(Boolean).map(decodeURIComponent);
  const [parts, setParts] = useState(read);
  useEffect(() => {
    const on = () => { setParts(read()); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const go = useCallback((path) => { window.location.hash = "/" + path; }, []);
  return [parts, go];
}

export default function App() {
  const [data, setData] = useState(null);
  const [offline, setOffline] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [help, setHelp] = useState(false);
  const [parts, go] = useHashRoute();

  const reload = useCallback(() => {
    setOffline(false);
    loadAll().then((d) => setData(indexData(d))).catch(() => setOffline(true));
  }, []);
  useEffect(reload, [reload]);

  const toast = useCallback((text, kind = "ok") => {
    const id = Math.random();
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "ok" ? 3500 : 6000);
  }, []);

  // Chama o servidor; se der certo, atualiza os dados e avisa (status sempre visível)
  const act = useCallback(async (path, fields, { quiet } = {}) => {
    try {
      const r = await send(path, fields);
      setData(indexData(r.dados));
      if (!quiet) toast(r.mensagem);
      return true;
    } catch (e) {
      toast(e.message, "err");
      return false;
    }
  }, [toast]);

  // Atalho "?" abre a ajuda em qualquer tela
  useEffect(() => {
    const on = (e) => {
      if (e.key === "?" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) setHelp(true);
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);

  const ctx = useMemo(() => ({ d: data, act, go, toast, openHelp: () => setHelp(true) }), [data, act, go, toast]);

  if (offline) return <Offline onRetry={reload} />;
  if (!data) return null;

  return (
    <AppCtx.Provider value={ctx}>
      <Router parts={parts} />
      {help && <HelpModal onClose={() => setHelp(false)} />}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`} role="status">
            {t.kind === "ok" ? <CheckCircle2 size={18} aria-hidden /> : <AlertOctagon size={18} aria-hidden />}
            <p>{t.text}</p>
            <button onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} aria-label="Fechar aviso"><X size={16} /></button>
          </div>
        ))}
      </div>
    </AppCtx.Provider>
  );
}

function Offline({ onRetry }) {
  return (
    <div className="empty" style={{ minHeight: "100%" }}>
      <div className="empty-icon"><WifiOff size={24} aria-hidden /></div>
      <b>O servidor está desligado</b>
      <p style={{ margin: 0, maxWidth: 420 }}>No terminal, dentro da pasta do projeto, rode <code>./servidor</code> e clique em tentar de novo.</p>
      <Button variant="primary" icon={RefreshCw} onClick={onRetry}>Tentar de novo</Button>
    </div>
  );
}

// ── Qual tela mostrar para cada endereço ──
function Router({ parts }) {
  const { d, go } = useApp();
  const [area, a, b, c] = parts;

  if (!area) return <Welcome />;
  if (area === "entrar") return <PersonPicker kind={a} />;

  if (area === "admin") {
    const crumbs = { alunos: "Alunos", professores: "Professores", disciplinas: "Disciplinas", turmas: "Turmas", historico: "Histórico escolar", busca: "Busca" };
    const trail = [{ label: "Administrador", to: "admin" }];
    if (a) trail.push({ label: crumbs[a] || a, to: `admin/${a}` });
    if (b) trail.push({ label: a === "historico" ? d.alunoBy[b]?.nome : b });
    let page = <Admin.Dashboard />;
    if (a === "alunos") page = <Admin.Students />;
    if (a === "professores") page = <Admin.Teachers />;
    if (a === "disciplinas") page = <Admin.Disciplines />;
    if (a === "turmas") page = b ? <Admin.GroupDetail code={b} /> : <Admin.Groups />;
    if (a === "historico") page = <Admin.TranscriptPage mat={b} />;
    if (a === "busca") page = <Admin.SearchPage />;
    return (
      <Shell profile="admin" name="Secretaria" role="Administrador" id="admin" trail={trail} current={a || "painel"}
        nav={[
          { group: "Visão geral", items: [{ key: "painel", label: "Painel", icon: LayoutDashboard, to: "admin" }] },
          { group: "Cadastros", items: [
            { key: "alunos", label: "Alunos", icon: GraduationCap, to: "admin/alunos" },
            { key: "professores", label: "Professores", icon: Users, to: "admin/professores" },
            { key: "disciplinas", label: "Disciplinas", icon: BookOpen, to: "admin/disciplinas" },
          ] },
          { group: "Acadêmico", items: [
            { key: "turmas", label: "Turmas e matrículas", icon: School, to: "admin/turmas" },
            { key: "historico", label: "Histórico escolar", icon: ScrollText, to: "admin/historico" },
          ] },
        ]}>
        {page}
      </Shell>
    );
  }

  if (area === "professor") {
    const t = d.professorBy[a];
    if (!t) return <PersonPicker kind="professor" />;
    const trail = [{ label: "Professor", to: `professor/${a}` }];
    if (b === "turma") trail.push({ label: c });
    return (
      <Shell profile="teacher" name={t.nome} role="Professor" id={t.matricula} trail={trail} current={b === "turma" ? c : "turmas"}
        nav={[{ group: "Diário", items: [
          { key: "turmas", label: "Minhas turmas", icon: Layers, to: `professor/${a}` },
          ...d.turmas.filter((g) => g.professor === a).map((g) => ({ key: g.codigo, label: g.codigo, icon: School, to: `professor/${a}/turma/${g.codigo}` })),
        ] }]}>
        {b === "turma" ? <Teacher.Diary teacher={t} code={c} /> : <Teacher.Home teacher={t} />}
      </Shell>
    );
  }

  if (area === "aluno") {
    const s = d.alunoBy[a];
    if (!s) return <PersonPicker kind="aluno" />;
    const labels = { horario: "Horário semanal", historico: "Histórico escolar" };
    const trail = [{ label: "Aluno", to: `aluno/${a}` }];
    if (b) trail.push({ label: labels[b] });
    return (
      <Shell profile="student" name={s.nome} role={s.curso} id={s.matricula} trail={trail} current={b || "inicio"}
        nav={[{ group: "Semestre atual", items: [
          { key: "inicio", label: "Minhas disciplinas", icon: Home, to: `aluno/${a}` },
          { key: "horario", label: "Horário semanal", icon: CalendarDays, to: `aluno/${a}/horario` },
        ] }, { group: "Vida acadêmica", items: [
          { key: "historico", label: "Histórico escolar", icon: ScrollText, to: `aluno/${a}/historico` },
        ] }]}>
        {b === "horario" ? <Student.Timetable student={s} /> : b === "historico" ? <Student.History student={s} /> : <Student.Home student={s} />}
      </Shell>
    );
  }

  return <Welcome />;
}

// ── Moldura das telas: menu lateral + barra do topo ──
function Shell({ profile, name, role, id, nav, current, trail, children }) {
  const { go, openHelp } = useApp();
  const [q, setQ] = useState("");
  const searchRef = useRef();

  // Atalho "/" foca a busca (eficiência para quem já conhece)
  useEffect(() => {
    if (profile !== "admin") return;
    const on = (e) => {
      if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [profile]);

  return (
    <div className="shell" data-profile={profile}>
      <aside className="sidebar">
        <a className="logo" href="#/" aria-label="EDOO Acadêmico, voltar ao início">
          <span className="logo-mark"><School size={18} aria-hidden /></span>EDOO Acadêmico
        </a>
        <div className="profile-chip">
          <Avatar name={name} id={id} size={40} />
          <div className="who"><b>{name}</b><span>{role}</span></div>
        </div>
        {nav.map((g) => (
          <nav className="nav" key={g.group} aria-label={g.group}>
            <div className="nav-label">{g.group}</div>
            {g.items.map((it) => (
              <button key={it.key} className="nav-item" aria-current={current === it.key ? "page" : undefined} onClick={() => go(it.to)}>
                <it.icon size={18} aria-hidden />{it.label}
              </button>
            ))}
          </nav>
        ))}
        <div className="sidebar-foot">
          <button className="nav-item" onClick={openHelp}><HelpCircle size={18} aria-hidden />Ajuda <kbd style={{ marginLeft: "auto" }}>?</kbd></button>
          <button className="nav-item" onClick={() => go("")}><LogOut size={18} aria-hidden />Trocar de perfil</button>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <nav className="crumbs" aria-label="Você está em">
            <button onClick={() => go("")}>Início</button>
            {trail.map((t, i) => (
              <span key={i} style={{ display: "contents" }}>
                <ChevronRight size={14} aria-hidden />
                {i === trail.length - 1 ? <span className="here" aria-current="page">{t.label}</span> : <button onClick={() => go(t.to)}>{t.label}</button>}
              </span>
            ))}
          </nav>
          <div className="topbar-right">
            {profile === "admin" && (
              <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) { go(`admin/busca?${encodeURIComponent(q.trim())}`); setQ(""); searchRef.current.blur(); } }} style={{ width: 280 }}>
                <SearchInput value={q} onChange={setQ} placeholder="Buscar no sistema" inputRef={searchRef} shortcut="/" />
              </form>
            )}
            <Button variant="ghost" icon={HelpCircle} onClick={openHelp} aria-label="Ajuda" />
          </div>
        </div>
        <main className="content" key={trail.map((t) => t.label).join("/")}>{children}</main>
      </div>
    </div>
  );
}
