import { useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useApp } from "../../App.jsx";
import { Button, Field, Icon, SearchBox, fieldProps, useIsMobile } from "../../components/primitives.jsx";
import { Dialog, EmptyState, ErrorPanel } from "../../components/feedback.jsx";
import { ContextLine } from "../../components/academic.jsx";
import { SeatsMeter } from "../../components/views.jsx";
import { normalize, plural } from "../../lib/format.js";
import { DIAS } from "../../lib/rules.js";

const onlyDigits = (s) => s.replace(/\D/g, "");
const maskCpf = (s) => {
  const v = onlyDigits(s).slice(0, 11);
  if (v.length <= 3) return v;
  if (v.length <= 6) return `${v.slice(0, 3)}.${v.slice(3)}`;
  if (v.length <= 9) return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6)}`;
  return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`;
};
const hasQuote = (s) => typeof s === "string" && s.includes("'");

// Moldura dos formulários: diálogo no desktop, tela inteira no celular.
// Fechar com algo digitado pergunta uma vez e preserva o que foi digitado.
function FormDialog({ title, dirty, onClose, onSubmit, submitLabel, busy, serverError, children }) {
  const mobile = useIsMobile();
  const [asking, setAsking] = useState(false);
  const tryClose = () => (dirty && !asking ? setAsking(true) : onClose());
  return (
    <Dialog title={title} onClose={tryClose} wide fullscreen={mobile}
      actions={<><Button variant="ghost" onClick={tryClose}>Cancelar</Button><Button variant="primary" onClick={onSubmit} disabled={busy}>{busy ? "Salvando…" : submitLabel}</Button></>}>
      {asking && (
        <div className="callout tone-warning" role="alert" style={{ display: "grid", gap: 12 }}>
          <div><b>Descartar o que foi digitado?</b>Se fechar agora, o que você preencheu será perdido.</div>
          <div className="row"><Button variant="primary" size="sm" onClick={() => setAsking(false)}>Continuar editando</Button><Button size="sm" onClick={onClose}>Descartar</Button></div>
        </div>
      )}
      {serverError && <ErrorPanel title={serverError.offline ? "Sem conexão." : "Não foi possível salvar."}>{serverError.offline ? "Nada foi salvo. O que você digitou continua aqui." : serverError.message}</ErrorPanel>}
      <form className="form-grid" noValidate onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
        {children}
        <button type="submit" hidden />
      </form>
    </Dialog>
  );
}

// Envia, trata erro do servidor e foca o primeiro campo com problema
function useForm(initial) {
  const [f, setF] = useState(initial);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [fieldError, setFieldError] = useState({});
  const formRef = useRef(initial);
  const set = (k, v) => { setF((x) => ({ ...x, [k]: v })); setFieldError((e) => ({ ...e, [k]: undefined })); };
  const dirty = JSON.stringify(f) !== JSON.stringify(formRef.current);
  return { f, set, touched, setTouched, busy, setBusy, serverError, setServerError, fieldError, setFieldError, dirty };
}

const focusFirstError = () => setTimeout(() => document.querySelector(".dialog [aria-invalid='true']")?.focus(), 0);

export function PersonForm({ kind, initial, onClose, onSaved }) {
  const { run, toast } = useApp();
  const isStudent = kind === "aluno";
  const editing = !!initial;
  const form = useForm(initial ? { ...initial } : { matricula: "", nome: "", cpf: "", nascimento: "", contato: "", curso: "" });
  const { f, set } = form;

  const err = { ...form.fieldError };
  if (form.touched) {
    if (!f.nome.trim()) err.nome = "Informe o nome.";
    if (!f.matricula.trim()) err.matricula = "Informe a matrícula.";
    if (isStudent && !f.curso.trim()) err.curso = "Informe o curso.";
    if (!editing && onlyDigits(f.cpf).length !== 11) err.cpf = "O CPF precisa ter 11 números.";
    if (!editing && !f.nascimento) err.nascimento = "Informe a data de nascimento.";
    for (const k of ["nome", "matricula", "curso", "contato"]) if (hasQuote(f[k])) err[k] = "Não use apóstrofo (').";
  }

  async function submit() {
    form.setTouched(true);
    const probe = { ...f };
    const bad = !probe.nome.trim() || !probe.matricula.trim() || (isStudent && !probe.curso.trim()) || (!editing && (onlyDigits(probe.cpf).length !== 11 || !probe.nascimento)) || Object.values(probe).some(hasQuote);
    if (bad) return focusFirstError();
    form.setBusy(true); form.setServerError(null);
    try {
      const r = await run(`${isStudent ? "alunos" : "professores"}/${editing ? "editar" : "criar"}`, { ...f, matricula: f.matricula.trim(), nome: f.nome.trim() });
      toast(r.mensagem);
      onSaved?.(f.matricula.trim());
      onClose();
    } catch (e) {
      if (/matr[ií]cula/i.test(e.message)) { form.setFieldError({ matricula: "Matrícula já usada por outra pessoa." }); focusFirstError(); }
      else form.setServerError(e);
    }
    form.setBusy(false);
  }

  const P = (id, help) => ({ ...fieldProps(`pf-${id}`, err[id], help), value: f[id], onChange: (e) => set(id, id === "cpf" ? maskCpf(e.target.value) : e.target.value) });
  return (
    <FormDialog title={editing ? `Editar ${isStudent ? "aluno" : "professor"}` : isStudent ? "Novo aluno" : "Novo professor"} dirty={form.dirty} onClose={onClose} onSubmit={submit}
      submitLabel={editing ? "Salvar alterações" : isStudent ? "Cadastrar aluno" : "Cadastrar professor"} busy={form.busy} serverError={form.serverError}>
      <div className="full"><Field id="pf-nome" label="Nome" help="Como aparece nas listas." error={err.nome}><input {...P("nome", "Como aparece nas listas.")} autoComplete="name" /></Field></div>
      <Field id="pf-matricula" label="Matrícula" error={err.matricula} help={editing ? "A matrícula não pode ser alterada." : "Única entre alunos e professores."}>
        <input {...P("matricula", "x")} disabled={editing} inputMode={isStudent ? "numeric" : "text"} placeholder={isStudent ? "2024005" : "P003"} />
      </Field>
      {isStudent && <Field id="pf-curso" label="Curso" error={err.curso}><input {...P("curso")} placeholder="Ciencia da Computacao" /></Field>}
      {!editing && <Field id="pf-cpf" label="CPF" error={err.cpf} help="Só números; a pontuação entra sozinha."><input {...P("cpf", "x")} inputMode="numeric" placeholder="000.000.000-00" /></Field>}
      {!editing && <Field id="pf-nascimento" label="Nascimento" error={err.nascimento}><input {...P("nascimento")} type="date" max="2026-12-31" /></Field>}
      <Field id="pf-contato" label="Contato" error={err.contato} help="Opcional."><input {...P("contato", "x")} type="email" inputMode="email" placeholder="nome@email.com" /></Field>
    </FormDialog>
  );
}

export function DisciplineForm({ initial, onClose }) {
  const { d, run, toast } = useApp();
  const editing = !!initial;
  const form = useForm(initial ? { ...initial, professor: initial.professor || "" } : { codigo: "", nome: "", cargaHoraria: "60", ementa: "", temFinal: false, professor: "" });
  const { f, set } = form;
  const err = { ...form.fieldError };
  if (form.touched) {
    if (!f.codigo.trim()) err.codigo = "Informe o código.";
    if (!f.nome.trim()) err.nome = "Informe o nome.";
    if (!(+f.cargaHoraria > 0)) err.cargaHoraria = "Use um número maior que zero.";
    for (const k of ["codigo", "nome", "ementa"]) if (hasQuote(f[k])) err[k] = "Não use apóstrofo (').";
  }
  async function submit() {
    form.setTouched(true);
    if (!f.codigo.trim() || !f.nome.trim() || !(+f.cargaHoraria > 0) || ["codigo", "nome", "ementa"].some((k) => hasQuote(f[k]))) return focusFirstError();
    form.setBusy(true); form.setServerError(null);
    try {
      const r = await run(`disciplinas/${editing ? "editar" : "criar"}`, { ...f, codigo: f.codigo.trim().toUpperCase(), cargaHoraria: String(f.cargaHoraria), temFinal: String(!!f.temFinal) });
      toast(r.mensagem); onClose();
    } catch (e) {
      if (/j[aá] existe/i.test(e.message)) { form.setFieldError({ codigo: "Código já usado por outra disciplina." }); focusFirstError(); }
      else form.setServerError(e);
    }
    form.setBusy(false);
  }
  const P = (id, help) => ({ ...fieldProps(`df-${id}`, err[id], help), value: f[id], onChange: (e) => set(id, e.target.value) });
  return (
    <FormDialog title={editing ? `Editar ${f.codigo}` : "Nova disciplina"} dirty={form.dirty} onClose={onClose} onSubmit={submit} submitLabel={editing ? "Salvar alterações" : "Cadastrar disciplina"} busy={form.busy} serverError={form.serverError}>
      <Field id="df-codigo" label="Código" error={err.codigo} help={editing ? "O código da disciplina não pode ser alterado." : "Ex: CIN0135"}><input {...P("codigo", "x")} disabled={editing} /></Field>
      <Field id="df-cargaHoraria" label="Carga horária (horas)" error={err.cargaHoraria}><input {...P("cargaHoraria")} inputMode="numeric" /></Field>
      <div className="full"><Field id="df-nome" label="Nome" error={err.nome}><input {...P("nome")} /></Field></div>
      <div className="full"><Field id="df-ementa" label="Ementa" error={err.ementa} help="Opcional. Um resumo do conteúdo."><textarea {...P("ementa", "x")} /></Field></div>
      <Field id="df-professor" label="Professor responsável" help="Pode ficar sem professor por enquanto.">
        <select {...P("professor", "x")}><option value="">Sem professor</option>{d.professores.map((p) => <option key={p.matricula} value={p.matricula}>{p.nome}</option>)}</select>
      </Field>
      <div className="field">
        <span className="label">Avaliação</span>
        <label className="check"><input type="checkbox" checked={!!f.temFinal} disabled={editing} onChange={(e) => set("temFinal", e.target.checked)} />Tem prova final</label>
        <span className="help">{editing ? "Define a regra de aprovação; não muda depois de criada." : "Com prova final: entre 3 e 7 o aluno faz a final."}</span>
      </div>
    </FormDialog>
  );
}

export function GroupForm({ onClose, onCreated }) {
  const { d, run, toast } = useApp();
  const first = d.disciplinas[0];
  const form = useForm({ disciplina: first?.codigo || "", semestre: "2026.2", codigo: "", dias: ["SEG", "QUA"], inicio: "8", fim: "10", vagas: "40", professor: first?.professor || "" });
  const { f, set } = form;
  const suggested = `${f.disciplina}-${f.semestre}`.toUpperCase();
  const code = (f.codigo.trim() || suggested).toUpperCase();
  const err = { ...form.fieldError };
  if (form.touched) {
    if (!f.disciplina) err.disciplina = "Cadastre uma disciplina antes.";
    if (!/^\d{4}\.[12]$/.test(f.semestre)) err.semestre = "Use o formato 2026.2.";
    if (!f.dias.length) err.dias = "Escolha pelo menos um dia.";
    if (+f.fim <= +f.inicio) err.fim = "O fim precisa ser depois do início.";
    if (!(+f.vagas >= 1)) err.vagas = "Pelo menos 1 vaga.";
    if (d.turmaBy[code]) err.codigo = `Já existe a turma ${code}.`;
    if (hasQuote(f.codigo)) err.codigo = "Não use apóstrofo (').";
  }
  async function submit() {
    form.setTouched(true);
    if (!f.disciplina || !/^\d{4}\.[12]$/.test(f.semestre) || !f.dias.length || +f.fim <= +f.inicio || !(+f.vagas >= 1) || d.turmaBy[code] || hasQuote(f.codigo)) return focusFirstError();
    form.setBusy(true); form.setServerError(null);
    const horario = `${DIAS.filter((x) => f.dias.includes(x)).join("/")} ${f.inicio}h-${f.fim}h`;
    try {
      const r = await run("turmas/criar", { disciplina: f.disciplina, codigo: code, semestre: f.semestre, horario, vagas: f.vagas, professor: f.professor });
      toast(r.mensagem); onClose(); onCreated?.(code);
    } catch (e) { form.setServerError(e); }
    form.setBusy(false);
  }
  const hours = Array.from({ length: 16 }, (_, i) => i + 7);
  const P = (id, help) => ({ ...fieldProps(`gf-${id}`, err[id], help), value: f[id], onChange: (e) => set(id, e.target.value) });
  return (
    <FormDialog title="Nova turma" dirty={form.dirty} onClose={onClose} onSubmit={submit} submitLabel="Criar turma" busy={form.busy} serverError={form.serverError}>
      <div className="full"><Field id="gf-disciplina" label="Disciplina" error={err.disciplina}>
        <select {...P("disciplina")} onChange={(e) => { set("disciplina", e.target.value); set("professor", d.disciplinaBy[e.target.value]?.professor || ""); }}>
          {d.disciplinas.map((x) => <option key={x.codigo} value={x.codigo}>{x.codigo} · {x.nome}</option>)}
        </select>
      </Field></div>
      <Field id="gf-semestre" label="Semestre" error={err.semestre} help="Ex: 2026.2"><input {...P("semestre", "x")} inputMode="decimal" /></Field>
      <Field id="gf-codigo" label="Código da turma" error={err.codigo} help={`Vazio usa ${suggested}.`}><input {...P("codigo", "x")} placeholder={suggested} /></Field>
      <div className="full field">
        <span className="label" id="gf-dias-l">Dias de aula</span>
        <div className="day-picker" role="group" aria-labelledby="gf-dias-l">
          {DIAS.map((x) => <button key={x} type="button" aria-pressed={f.dias.includes(x)} onClick={() => set("dias", f.dias.includes(x) ? f.dias.filter((y) => y !== x) : [...f.dias, x])}>{x}</button>)}
        </div>
        {err.dias && <span className="error" role="alert">{err.dias}</span>}
      </div>
      <Field id="gf-inicio" label="Início"><select {...P("inicio")}>{hours.slice(0, -1).map((h) => <option key={h} value={h}>{h}h</option>)}</select></Field>
      <Field id="gf-fim" label="Fim" error={err.fim}><select {...P("fim")}>{hours.slice(1).map((h) => <option key={h} value={h}>{h}h</option>)}</select></Field>
      <Field id="gf-vagas" label="Limite de vagas" error={err.vagas}><input {...P("vagas")} inputMode="numeric" /></Field>
      <Field id="gf-professor" label="Professor" help="Começa com o responsável pela disciplina. Não muda depois de criada.">
        <select {...P("professor", "x")}><option value="">Sem professor</option>{d.professores.map((p) => <option key={p.matricula} value={p.matricula}>{p.nome}</option>)}</select>
      </Field>
    </FormDialog>
  );
}

// Matricular: escolhe a turma (se não veio pronta) e depois o aluno
export function EnrollDialog({ turma, onClose }) {
  const { d, run, toast } = useApp();
  const [code, setCode] = useState(turma || null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const t = code && d.turmaBy[code];
  const open = d.turmas.filter((x) => !x.encerrada);

  if (!t) return (
    <Dialog title="Matricular aluno" onClose={onClose}>
      <p className="meta">Escolha a turma.</p>
      <ul className="mlist" style={{ border: "1px solid var(--border)", borderRadius: 10 }}>
        {open.map((x) => {
          const full = x.matriculas.length >= x.vagas;
          return (
            <li key={x.codigo}>
              <button type="button" className="mrow" disabled={full} onClick={() => setCode(x.codigo)} style={full ? { cursor: "not-allowed" } : null}>
                <span className="grow stack-4">
                  <b>{d.disciplinaBy[x.disciplina]?.nome}</b>
                  <ContextLine items={[x.codigo, full ? "Lotada: novas matrículas serão recusadas" : `${x.vagas - x.matriculas.length} vaga(s) livre(s)`]} />
                </span>
                {!full && <Icon as={ChevronRight} />}
              </button>
            </li>
          );
        })}
        {!open.length && <li><EmptyState title="Nenhuma turma em andamento." bare>Crie uma turma antes de matricular.</EmptyState></li>}
      </ul>
    </Dialog>
  );

  const inside = new Set(t.matriculas.map((m) => m.aluno));
  const list = d.alunos.filter((s) => !inside.has(s.matricula) && normalize(`${s.nome} ${s.matricula}`).includes(normalize(q)));
  const full = t.matriculas.length >= t.vagas;
  async function enroll(s) {
    setBusy(s.matricula); setError(null);
    try { await run("matriculas/criar", { turma: t.codigo, aluno: s.matricula }); toast(`${s.nome} matriculado(a) em ${t.codigo}.`); onClose(); }
    catch (e) { setError(e); }
    setBusy(null);
  }
  return (
    <Dialog title={`Matricular em ${t.codigo}`} onClose={onClose}>
      <SeatsMeter used={t.matriculas.length} total={t.vagas} />
      {full ? <p className="notice attention">Turma lotada. Novas matrículas serão recusadas.</p> : (
        <>
          {error && <ErrorPanel title={error.offline ? "Sem conexão." : "Não foi possível matricular."}>{error.offline ? "Nada foi salvo." : error.message}</ErrorPanel>}
          <SearchBox value={q} onChange={setQ} placeholder="Buscar aluno por nome ou matrícula" />
          <ul className="mlist" style={{ maxHeight: 320, overflow: "auto", border: "1px solid var(--border)", borderRadius: 10 }}>
            {list.map((s) => (
              <li key={s.matricula}>
                <button type="button" className="mrow" disabled={!!busy} onClick={() => enroll(s)}>
                  <span className="grow"><b>{s.nome}</b><span className="s num">{s.matricula} · {s.curso}</span></span>
                  <span className="link" aria-hidden>{busy === s.matricula ? "Matriculando…" : "Matricular"}</span>
                </button>
              </li>
            ))}
            {!list.length && <li><EmptyState title={q ? `Nenhum resultado para “${q}”.` : "Todos os alunos já estão nesta turma."} bare>{q ? "Procure por nome ou matrícula." : null}</EmptyState></li>}
          </ul>
          <p className="meta">{plural(t.vagas - t.matriculas.length, "vaga livre", "vagas livres")}.</p>
        </>
      )}
    </Dialog>
  );
}
