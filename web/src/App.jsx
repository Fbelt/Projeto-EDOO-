import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, CalendarDays, ClipboardCheck, Clock, Flag, GraduationCap, Home, Layers, MoreHorizontal, PenLine, Sun, User, Users } from "lucide-react";
import { loadAll, send } from "./api.js";
import { indexData, pendenciasProfessor, turmasDoAluno, turmasDoProfessor } from "./lib/rules.js";
import { endSession, homeOf, pickPerson, readSession, startSession } from "./lib/session.js";
import { Shell, HelpDialog } from "./components/layout.jsx";
import { CommandPalette } from "./components/CommandPalette.jsx";
import { ConfirmDialog, ErrorPanel, PageSkeleton, Toasts } from "./components/feedback.jsx";
import { Login } from "./pages/Login.jsx";
import * as Teacher from "./pages/teacher/index.js";
import * as Student from "./pages/student/index.js";
import * as Admin from "./pages/admin/index.js";

// ── Contexto: dados reais da API + ações para todas as telas ──
const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

// Rotas pelo "#": #/admin/turmas/EDOO-2026.2?x → { parts: [...], query: "x" }
const readHash = () => {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const [path, query = ""] = raw.split("?");
  return { parts: path.split("/").filter(Boolean).map(decodeURIComponent), query: decodeURIComponent(query) };
};

export default function App() {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [route, setRoute] = useState(readHash);
  const [session, setSession] = useState(readSession);   // login fictício (só frontend)
  const [toasts, setToasts] = useState([]);
  const [help, setHelp] = useState(false);
  const [palette, setPalette] = useState(false);
  const [chrome, setChromeState] = useState({ hideNav: false, dock: false });
  const [pendingNav, setPendingNav] = useState(null);
  const dirty = useRef(null);   // mensagem quando há alterações não salvas

  const reload = useCallback(() => {
    setLoadError(null);
    loadAll().then((d) => setData(indexData(d))).catch((e) => setLoadError(e));
  }, []);
  useEffect(reload, [reload]);

  useEffect(() => {
    const on = () => { setRoute(readHash()); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", on);
    const beforeUnload = (e) => { if (dirty.current) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", beforeUnload);
    return () => { window.removeEventListener("hashchange", on); window.removeEventListener("beforeunload", beforeUnload); };
  }, []);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback((text, { kind = "ok", undo, ms } = {}) => {
    const id = Math.random();
    setToasts((t) => [...t.slice(-2), { id, text, kind, undo }]);
    setTimeout(() => dismiss(id), ms || (undo ? 8000 : kind === "err" ? 7000 : 4000));
  }, [dismiss]);

  // Navegar: se houver alterações não salvas, pergunta uma vez
  const go = useCallback((path) => {
    if (dirty.current) { setPendingNav(path); return; }
    window.location.hash = "/" + path;
  }, []);
  const setDirty = useCallback((msg) => { dirty.current = msg || null; }, []);

  // run: chama a API e atualiza os dados; o erro sobe para a tela tratar (estados inline)
  const run = useCallback(async (path, fields) => {
    const r = await send(path, fields);
    setData(indexData(r.dados));
    return r;
  }, []);
  // act: o mesmo, com aviso automático de sucesso ou erro
  const act = useCallback(async (path, fields, { success } = {}) => {
    try {
      const r = await run(path, fields);
      toast(success || r.mensagem);
      return true;
    } catch (e) {
      toast(e.offline ? "Sem conexão. Nada foi salvo." : e.message, { kind: "err" });
      return false;
    }
  }, [run, toast]);

  // Login fictício: guarda só o perfil (e a pessoa correspondente) neste navegador
  const login = useCallback((role, email) => {
    const user = role === "admin" ? "" : pickPerson(role === "professor" ? data.professores : data.alunos, email);
    startSession({ role, user, email });
    setSession({ role, user, email });
    window.location.hash = "/" + homeOf(role, user);
  }, [data]);
  const logout = useCallback(() => {
    if (dirty.current) { setPendingNav("__logout"); return; }
    endSession(); setSession(null); window.location.hash = "/";
  }, []);

  const setChrome = useCallback((c) => setChromeState((p) => ({ ...p, ...c })), []);

  // Atalhos globais: ⌘K / Ctrl K abre a busca · "/" também · "?" abre a ajuda
  useEffect(() => {
    const on = (e) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); if (session) setPalette((p) => !p); }
      else if (e.key === "/" && !typing && session) { e.preventDefault(); setPalette(true); }
      else if (e.key === "?" && !typing && session) setHelp(true);
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [session]);

  const ctx = useMemo(() => ({
    d: data, run, act, go, toast, route, chrome, setChrome, setDirty, session, login, logout,
    openHelp: () => setHelp(true), openPalette: () => setPalette(true),
  }), [data, run, act, go, toast, route, chrome, setChrome, setDirty, session, login, logout]);

  if (loadError) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
        <div style={{ width: "min(480px, 100%)" }}>
          <ErrorPanel title={loadError.offline ? "Sem conexão com o servidor" : "Não foi possível carregar os dados"} onRetry={reload} retryLabel="Tentar agora">
            Nenhum dado foi perdido: tudo fica no banco. Ligue o servidor (<code>./servidor</code>, na pasta do projeto) e tente de novo.
          </ErrorPanel>
        </div>
      </div>
    );
  }

  return (
    <AppCtx.Provider value={ctx}>
      {!data ? <PageSkeleton /> : session ? <Router /> : <Login />}
      {help && <HelpDialog onClose={() => setHelp(false)} />}
      {palette && data && session && <CommandPalette items={paletteItems(data, session)} onClose={() => setPalette(false)} onGo={go} />}
      {pendingNav !== null && (
        <ConfirmDialog title="Sair sem salvar?" confirmLabel="Descartar alterações" cancelLabel="Continuar editando" destructive
          onClose={() => setPendingNav(null)}
          onConfirm={() => {
            dirty.current = null;
            if (pendingNav === "__logout") { endSession(); setSession(null); window.location.hash = "/"; }
            else window.location.hash = "/" + pendingNav;
            setPendingNav(null);
          }}>
          {dirty.current} Se sair agora, elas serão descartadas.
        </ConfirmDialog>
      )}
      <Toasts items={toasts} dismiss={dismiss} />
    </AppCtx.Provider>
  );
}

// Itens da Command Palette: só rotas que já existem
function paletteItems(d, session) {
  const items = [];
  const add = (group, label, to, icon, hint) => items.push({ id: `${group}|${label}|${to}`, group, label, to, icon, hint });
  if (session.role === "admin") {
    add("Ir para", "Visão geral", "admin", Home); add("Ir para", "Turmas", "admin/turmas", Layers); add("Ir para", "Alunos", "admin/alunos", User);
    add("Ir para", "Professores", "admin/professores", Users); add("Ir para", "Disciplinas", "admin/disciplinas", BookOpen);
    add("Ações", "Nova turma", "admin/turmas?nova", Layers, "criar"); add("Ações", "Novo aluno", "admin/alunos?novo", User, "cadastrar");
    d.turmas.forEach((t) => add("Turmas", `${t.codigo} · ${d.disciplinaBy[t.disciplina]?.nome}`, `admin/turmas/${t.codigo}`, Layers, t.encerrada ? "encerrada" : "em andamento"));
    d.alunos.forEach((a) => add("Alunos", a.nome, `admin/alunos?${a.matricula}`, User, a.matricula));
    d.professores.forEach((p) => add("Professores", p.nome, `admin/professores?${p.matricula}`, Users, p.matricula));
    d.disciplinas.forEach((x) => add("Disciplinas", `${x.codigo} · ${x.nome}`, "admin/disciplinas", BookOpen));
  } else if (session.role === "professor") {
    const base = `professor/${session.user}`;
    const mine = turmasDoProfessor(d, session.user).filter((t) => !t.encerrada);
    add("Ir para", "Hoje", base, Sun); add("Ir para", "Turmas", `${base}/turmas`, Layers); add("Ir para", "Pendências", `${base}/pendencias`, Flag, `${pendenciasProfessor(d, session.user).length}`);
    if (mine[0]) { add("Ações", "Fazer chamada", `${base}/turma/${mine[0].codigo}/chamada`, ClipboardCheck, mine[0].codigo); add("Ações", "Lançar notas", `${base}/turma/${mine[0].codigo}/notas`, PenLine, mine[0].codigo); }
    turmasDoProfessor(d, session.user).forEach((t) => add("Turmas", `${t.codigo} · ${d.disciplinaBy[t.disciplina]?.nome}`, `${base}/turma/${t.codigo}`, Layers, t.encerrada ? "encerrada" : "em andamento"));
  } else {
    const base = `aluno/${session.user}`;
    add("Ir para", "Início", base, Home); add("Ir para", "Horário", `${base}/horario`, CalendarDays); add("Ir para", "Histórico", `${base}/historico`, Clock);
    turmasDoAluno(d, session.user, true).forEach((t) => add("Disciplinas", d.disciplinaBy[t.disciplina]?.nome, `${base}/disciplina/${t.codigo}`, GraduationCap, t.codigo));
  }
  return items;
}

// ── Qual tela para cada endereço (e para cada perfil) ──
function Router() {
  const { d, route, session } = useApp();
  const [area, a, b, c, e] = route.parts;
  const home = homeOf(session.role, session.user);

  // Cada perfil só vê a própria área: o resto volta para a página inicial dele
  const allowed = session.role === "admin" ? area === "admin" : area === (session.role === "professor" ? "professor" : "aluno") && a === session.user;
  useEffect(() => { if (!allowed) window.location.hash = "/" + home; }, [allowed, home]);
  if (!allowed) return <PageSkeleton />;

  if (session.role === "professor") {
    const t = d.professorBy[a];
    if (!t) return <SessionMissing />;
    const pend = pendenciasProfessor(d, t.matricula).length;
    const base = `professor/${a}`;
    const current = b === "turma" || b === "turmas" ? "turmas" : b === "pendencias" ? "pendencias" : "hoje";
    const nav = [
      { key: "hoje", label: "Hoje", icon: Sun, to: base },
      { key: "turmas", label: "Turmas", icon: Layers, to: `${base}/turmas` },
      { key: "pendencias", label: "Pendências", icon: Flag, to: `${base}/pendencias`, tally: pend },
    ];
    const trail = [{ label: "Professor", to: base }];
    let page = <Teacher.Today teacher={t} />;
    if (b === "turmas") { trail.push({ label: "Turmas" }); page = <Teacher.Groups teacher={t} />; }
    if (b === "pendencias") { trail.push({ label: "Pendências" }); page = <Teacher.Pending teacher={t} />; }
    if (b === "turma") { trail.push({ label: "Turmas", to: `${base}/turmas` }, { label: c }); page = <Teacher.Group key={`${c}/${e}`} teacher={t} code={c} tab={e || "visao"} />; }
    if (!b) trail.push({ label: "Hoje" });
    return <Shell user={{ name: t.nome, role: "Professor" }} nav={nav} current={current} trail={trail}>{page}</Shell>;
  }

  if (session.role === "aluno") {
    const s = d.alunoBy[a];
    if (!s) return <SessionMissing />;
    const base = `aluno/${a}`;
    const current = b === "horario" ? "horario" : b === "historico" ? "historico" : "inicio";
    const nav = [
      { key: "inicio", label: "Início", icon: Home, to: base },
      { key: "horario", label: "Horário", icon: CalendarDays, to: `${base}/horario` },
      { key: "historico", label: "Histórico", icon: Clock, to: `${base}/historico` },
    ];
    const trail = [{ label: "Aluno", to: base }];
    let page = <Student.Home student={s} />;
    if (!b) trail.push({ label: "Início" });
    if (b === "disciplina") { trail.push({ label: "Início", to: base }, { label: c }); page = <Student.Subject student={s} code={c} />; }
    if (b === "horario") { trail.push({ label: "Horário" }); page = <Student.Schedule student={s} />; }
    if (b === "historico") { trail.push({ label: "Histórico" }); page = <Student.History student={s} />; }
    return <Shell user={{ name: s.nome, role: s.curso }} nav={nav} current={current} trail={trail}>{page}</Shell>;
  }

  // Administrador
  const current = { turmas: "turmas", alunos: "alunos", professores: "professores", disciplinas: "disciplinas", historico: "alunos", mais: "mais" }[a] || "visao";
  const nav = [
    { key: "visao", label: "Visão geral", icon: Home, to: "admin" },
    { key: "turmas", label: "Turmas", icon: Layers, to: "admin/turmas" },
    { key: "alunos", label: "Alunos", icon: User, to: "admin/alunos" },
    { key: "professores", label: "Professores", icon: Users, to: "admin/professores" },
    { key: "disciplinas", label: "Disciplinas", icon: BookOpen, to: "admin/disciplinas" },
  ];
  const mobileNav = [
    { key: "visao", label: "Início", icon: Home, to: "admin" },
    nav[1], nav[2],
    { key: "mais", label: "Mais", icon: MoreHorizontal, to: "admin/mais", match: ["mais", "professores", "disciplinas"] },
  ];
  const names = { turmas: "Turmas", alunos: "Alunos", professores: "Professores", disciplinas: "Disciplinas", historico: "Histórico escolar", busca: "Busca", mais: "Mais" };
  const trail = [{ label: "Administrador", to: "admin" }];
  if (!a) trail.push({ label: "Visão geral" });
  else if (a === "turmas" && b) trail.push({ label: "Turmas", to: "admin/turmas" }, { label: b });
  else if (a === "historico") trail.push({ label: "Alunos", to: "admin/alunos" }, { label: "Histórico escolar" });
  else trail.push({ label: names[a] || a });
  let page = <Admin.Overview />;
  if (a === "turmas") page = b ? <Admin.Group code={b} /> : <Admin.Groups />;
  if (a === "alunos") page = <Admin.People kind="aluno" />;
  if (a === "professores") page = <Admin.People kind="professor" />;
  if (a === "disciplinas") page = <Admin.Disciplines />;
  if (a === "historico") page = <Admin.Transcript mat={b} />;
  if (a === "busca") page = <Admin.Search />;
  if (a === "mais") page = <Admin.More />;
  return <Shell user={{ name: "Secretaria", role: "Administrador" }} nav={nav} mobileNav={mobileNav} current={current} trail={trail}>{page}</Shell>;
}

// Pessoa da sessão não existe mais (ex.: removida pela secretaria)
function SessionMissing() {
  const { logout } = useApp();
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: "min(480px, 100%)" }}>
        <ErrorPanel title="Não encontramos seu cadastro" onRetry={logout} retryLabel="Voltar ao login">O cadastro desta sessão pode ter sido removido pela secretaria.</ErrorPanel>
      </div>
    </div>
  );
}

// Telas com barra própria no celular (chamada, notas, prova final)
export function useChrome({ hideNav = false, dock = false }) {
  const { setChrome } = useApp();
  useEffect(() => {
    setChrome({ hideNav, dock });
    return () => setChrome({ hideNav: false, dock: false });
  }, [hideNav, dock, setChrome]);
}
