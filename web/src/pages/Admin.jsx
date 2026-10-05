import { useMemo, useState } from "react";
import {
  GraduationCap, Users, BookOpen, Award, Plus, Pencil, Trash2, ScrollText, School, UserPlus, UserMinus,
  Lock, AlertTriangle, ArrowRight, SearchX, CalendarClock, Info,
} from "lucide-react";
import { useApp } from "../App.jsx";
import { AttendanceMeter, Avatar, Badge, Button, Confirm, Empty, Field, Kpi, Modal, PageHeader, SearchInput, StatusBadge } from "../components/ui.jsx";
import { GroupCard, GroupKpis, GroupTable, TranscriptView } from "../components/shared.jsx";
import { DIAS, aprovacaoGeral, fmt, normalize, statsTurma, turmasDoAluno, turmasDoProfessor } from "../lib.js";

// ═════════════════════════════ PAINEL ═════════════════════════════

export function Dashboard() {
  const { d, go } = useApp();
  const geral = aprovacaoGeral(d);
  const abertas = d.turmas.filter((t) => !t.encerrada);
  // Alunos em risco: frequência abaixo de 75% numa turma aberta
  const risco = abertas.flatMap((t) => t.matriculas.filter((m) => m.frequencia < 75 || m.previsao !== "Aprovado").map((m) => ({ t, m })));

  return (
    <>
      <PageHeader title="Painel da Secretaria" subtitle="Visão geral do semestre e do que precisa de atenção">
        <Button icon={UserPlus} onClick={() => go("admin/alunos?novo")}>Novo aluno</Button>
        <Button variant="primary" icon={Plus} onClick={() => go("admin/turmas?nova")}>Nova turma</Button>
      </PageHeader>

      <div className="kpis">
        <Kpi icon={GraduationCap} label="Alunos" value={d.alunos.length} hint={`${new Set(abertas.flatMap((t) => t.matriculas.map((m) => m.aluno))).size} cursando agora`} />
        <Kpi icon={Users} label="Professores" value={d.professores.length} hint={`${d.disciplinas.length} disciplinas cadastradas`} delay={40} />
        <Kpi icon={School} label="Turmas abertas" value={abertas.length} hint={`${d.turmas.length - abertas.length} encerrada(s)`} delay={80} />
        <Kpi icon={Award} label="Aprovação geral" value={geral == null ? "—" : `${fmt(geral, 0)}%`} hint="Turmas já encerradas" delay={120} />
      </div>

      <div className="grid-2" style={{ marginTop: "var(--s-16)" }}>
        <section className="card card-pad">
          <div className="row-between" style={{ marginBottom: "var(--s-24)" }}>
            <h2 style={{ margin: 0, fontSize: "var(--t-16)", fontWeight: 600 }}>Aprovação por turma</h2>
            <span className="muted" style={{ fontSize: "var(--t-12)" }}>turma aberta = previsão</span>
          </div>
          {!d.turmas.length ? <Empty title="Nenhuma turma" /> : (
            <div className="bars">
              {d.turmas.map((t) => {
                const st = statsTurma(t);
                const v = st.taxa ?? 0;
                return (
                  <div className="bar-row" key={t.codigo}>
                    <span className="lbl" title={t.codigo}>{t.codigo}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${v}%`, opacity: st.previsao ? 0.55 : 1 }} />
                      <span className="tip" style={{ "--x": `${Math.max(v, 12)}%` }}>{st.aprovados} de {st.n} {st.previsao ? "aprovariam hoje" : "aprovados"}</span>
                    </div>
                    <span className="num" style={{ fontWeight: 600, textAlign: "right" }}>{st.taxa == null ? "—" : `${fmt(v, 0)}%`}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="card card-pad">
          <div className="row-between" style={{ marginBottom: "var(--s-16)" }}>
            <h2 style={{ margin: 0, fontSize: "var(--t-16)", fontWeight: 600 }}>Precisa de atenção</h2>
            <Badge tone={risco.length ? "warning" : "good"} icon={risco.length ? AlertTriangle : Award}>{risco.length ? `${risco.length} aluno(s)` : "Tudo certo"}</Badge>
          </div>
          {!risco.length ? <Empty icon={Award} title="Ninguém em risco nas turmas abertas" /> : (
            <div className="stack-8">
              {risco.slice(0, 5).map(({ t, m }) => {
                const s = d.alunoBy[m.aluno];
                return (
                  <button key={t.codigo + m.aluno} className="picker-item" onClick={() => go(`admin/turmas/${t.codigo}`)}>
                    <Avatar name={s?.nome} id={m.aluno} size={32} />
                    <span style={{ flex: 1, minWidth: 0 }}><b>{s?.nome}</b><span>{t.codigo} · média {fmt(m.media)}</span></span>
                    <StatusBadge status={m.previsao} />
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <h2 className="section-title">Turmas abertas <span className="count">{abertas.length}</span></h2>
      <div className="grid-3">
        {abertas.map((t, i) => <GroupCard key={t.codigo} t={t} delay={i * 40} onOpen={() => go(`admin/turmas/${t.codigo}`)} />)}
        {!abertas.length && <div className="card"><Empty icon={School} title="Nenhuma turma aberta" /></div>}
      </div>
    </>
  );
}

// ═════════════════════════════ PESSOAS ═════════════════════════════

const onlyDigits = (s) => s.replace(/\D/g, "");
const maskCpf = (s) => {
  const v = onlyDigits(s).slice(0, 11);
  return v.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3").replace(/(\d{3})-?(\d{1,2})$/, (m, a, b) => (v.length > 9 ? `${a}-${b}` : m));
};

// Formulário de aluno ou professor (criar ou editar)
function PersonForm({ kind, initial, onClose }) {
  const { act } = useApp();
  const editing = !!initial;
  const isStudent = kind === "aluno";
  const [f, setF] = useState(initial || { matricula: "", nome: "", cpf: "", nascimento: "", contato: "", curso: "" });
  const [touched, setTouched] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: k === "cpf" ? maskCpf(e.target.value) : e.target.value });

  // Validação de entrada antes de enviar
  const err = {};
  if (!f.matricula.trim()) err.matricula = "Informe a matrícula.";
  if (!f.nome.trim()) err.nome = "Informe o nome.";
  if (isStudent && !f.curso.trim()) err.curso = "Informe o curso.";
  if (!editing && onlyDigits(f.cpf).length !== 11) err.cpf = "O CPF precisa ter 11 números.";
  if (!editing && !f.nascimento) err.nascimento = "Escolha a data.";
  for (const k of Object.keys(f)) if (typeof f[k] === "string" && f[k].includes("'")) err[k] = "Não use apóstrofo (').";
  const valid = !Object.keys(err).length;

  async function submit(e) {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    const path = `${isStudent ? "alunos" : "professores"}/${editing ? "editar" : "criar"}`;
    if (await act(path, f)) onClose();
  }
  const show = (k) => touched && err[k];

  return (
    <Modal title={`${editing ? "Editar" : "Novo"} ${isStudent ? "aluno" : "professor"}`} subtitle={editing ? f.matricula : "Os campos marcados são obrigatórios"} onClose={onClose}
      footer={<><Button onClick={onClose}>Cancelar</Button><Button variant="primary" onClick={submit}>{editing ? "Salvar alterações" : "Cadastrar"}</Button></>}>
      <form className="form-grid" onSubmit={submit}>
        <Field label="Nome completo *" error={show("nome")}><input className="input" value={f.nome} onChange={set("nome")} aria-invalid={!!show("nome")} /></Field>
        <Field label={`${isStudent ? "Matrícula" : "Matrícula funcional"} *`} error={show("matricula")} hint={editing && "A matrícula não pode mudar"}>
          <input className="input" value={f.matricula} onChange={set("matricula")} disabled={editing} aria-invalid={!!show("matricula")} placeholder={isStudent ? "2024005" : "P003"} />
        </Field>
        {!editing && <>
          <Field label="CPF *" error={show("cpf")}><input className="input num" value={f.cpf} onChange={set("cpf")} inputMode="numeric" placeholder="000.000.000-00" aria-invalid={!!show("cpf")} /></Field>
          <Field label="Nascimento *" error={show("nascimento")}><input className="input" type="date" value={f.nascimento} onChange={set("nascimento")} max="2026-12-31" aria-invalid={!!show("nascimento")} /></Field>
        </>}
        {isStudent && <Field label="Curso *" error={show("curso")}><input className="input" value={f.curso} onChange={set("curso")} placeholder="Ciencia da Computacao" aria-invalid={!!show("curso")} /></Field>}
        <Field label="E-mail ou telefone" error={show("contato")}><input className="input" value={f.contato} onChange={set("contato")} placeholder="nome@ufpe.br" /></Field>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

// Tela de lista (alunos ou professores) com busca, cadastro, edição e remoção
function PeoplePage({ kind }) {
  const { d, act, go } = useApp();
  const isStudent = kind === "aluno";
  const list = isStudent ? d.alunos : d.professores;
  const [q, setQ] = useState("");
  const [form, setForm] = useState(() => (window.location.hash.endsWith("?novo") ? "new" : null));
  const [del, setDel] = useState(null);
  const shown = list.filter((p) => normalize(`${p.nome} ${p.matricula} ${p.curso || ""}`).includes(normalize(q)));

  // Professor com turma ou disciplina não pode ser removido (mostra o motivo antes)
  const blockReason = (p) => {
    if (isStudent) return null;
    const ts = turmasDoProfessor(d, p.matricula);
    if (ts.length) return `${p.nome} ainda dá aula em ${ts.map((t) => t.codigo).join(", ")}. Remova ou passe essas turmas antes.`;
    if (p.disciplinas.length) return `${p.nome} é responsável por ${p.disciplinas.join(", ")}. Troque o responsável em Disciplinas antes.`;
    return null;
  };

  return (
    <>
      <PageHeader title={isStudent ? "Alunos" : "Professores"} subtitle={`${list.length} cadastrado(s)`}>
        <Button variant="primary" icon={Plus} onClick={() => setForm("new")}>{isStudent ? "Novo aluno" : "Novo professor"}</Button>
      </PageHeader>
      <div style={{ maxWidth: 400, marginBottom: "var(--s-16)" }}>
        <SearchInput value={q} onChange={setQ} placeholder={`Filtrar ${isStudent ? "alunos" : "professores"} por nome ou matrícula`} />
      </div>
      <div className="card">
        {!shown.length ? <Empty icon={SearchX} title="Ninguém encontrado">{q ? "Tente só uma parte do nome." : "Cadastre o primeiro."}</Empty> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Nome</th>{isStudent ? <th>Curso</th> : <th>Disciplinas</th>}<th>Contato</th><th className="right">Turmas</th><th className="right">Ações</th></tr></thead>
              <tbody>
                {shown.map((p) => {
                  const n = isStudent ? turmasDoAluno(d, p.matricula).length : turmasDoProfessor(d, p.matricula).length;
                  return (
                    <tr key={p.matricula}>
                      <td><div className="person"><Avatar name={p.nome} id={p.matricula} size={32} /><div><b>{p.nome}</b><span>{p.matricula} · CPF {p.cpf}</span></div></div></td>
                      <td>{isStudent ? p.curso : (p.disciplinas.length ? <div className="chips">{p.disciplinas.map((c) => <span key={c} className="chip">{c}</span>)}</div> : <span className="muted">nenhuma</span>)}</td>
                      <td className="muted">{p.contato || "—"}</td>
                      <td className="right num">{n}</td>
                      <td>
                        <div className="row-actions">
                          {isStudent && <Button variant="ghost" size="sm" icon={ScrollText} onClick={() => go(`admin/historico/${p.matricula}`)} aria-label={`Histórico de ${p.nome}`} title="Histórico escolar" />}
                          <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setForm(p)} aria-label={`Editar ${p.nome}`} title="Editar" />
                          <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDel(p)} aria-label={`Remover ${p.nome}`} title="Remover" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {form && <PersonForm kind={kind} initial={form === "new" ? null : form} onClose={() => setForm(null)} />}
      {del && (blockReason(del) ? (
        <Modal title="Não dá para remover ainda" icon={<span className="danger-icon"><Lock size={20} aria-hidden /></span>} onClose={() => setDel(null)}
          footer={<Button variant="primary" onClick={() => setDel(null)}>Entendi</Button>}>
          <p style={{ margin: 0, color: "var(--text-2)" }}>{blockReason(del)}</p>
        </Modal>
      ) : (
        <Confirm title={`Remover ${del.nome}?`} onClose={() => setDel(null)}
          onConfirm={async () => { await act(`${isStudent ? "alunos" : "professores"}/remover`, { matricula: del.matricula }); setDel(null); }}>
          {isStudent && turmasDoAluno(d, del.matricula).length
            ? <>O aluno sairá de <b>{turmasDoAluno(d, del.matricula).length} turma(s)</b> e perderá notas e frequência. Isso não pode ser desfeito.</>
            : "Isso não pode ser desfeito."}
        </Confirm>
      ))}
    </>
  );
}

export const Students = () => <PeoplePage kind="aluno" />;
export const Teachers = () => <PeoplePage kind="professor" />;

// ═════════════════════════════ DISCIPLINAS ═════════════════════════════

function DisciplineForm({ initial, onClose }) {
  const { d, act } = useApp();
  const editing = !!initial;
  const [f, setF] = useState(initial ? { ...initial, professor: initial.professor || "" } : { codigo: "", nome: "", cargaHoraria: 60, ementa: "", temFinal: false, professor: "" });
  const [touched, setTouched] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const err = {};
  if (!f.codigo.trim()) err.codigo = "Informe o código.";
  if (!f.nome.trim()) err.nome = "Informe o nome.";
  if (!(+f.cargaHoraria > 0)) err.cargaHoraria = "Use um número maior que zero.";
  for (const k of ["codigo", "nome", "ementa"]) if (f[k].includes("'")) err[k] = "Não use apóstrofo (').";
  const show = (k) => touched && err[k];

  async function submit(e) {
    e.preventDefault();
    setTouched(true);
    if (Object.keys(err).length) return;
    if (await act(`disciplinas/${editing ? "editar" : "criar"}`, { ...f, codigo: f.codigo.toUpperCase(), temFinal: String(f.temFinal) })) onClose();
  }

  return (
    <Modal title={editing ? `Editar ${f.codigo}` : "Nova disciplina"} onClose={onClose}
      footer={<><Button onClick={onClose}>Cancelar</Button><Button variant="primary" onClick={submit}>{editing ? "Salvar alterações" : "Cadastrar"}</Button></>}>
      <form className="form-grid" onSubmit={submit}>
        <Field label="Código *" error={show("codigo")} hint={editing && "O código não pode mudar"}><input className="input" value={f.codigo} onChange={set("codigo")} disabled={editing} placeholder="CIN0135" /></Field>
        <Field label="Carga horária *" error={show("cargaHoraria")}><input className="input num" type="number" min="1" value={f.cargaHoraria} onChange={set("cargaHoraria")} /></Field>
        <div className="full"><Field label="Nome *" error={show("nome")}><input className="input" value={f.nome} onChange={set("nome")} /></Field></div>
        <div className="full"><Field label="Ementa" error={show("ementa")}><textarea className="input" value={f.ementa} onChange={set("ementa")} placeholder="Resumo do conteúdo" /></Field></div>
        <Field label="Professor responsável">
          <select className="input" value={f.professor} onChange={set("professor")}>
            <option value="">Sem professor</option>
            {d.professores.map((p) => <option key={p.matricula} value={p.matricula}>{p.nome}</option>)}
          </select>
        </Field>
        <Field label="Avaliação" hint={editing ? "Não muda depois de criada (define o tipo de matrícula)" : "Com prova final usa FinalExamEnrollment"}>
          <label className="toggle" style={{ height: 40, opacity: editing ? 0.6 : 1 }}>
            <input type="checkbox" className="sr-only" checked={f.temFinal} onChange={set("temFinal")} disabled={editing} />
            <span className="switch" aria-hidden />Tem prova final
          </label>
        </Field>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

export function Disciplines() {
  const { d, act } = useApp();
  const [form, setForm] = useState(null);
  const [del, setDel] = useState(null);
  const turmasDe = (c) => d.turmas.filter((t) => t.disciplina === c);

  return (
    <>
      <PageHeader title="Disciplinas" subtitle={`${d.disciplinas.length} cadastrada(s)`}>
        <Button variant="primary" icon={Plus} onClick={() => setForm("new")}>Nova disciplina</Button>
      </PageHeader>
      <div className="card">
        {!d.disciplinas.length ? <Empty icon={BookOpen} title="Nenhuma disciplina" /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Disciplina</th><th>Professor</th><th className="right">Carga</th><th>Avaliação</th><th className="right">Turmas</th><th className="right">Ações</th></tr></thead>
              <tbody>
                {d.disciplinas.map((x) => {
                  const p = d.professorBy[x.professor];
                  return (
                    <tr key={x.codigo}>
                      <td><b>{x.nome}</b><div className="muted" style={{ fontSize: "var(--t-12)" }}>{x.codigo}{x.ementa && ` · ${x.ementa}`}</div></td>
                      <td>{p ? <div className="person"><Avatar name={p.nome} id={p.matricula} size={24} /><span style={{ color: "var(--text)", fontSize: "var(--t-14)" }}>{p.nome}</span></div> : <span className="muted">Sem professor</span>}</td>
                      <td className="right num">{x.cargaHoraria}h</td>
                      <td>{x.temFinal ? <Badge tone="warning">Com prova final</Badge> : <Badge>Sem prova final</Badge>}</td>
                      <td className="right num">{turmasDe(x.codigo).length}</td>
                      <td><div className="row-actions">
                        <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setForm(x)} aria-label={`Editar ${x.nome}`} />
                        <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDel(x)} aria-label={`Remover ${x.nome}`} />
                      </div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {form && <DisciplineForm initial={form === "new" ? null : form} onClose={() => setForm(null)} />}
      {del && (turmasDe(del.codigo).length ? (
        <Modal title="Não dá para remover ainda" icon={<span className="danger-icon"><Lock size={20} aria-hidden /></span>} onClose={() => setDel(null)}
          footer={<Button variant="primary" onClick={() => setDel(null)}>Entendi</Button>}>
          <p style={{ margin: 0, color: "var(--text-2)" }}>{del.nome} tem a(s) turma(s) {turmasDe(del.codigo).map((t) => t.codigo).join(", ")}. Remova as turmas antes.</p>
        </Modal>
      ) : (
        <Confirm title={`Remover ${del.codigo}?`} onClose={() => setDel(null)} onConfirm={async () => { await act("disciplinas/remover", { codigo: del.codigo }); setDel(null); }}>
          A disciplina {del.nome} será apagada. Isso não pode ser desfeito.
        </Confirm>
      ))}
    </>
  );
}

// ═════════════════════════════ TURMAS ═════════════════════════════

function GroupForm({ onClose }) {
  const { d, act, go } = useApp();
  const [disc, setDisc] = useState(d.disciplinas[0]?.codigo || "");
  const [sem, setSem] = useState("2026.2");
  const [code, setCode] = useState("");
  const [dias, setDias] = useState(["SEG", "QUA"]);
  const [ini, setIni] = useState(8);
  const [fim, setFim] = useState(10);
  const [vagas, setVagas] = useState(40);
  const [prof, setProf] = useState(d.disciplinaBy[d.disciplinas[0]?.codigo]?.professor || "");
  const [touched, setTouched] = useState(false);
  const suggested = `${disc}-${sem}`;
  const finalCode = (code || suggested).toUpperCase();

  const err = {};
  if (!disc) err.disc = "Cadastre uma disciplina antes.";
  if (!/^\d{4}\.[12]$/.test(sem)) err.sem = "Use o formato 2026.2";
  if (!dias.length) err.dias = "Escolha pelo menos um dia.";
  if (fim <= ini) err.fim = "O fim precisa ser depois do início.";
  if (!(vagas >= 1)) err.vagas = "Pelo menos 1 vaga.";
  if (d.turmaBy[finalCode]) err.code = `Já existe a turma ${finalCode}.`;
  const show = (k) => touched && err[k];

  async function submit(e) {
    e.preventDefault();
    setTouched(true);
    if (Object.keys(err).length) return;
    const horario = `${DIAS.filter((x) => dias.includes(x)).join("/")} ${ini}h-${fim}h`;
    if (await act("turmas/criar", { disciplina: disc, codigo: finalCode, semestre: sem, horario, vagas, professor: prof })) {
      onClose();
      go(`admin/turmas/${finalCode}`);
    }
  }
  const hours = Array.from({ length: 16 }, (_, i) => i + 7);

  return (
    <Modal title="Nova turma" subtitle="Uma disciplina oferecida em um semestre" onClose={onClose} width={600}
      footer={<><Button onClick={onClose}>Cancelar</Button><Button variant="primary" onClick={submit}>Criar turma</Button></>}>
      <form className="form-grid" onSubmit={submit}>
        <div className="full"><Field label="Disciplina *" error={show("disc")}>
          <select className="input" value={disc} onChange={(e) => { setDisc(e.target.value); setProf(d.disciplinaBy[e.target.value]?.professor || ""); }}>
            {d.disciplinas.map((x) => <option key={x.codigo} value={x.codigo}>{x.codigo} · {x.nome}</option>)}
          </select>
        </Field></div>
        <Field label="Semestre *" error={show("sem")}><input className="input num" value={sem} onChange={(e) => setSem(e.target.value)} placeholder="2026.2" /></Field>
        <Field label="Código da turma" error={show("code")} hint={`Deixe vazio para usar ${suggested}`}><input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder={suggested} /></Field>
        <div className="full"><Field label="Dias de aula *" error={show("dias")}>
          <div className="segmented" role="group" aria-label="Dias de aula">
            {DIAS.map((x) => (
              <button type="button" key={x} aria-pressed={dias.includes(x)} onClick={() => setDias(dias.includes(x) ? dias.filter((y) => y !== x) : [...dias, x])}>{x}</button>
            ))}
          </div>
        </Field></div>
        <Field label="Início"><select className="input" value={ini} onChange={(e) => setIni(+e.target.value)}>{hours.slice(0, -1).map((h) => <option key={h} value={h}>{h}h</option>)}</select></Field>
        <Field label="Fim" error={show("fim")}><select className="input" value={fim} onChange={(e) => setFim(+e.target.value)}>{hours.slice(1).map((h) => <option key={h} value={h}>{h}h</option>)}</select></Field>
        <Field label="Limite de vagas *" error={show("vagas")}><input className="input num" type="number" min="1" value={vagas} onChange={(e) => setVagas(+e.target.value)} /></Field>
        <Field label="Professor" hint="Já vem o responsável pela disciplina">
          <select className="input" value={prof} onChange={(e) => setProf(e.target.value)}>
            <option value="">Sem professor</option>
            {d.professores.map((p) => <option key={p.matricula} value={p.matricula}>{p.nome}</option>)}
          </select>
        </Field>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

export function Groups() {
  const { d, go } = useApp();
  const [filter, setFilter] = useState("abertas");
  const [form, setForm] = useState(() => window.location.hash.endsWith("?nova"));
  const list = d.turmas.filter((t) => filter === "todas" || (filter === "abertas" ? !t.encerrada : t.encerrada));
  const count = { abertas: d.turmas.filter((t) => !t.encerrada).length, encerradas: d.turmas.filter((t) => t.encerrada).length, todas: d.turmas.length };

  return (
    <>
      <PageHeader title="Turmas e matrículas" subtitle="Abra uma turma para matricular alunos, ver o relatório ou encerrá-la">
        <Button variant="primary" icon={Plus} onClick={() => setForm(true)}>Nova turma</Button>
      </PageHeader>
      <div className="segmented" role="group" aria-label="Filtrar turmas" style={{ marginBottom: "var(--s-24)" }}>
        {["abertas", "encerradas", "todas"].map((k) => (
          <button key={k} aria-pressed={filter === k} onClick={() => setFilter(k)}>{k[0].toUpperCase() + k.slice(1)} <span className="muted num">{count[k]}</span></button>
        ))}
      </div>
      <div className="grid-3">
        {list.map((t, i) => <GroupCard key={t.codigo} t={t} delay={i * 40} onOpen={() => go(`admin/turmas/${t.codigo}`)} />)}
      </div>
      {!list.length && <div className="card"><Empty icon={School} title={`Nenhuma turma ${filter === "todas" ? "" : filter.slice(0, -1)}`} /></div>}
      {form && <GroupForm onClose={() => setForm(false)} />}
    </>
  );
}

// Escolher um aluno para matricular
function EnrollModal({ t, onClose }) {
  const { d, act } = useApp();
  const [q, setQ] = useState("");
  const inside = new Set(t.matriculas.map((m) => m.aluno));
  const free = t.vagas - t.matriculas.length;
  const list = d.alunos.filter((s) => !inside.has(s.matricula) && normalize(s.nome + s.matricula).includes(normalize(q)));

  return (
    <Modal title={`Matricular em ${t.codigo}`} subtitle={`${free} vaga(s) livre(s) de ${t.vagas}`} onClose={onClose}>
      <div style={{ display: "grid", gap: 16 }}>
        <SearchInput value={q} onChange={setQ} placeholder="Buscar aluno por nome ou matrícula" />
        <div className="picker-list">
          {list.map((s) => (
            <button key={s.matricula} className="picker-item" onClick={async () => { if (await act("matriculas/criar", { turma: t.codigo, aluno: s.matricula })) onClose(); }}>
              <Avatar name={s.nome} id={s.matricula} size={32} />
              <span style={{ flex: 1 }}><b>{s.nome}</b><span>{s.matricula} · {s.curso}</span></span>
              <UserPlus size={18} className="muted" aria-hidden />
            </button>
          ))}
          {!list.length && <Empty icon={Users} title={q ? "Ninguém encontrado" : "Todos os alunos já estão nesta turma"} />}
        </div>
      </div>
    </Modal>
  );
}

export function GroupDetail({ code }) {
  const { d, act, go } = useApp();
  const t = d.turmaBy[code];
  const [enroll, setEnroll] = useState(false);
  const [confirm, setConfirm] = useState(null);   // "encerrar" | "remover" | { aluno }
  if (!t) return <Empty icon={SearchX} title="Turma não encontrada"><Button onClick={() => go("admin/turmas")}>Ver turmas</Button></Empty>;

  const disc = d.disciplinaBy[t.disciplina];
  const prof = d.professorBy[t.professor];
  const full = t.matriculas.length >= t.vagas;
  // Prevenção de erro: o botão já explica por que não dá para matricular
  const enrollBlock = t.encerrada ? "Turma encerrada não aceita matrícula" : full ? "Turma lotada" : null;

  return (
    <>
      <PageHeader title={disc?.nome} subtitle={`${t.codigo} · ${t.semestre} · ${t.horario} · ${prof ? "Prof. " + prof.nome : "sem professor"}`}>
        <Button icon={Trash2} onClick={() => setConfirm("remover")}>Remover</Button>
        {!t.encerrada && <Button icon={Lock} onClick={() => setConfirm("encerrar")}>Encerrar turma</Button>}
        <Button variant="primary" icon={UserPlus} onClick={() => setEnroll(true)} disabled={!!enrollBlock} title={enrollBlock || ""}>Matricular aluno</Button>
      </PageHeader>

      {t.encerrada ? (
        <div className="banner tone-neutral"><Lock size={20} aria-hidden /><p><b>Turma encerrada</b>A situação de cada aluno é final. Notas e matrículas não mudam mais.</p></div>
      ) : full ? (
        <div className="banner tone-warning"><AlertTriangle size={20} aria-hidden /><p><b>Turma lotada</b>As {t.vagas} vagas estão ocupadas. Desmatricule alguém ou crie outra turma.</p></div>
      ) : null}

      <GroupKpis t={t} />
      <h2 className="section-title">Alunos matriculados <span className="count">{t.matriculas.length}/{t.vagas}</span>
        <span className="muted" style={{ marginLeft: "auto", fontSize: "var(--t-12)", fontWeight: 500 }}>{disc?.temFinal ? "Com prova final" : "Sem prova final"}</span>
      </h2>
      <div className="card">
        <GroupTable t={t} extraHead="" renderExtra={(m, s) => (
          <Button variant="ghost" size="sm" icon={UserMinus} onClick={() => setConfirm({ aluno: m.aluno, nome: s?.nome })} aria-label={`Desmatricular ${s?.nome}`} title="Desmatricular" />
        )} />
      </div>

      {enroll && <EnrollModal t={t} onClose={() => setEnroll(false)} />}
      {confirm === "encerrar" && (
        <Confirm title={`Encerrar ${t.codigo}?`} confirmLabel="Encerrar turma" onClose={() => setConfirm(null)}
          onConfirm={async () => { await act("turmas/encerrar", { turma: t.codigo }); setConfirm(null); }}>
          A situação final de cada aluno será calculada e a turma não aceitará mais matrículas nem notas. Isso não pode ser desfeito.
        </Confirm>
      )}
      {confirm === "remover" && (
        <Confirm title={`Remover ${t.codigo}?`} onClose={() => setConfirm(null)}
          onConfirm={async () => { if (await act("turmas/remover", { turma: t.codigo })) go("admin/turmas"); }}>
          A turma e as <b>{t.matriculas.length} matrícula(s)</b> dela, com notas e frequência, serão apagadas. Isso não pode ser desfeito.
        </Confirm>
      )}
      {confirm?.aluno && (
        <Confirm title={`Desmatricular ${confirm.nome}?`} confirmLabel="Desmatricular" onClose={() => setConfirm(null)}
          onConfirm={async () => { await act("matriculas/remover", { turma: t.codigo, aluno: confirm.aluno }); setConfirm(null); }}>
          {confirm.nome} sairá de {t.codigo} e perderá as notas e a frequência desta turma.
        </Confirm>
      )}
    </>
  );
}

// ═════════════════════════════ HISTÓRICO ═════════════════════════════

export function TranscriptPage({ mat }) {
  const { d, go } = useApp();
  const [q, setQ] = useState("");
  const s = mat && d.alunoBy[mat];
  if (s) {
    return (
      <>
        <PageHeader title={s.nome} subtitle={`Histórico escolar · ${s.matricula} · ${s.curso}`}>
          <Button onClick={() => go("admin/historico")}>Outro aluno</Button>
        </PageHeader>
        <TranscriptView student={s} />
      </>
    );
  }
  const list = d.alunos.filter((x) => normalize(x.nome + x.matricula).includes(normalize(q)));
  return (
    <>
      <PageHeader title="Histórico escolar" subtitle="Escolha o aluno" />
      <div style={{ display: "grid", gap: 16, maxWidth: 560 }}>
        <SearchInput value={q} onChange={setQ} placeholder="Buscar aluno" />
        <div className="stack-8">
          {list.map((x) => (
            <button key={x.matricula} className="picker-item" onClick={() => go(`admin/historico/${x.matricula}`)}>
              <Avatar name={x.nome} id={x.matricula} />
              <span style={{ flex: 1 }}><b>{x.nome}</b><span>{x.matricula} · {turmasDoAluno(d, x.matricula).length} disciplina(s) cursada(s)</span></span>
              <ArrowRight size={18} className="muted" aria-hidden />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// ═════════════════════════════ BUSCA ═════════════════════════════

export function SearchPage() {
  const { d, go } = useApp();
  const q = decodeURIComponent(window.location.hash.split("?")[1] || "");
  const has = (txt) => normalize(txt).includes(normalize(q));
  const r = useMemo(() => ({
    alunos: d.alunos.filter((x) => has(x.nome + " " + x.matricula)),
    professores: d.professores.filter((x) => has(x.nome + " " + x.matricula)),
    disciplinas: d.disciplinas.filter((x) => has(x.nome + " " + x.codigo)),
    turmas: d.turmas.filter((x) => has(x.codigo)),
  }), [d, q]);
  const total = Object.values(r).reduce((s, l) => s + l.length, 0);

  const Group = ({ title, items, render }) => !items.length ? null : (
    <>
      <h2 className="section-title">{title} <span className="count">{items.length}</span></h2>
      <div className="stack-8">{items.map(render)}</div>
    </>
  );

  return (
    <>
      <PageHeader title={`Resultados para “${q}”`} subtitle={`${total} resultado(s)`} />
      {!total && <div className="card"><Empty icon={SearchX} title="Nada encontrado">Tente só uma parte do nome, ex: “jo” acha “Joao”.</Empty></div>}
      <Group title="Alunos" items={r.alunos} render={(x) => (
        <button key={x.matricula} className="picker-item" onClick={() => go(`admin/historico/${x.matricula}`)}>
          <Avatar name={x.nome} id={x.matricula} size={32} /><span style={{ flex: 1 }}><b>{x.nome}</b><span>Aluno · {x.matricula} · {x.curso}</span></span><ArrowRight size={18} className="muted" aria-hidden />
        </button>)} />
      <Group title="Professores" items={r.professores} render={(x) => (
        <button key={x.matricula} className="picker-item" onClick={() => go("admin/professores")}>
          <Avatar name={x.nome} id={x.matricula} size={32} /><span style={{ flex: 1 }}><b>{x.nome}</b><span>Professor · {x.matricula}</span></span><ArrowRight size={18} className="muted" aria-hidden />
        </button>)} />
      <Group title="Disciplinas" items={r.disciplinas} render={(x) => (
        <button key={x.codigo} className="picker-item" onClick={() => go("admin/disciplinas")}>
          <span className="empty-icon" style={{ width: 32, height: 32 }}><BookOpen size={16} aria-hidden /></span><span style={{ flex: 1 }}><b>{x.nome}</b><span>Disciplina · {x.codigo} · {x.cargaHoraria}h</span></span><ArrowRight size={18} className="muted" aria-hidden />
        </button>)} />
      <Group title="Turmas" items={r.turmas} render={(x) => (
        <button key={x.codigo} className="picker-item" onClick={() => go(`admin/turmas/${x.codigo}`)}>
          <span className="empty-icon" style={{ width: 32, height: 32 }}><CalendarClock size={16} aria-hidden /></span><span style={{ flex: 1 }}><b>{x.codigo}</b><span>Turma · {d.disciplinaBy[x.disciplina]?.nome} · {x.semestre}</span></span><ArrowRight size={18} className="muted" aria-hidden />
        </button>)} />
    </>
  );
}
