import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, CheckCircle2, ChevronRight, GraduationCap, Layers, Lock, LogOut, Plus, School, SearchX, UserPlus, Users } from "lucide-react";
import { useApp } from "../../App.jsx";
import { PageHeader } from "../../components/layout.jsx";
import { ContextLine, GroupState, StatusBadge } from "../../components/academic.jsx";
import { Avatar, Badge, Button, Callout, Icon, SearchBox, Stats, Tabs, LinkButton, useIsMobile } from "../../components/primitives.jsx";
import { ConfirmDialog, Dialog, EmptyState } from "../../components/feedback.jsx";
import { AttentionList, GroupList, HBars, HistoryList, Roster, SeatsMeter, TableCard, VBars } from "../../components/views.jsx";
import { DisciplineForm, EnrollDialog, GroupForm, PersonForm } from "./forms.jsx";
import { fmtAvg, fmtPct, normalize, plural } from "../../lib/format.js";
import { atencaoAdmin, elegivelFinal, matriculaDe, semestreAtual, turmasDoAluno, turmasDoProfessor } from "../../lib/rules.js";

// Atalhos de criação (modais) usados na visão geral e no "Mais" do celular
function useCreators() {
  const { go } = useApp();
  const [modal, setModal] = useState(null);
  const ui = (
    <>
      {modal === "turma" && <GroupForm onClose={() => setModal(null)} onCreated={(c) => go(`admin/turmas/${c}`)} />}
      {modal === "aluno" && <PersonForm kind="aluno" onClose={() => setModal(null)} />}
      {modal === "matricula" && <EnrollDialog onClose={() => setModal(null)} />}
    </>
  );
  return [setModal, ui];
}

// ═════════════ Visão geral ═════════════

export function Overview() {
  const { d, go } = useApp();
  const [open, creators] = useCreators();
  const items = atencaoAdmin(d);
  const running = d.turmas.filter((t) => !t.encerrada);
  const atual = semestreAtual(d);

  // Matrículas por período (barras azuis; períodos encerrados em navy)
  const porPeriodo = Object.entries(d.turmas.reduce((acc, t) => { (acc[t.semestre] = acc[t.semestre] || { n: 0, aberta: false }); acc[t.semestre].n += t.matriculas.length; acc[t.semestre].aberta ||= !t.encerrada; return acc; }, {}))
    .sort(([a], [b]) => a.localeCompare(b)).map(([label, v]) => ({ label, value: v.n, past: !v.aberta }));

  // Situação dos alunos (todas as matrículas)
  const ms = d.turmas.flatMap((t) => t.matriculas.map((m) => ({ ...m, aberta: !t.encerrada })));
  const count = (f) => ms.filter(f).length;
  const sit = [
    { label: "Aprovados", value: count((m) => !m.aberta && m.situacao === "Aprovado"), color: "var(--navy-2)", dot: "var(--success-dot)" },
    { label: "Em andamento", value: count((m) => m.aberta && m.previsao !== "Em prova final"), color: "var(--primary)" },
    { label: "Prova final", value: count((m) => m.aberta && m.previsao === "Em prova final"), color: "var(--field)", dot: "var(--warning-dot)" },
    { label: "Reprovados", value: count((m) => !m.aberta && m.situacao.startsWith("Reprovado")), color: "var(--field)", dot: "var(--danger-dot)" },
  ];

  return (
    <div className="page">
      <PageHeader title="Visão geral" subtitle="Panorama do sistema acadêmico."
        actions={<><Button className="hide-mobile" icon={UserPlus} onClick={() => open("aluno")}>Novo aluno</Button><Button className="hide-mobile" onClick={() => open("matricula")}>Matricular aluno</Button><Button variant="primary" icon={Plus} onClick={() => open("turma")}>Nova turma</Button></>} />

      <Stats items={[
        { label: "Alunos", icon: GraduationCap, value: d.alunos.length, hint: `${new Set(running.flatMap((t) => t.matriculas.map((m) => m.aluno))).size} cursando agora` },
        { label: "Turmas", icon: Layers, value: d.turmas.length, hint: `${running.length} em andamento` },
        { label: "Disciplinas", icon: BookOpen, value: d.disciplinas.length, hint: "Cadastradas" },
        { label: "Professores", icon: Users, value: d.professores.length, hint: `${d.professores.filter((p) => turmasDoProfessor(d, p.matricula).some((t) => !t.encerrada)).length} com turma ativa` },
      ]} />

      <div className="grid-2" style={{ marginTop: 16 }}>
        <section className="card" aria-labelledby="mpp">
          <div className="card-head"><h2 id="mpp">Matrículas por período</h2><span className="tiny muted">Período atual: {atual}</span></div>
          <div className="card-pad">{porPeriodo.length ? <VBars data={porPeriodo} /> : <EmptyState title="Sem matrículas" />}</div>
        </section>
        <section className="card" aria-labelledby="sda">
          <div className="card-head"><h2 id="sda">Situação dos alunos</h2><span className="tiny muted num">{ms.length} matrículas</span></div>
          <div className="card-pad">{ms.length ? <HBars data={sit} total={ms.length} /> : <EmptyState title="Sem matrículas" />}</div>
        </section>
      </div>

      <div className="split" style={{ marginTop: 16 }}>
        <section className="card" aria-labelledby="atencao">
          <div className="card-head"><h2 id="atencao">Precisa de atenção</h2><span className="tiny muted">{plural(items.length, "item", "itens")}</span></div>
          {items.length ? <AttentionList items={items} onAction={(it) => go(it.to)} /> : <EmptyState icon={CheckCircle2} title="Nenhuma pendência">Quando uma turma ou um aluno precisar de você, aparece aqui.</EmptyState>}
        </section>
        <section className="card" aria-labelledby="andamento">
          <div className="card-head"><h2 id="andamento">Turmas em andamento</h2><LinkButton onClick={() => go("admin/turmas")}>Ver todas</LinkButton></div>
          {running.length ? (
            <ul className="mlist">
              {running.map((t) => (
                <li key={t.codigo}>
                  <button type="button" className="mrow" onClick={() => go(`admin/turmas/${t.codigo}`)} style={{ display: "grid", gap: 8 }}>
                    <span><b>{d.disciplinaBy[t.disciplina]?.nome}</b><span className="s">{t.codigo} · {d.professorBy[t.professor]?.nome || "Sem professor"} · {t.horario}</span></span>
                    <SeatsMeter used={t.matriculas.length} total={t.vagas} />
                  </button>
                </li>
              ))}
            </ul>
          ) : <EmptyState icon={School} title="Nenhuma turma em andamento">Use “Nova turma” para criar a primeira.</EmptyState>}
        </section>
      </div>
      {creators}
    </div>
  );
}

// Celular · Mais: atalhos, cadastros e conta
export function More() {
  const { go, logout } = useApp();
  const [open, creators] = useCreators();
  const Row = ({ icon, label, onClick }) => <li><button type="button" className="mrow" onClick={onClick}><Icon as={icon} size={18} className="muted" /><span className="grow"><b>{label}</b></span><Icon as={ChevronRight} size={16} className="muted" /></button></li>;
  return (
    <div className="page">
      <PageHeader title="Mais" />
      <div className="stack-24">
        <section><div className="label-caps" style={{ marginBottom: 8 }}>Atalhos</div><div className="card"><ul className="mlist">
          <Row icon={Plus} label="Nova turma" onClick={() => open("turma")} /><Row icon={UserPlus} label="Matricular aluno" onClick={() => open("matricula")} /><Row icon={GraduationCap} label="Novo aluno" onClick={() => open("aluno")} />
        </ul></div></section>
        <section><div className="label-caps" style={{ marginBottom: 8 }}>Cadastros</div><div className="card"><ul className="mlist">
          <Row icon={Users} label="Professores" onClick={() => go("admin/professores")} /><Row icon={BookOpen} label="Disciplinas" onClick={() => go("admin/disciplinas")} />
        </ul></div></section>
        <section><div className="label-caps" style={{ marginBottom: 8 }}>Conta</div><div className="card"><ul className="mlist"><Row icon={LogOut} label="Sair" onClick={logout} /></ul></div></section>
      </div>
      {creators}
    </div>
  );
}

// ═════════════ Turmas ═════════════

export function Groups() {
  const { d, go, route } = useApp();
  const [filter, setFilter] = useState("abertas");
  const [creating, setCreating] = useState(route.query === "nova");
  const f = (k) => d.turmas.filter((t) => k === "todas" || (k === "abertas" ? !t.encerrada : t.encerrada));
  return (
    <div className="page">
      <PageHeader title={<>Turmas<span className="count-pill">{d.turmas.length}</span></>} subtitle="Abra uma turma para matricular alunos, ver o relatório ou encerrá-la." actions={<Button variant="primary" icon={Plus} onClick={() => setCreating(true)}>Nova turma</Button>} />
      <div className="stack-16">
        <Tabs label="Filtrar turmas" value={filter} onChange={setFilter} tabs={[{ key: "abertas", label: "Em andamento", count: f("abertas").length }, { key: "encerradas", label: "Encerradas", count: f("encerradas").length }, { key: "todas", label: "Todas", count: d.turmas.length }]} />
        <GroupList turmas={f(filter)} onOpen={(t) => go(`admin/turmas/${t.codigo}`)} />
      </div>
      {creating && <GroupForm onClose={() => setCreating(false)} onCreated={(c) => go(`admin/turmas/${c}`)} />}
    </div>
  );
}

export function Group({ code }) {
  const { d, go, run, toast } = useApp();
  const [enroll, setEnroll] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const t = d.turmaBy[code];
  if (!t) return <div className="page"><div className="card"><EmptyState icon={SearchX} title="Turma não encontrada">Ela pode ter sido removida.<br /><button type="button" className="link" onClick={() => go("admin/turmas")}>Ver turmas</button></EmptyState></div></div>;

  const disc = d.disciplinaBy[t.disciplina];
  const prof = d.professorBy[t.professor];
  const full = t.matriculas.length >= t.vagas;
  const blockReason = t.encerrada ? "Turma encerrada não aceita matrícula." : full ? "Turma lotada: novas matrículas serão recusadas." : null;
  const semFinal = t.matriculas.filter((m) => disc?.temFinal && elegivelFinal(m) && m.notaFinal == null).length;

  const exec = async (path, fields, msg, after) => {
    setBusy(true);
    try { await run(path, fields); toast(msg); setConfirm(null); after?.(); }
    catch (e) { toast(e.offline ? "Sem conexão. Nada foi alterado." : e.message, { kind: "err" }); }
    setBusy(false);
  };

  return (
    <div className="page">
      <div style={{ marginBottom: 8 }}><button type="button" className="back" onClick={() => go("admin/turmas")}><Icon as={ArrowLeft} size={16} />Turmas</button></div>
      <PageHeader title={disc?.nome}
        actions={!t.encerrada && <><Button onClick={() => setConfirm({ kind: "encerrar" })} icon={Lock}>Encerrar turma</Button><Button variant="primary" icon={UserPlus} onClick={() => setEnroll(true)} disabled={!!blockReason} title={blockReason || ""}>Matricular aluno</Button></>}>
        <div className="row" style={{ marginTop: 8, gap: 12 }}><GroupState closed={t.encerrada} /><ContextLine items={[`Turma ${t.codigo}`, t.semestre, prof ? `Prof. ${prof.nome}` : "Sem professor", t.horario]} /></div>
      </PageHeader>

      <div className="stack-16">
        <div className="card card-pad row-between" style={{ gap: 24 }}>
          <SeatsMeter used={t.matriculas.length} total={t.vagas} />
          {blockReason && !t.encerrada && <span className="small" style={{ color: "var(--warning)", fontWeight: 500 }}>{blockReason}</span>}
          {t.encerrada && <span className="small muted">Turma encerrada: os resultados abaixo são oficiais.</span>}
        </div>
        {!t.professor && !t.encerrada && <Callout tone="warning" title="Turma sem professor">Ninguém pode lançar notas nem fazer chamada.</Callout>}

        <div className="row-between"><h2 className="section-title">Alunos matriculados<span className="count-pill">{t.matriculas.length}</span></h2></div>
        <Roster t={t} rowAction={t.encerrada ? null : (m, s) => <LinkButton danger onClick={() => setConfirm({ kind: "sair", m, s })}>Desmatricular</LinkButton>} />

        <div style={{ paddingTop: 16 }}><Button variant="danger-soft" onClick={() => setConfirm({ kind: "remover" })}>Remover turma</Button></div>
      </div>

      {enroll && <EnrollDialog turma={t.codigo} onClose={() => setEnroll(false)} />}
      {confirm?.kind === "encerrar" && (
        <ConfirmDialog title={`Encerrar turma ${t.codigo}?`} confirmLabel="Encerrar turma" busy={busy} onClose={() => setConfirm(null)}
          onConfirm={() => exec("turmas/encerrar", { turma: t.codigo }, `Turma ${t.codigo} encerrada. Resultados oficiais calculados.`)}>
          {semFinal > 0 && <p style={{ marginBottom: 8 }}><b>{plural(semFinal, "aluno fica", "alunos ficam")} em prova final sem nota.</b></p>}
          <p>Depois de encerrada, ninguém altera notas nem chamada, e a turma não aceita matrícula. Isso não pode ser desfeito.</p>
        </ConfirmDialog>
      )}
      {confirm?.kind === "sair" && (
        <ConfirmDialog title={`Desmatricular ${confirm.s?.nome}?`} confirmLabel="Desmatricular" destructive busy={busy} onClose={() => setConfirm(null)}
          onConfirm={() => exec("matriculas/remover", { turma: t.codigo, aluno: confirm.m.aluno }, `${confirm.s?.nome} saiu de ${t.codigo}.`)}>
          {confirm.s?.nome} sai de {t.codigo} e perde as {plural(confirm.m.notas.length, "nota", "notas")} e a frequência desta turma. Não é possível desfazer.
        </ConfirmDialog>
      )}
      {confirm?.kind === "remover" && (
        <ConfirmDialog title={`Remover a turma ${t.codigo}?`} confirmLabel="Remover turma" cancelLabel="Manter turma" destructive typeToConfirm={t.codigo} busy={busy} onClose={() => setConfirm(null)}
          onConfirm={() => exec("turmas/remover", { turma: t.codigo }, `Turma ${t.codigo} removida.`, () => go("admin/turmas"))}>
          Isso apaga a turma e as {plural(t.matriculas.length, "matrícula", "matrículas")} dela, com notas e frequência{t.encerrada ? ", e os resultados deixam de aparecer no histórico" : ""}. Não é possível desfazer.
        </ConfirmDialog>
      )}
    </div>
  );
}

// ═════════════ Alunos e professores ═════════════

export function People({ kind }) {
  const { d, route } = useApp();
  const mobile = useIsMobile();
  const isStudent = kind === "aluno";
  const list = isStudent ? d.alunos : d.professores;
  const [q, setQ] = useState("");
  const [form, setForm] = useState(route.query === "novo" ? "new" : null);
  const [ficha, setFicha] = useState(() => (route.query && route.query !== "novo" ? route.query : null));
  const shown = list.filter((p) => normalize(`${p.nome} ${p.matricula} ${p.curso || ""}`).includes(normalize(q)));
  const current = (p) => (isStudent ? turmasDoAluno(d, p.matricula, true) : turmasDoProfessor(d, p.matricula).filter((t) => !t.encerrada)).length;
  const label = isStudent ? "Alunos" : "Professores";

  const toolbar = (
    <>
      <div style={{ flex: 1, minWidth: 200, maxWidth: 360 }}><SearchBox value={q} onChange={setQ} placeholder={`Buscar ${isStudent ? "aluno" : "professor"}...`} /></div>
      <span className="count">{q ? `${shown.length} de ${list.length}` : plural(list.length, isStudent ? "aluno" : "professor", isStudent ? "alunos" : "professores")}</span>
    </>
  );

  return (
    <div className="page">
      <PageHeader title={<>{label}<span className="count-pill">{list.length}</span></>} actions={<Button variant="primary" icon={Plus} onClick={() => setForm("new")}>{isStudent ? "Novo aluno" : "Novo professor"}</Button>} />
      {mobile ? (
        <div className="stack-12">
          <SearchBox value={q} onChange={setQ} placeholder={`Buscar ${isStudent ? "aluno" : "professor"}...`} />
          <div className="card">
            {!shown.length ? <EmptyState icon={SearchX} title={q ? `Nenhum resultado para “${q}”` : `Nenhum ${isStudent ? "aluno" : "professor"} cadastrado`}>{q ? "Procure por nome ou matrícula." : `Use “${isStudent ? "Novo aluno" : "Novo professor"}” para cadastrar o primeiro.`}</EmptyState> : (
              <ul className="mlist">
                {shown.map((p) => (
                  <li key={p.matricula}><button type="button" className="mrow" onClick={() => setFicha(p.matricula)}>
                    <Avatar name={p.nome} /><span className="grow"><b>{p.nome}</b><span className="s">{p.matricula} · {isStudent ? p.curso : plural(current(p), "turma em andamento", "turmas em andamento")}</span></span><Icon as={ChevronRight} size={16} className="muted" />
                  </button></li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <TableCard toolbar={toolbar}>
          {!shown.length ? <EmptyState icon={SearchX} title={q ? `Nenhum resultado para “${q}”` : `Nenhum ${isStudent ? "aluno" : "professor"} cadastrado`}>{q ? "Procure por nome ou matrícula." : `Use “${isStudent ? "Novo aluno" : "Novo professor"}” para cadastrar o primeiro.`}</EmptyState> : (
            <table className="dtable">
              <thead><tr><th>{isStudent ? "Aluno" : "Professor"}</th><th>{isStudent ? "Curso" : "Disciplinas"}</th><th>Contato</th><th className="r">Turmas ativas</th><th /></tr></thead>
              <tbody>
                {shown.map((p) => {
                  const n = current(p);
                  return (
                    <tr key={p.matricula} className="clickable" onClick={() => setFicha(p.matricula)}>
                      <td><button type="button" className="cell-btn" onClick={(e) => { e.stopPropagation(); setFicha(p.matricula); }}><div className="cell-name"><Avatar name={p.nome} /><div><b>{p.nome}</b><span className="s num">{p.matricula}</span></div></div></button></td>
                      <td>{isStudent ? p.curso : p.disciplinas.length ? p.disciplinas.join(", ") : <span className="muted">Nenhuma</span>}</td>
                      <td className="muted">{p.contato || "—"}</td>
                      <td className={`r num ${n ? "" : "muted"}`}>{n || "—"}</td>
                      <td className="r"><Icon as={ChevronRight} size={16} className="muted" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </TableCard>
      )}
      {form && <PersonForm kind={kind} initial={form === "new" ? null : form} onClose={() => setForm(null)} onSaved={(m) => form === "new" && setFicha(m)} />}
      {ficha && !form && <PersonCard kind={kind} mat={ficha} onClose={() => setFicha(null)} onEdit={(p) => setForm(p)} />}
    </div>
  );
}

// Ficha: dados secundários aqui; o verbo destrutivo é exato
function PersonCard({ kind, mat, onClose, onEdit }) {
  const { d, go, run, toast } = useApp();
  const [removing, setRemoving] = useState(false);
  const [busy, setBusy] = useState(false);
  const isStudent = kind === "aluno";
  const p = isStudent ? d.alunoBy[mat] : d.professorBy[mat];
  if (!p) return null;
  const turmas = isStudent ? turmasDoAluno(d, mat) : turmasDoProfessor(d, mat);
  const block = !isStudent && (turmas.length ? `Dá aula em ${turmas.map((t) => t.codigo).join(", ")}. Remova essas turmas antes.` : p.disciplinas.length ? `É responsável por ${p.disciplinas.join(", ")}. Troque o responsável em Disciplinas antes.` : null);

  async function remove() {
    setBusy(true);
    try { await run(`${isStudent ? "alunos" : "professores"}/remover`, { matricula: mat }); toast(`${p.nome} removido(a).`); setRemoving(false); onClose(); }
    catch (e) { toast(e.offline ? "Sem conexão. Nada foi removido." : e.message, { kind: "err" }); }
    setBusy(false);
  }

  if (removing) return (
    <ConfirmDialog title={`Remover ${p.nome}?`} confirmLabel={isStudent ? "Remover aluno" : "Remover professor"} cancelLabel={isStudent ? "Manter aluno" : "Manter professor"}
      destructive typeToConfirm={mat} busy={busy} onClose={() => setRemoving(false)} onConfirm={remove}>
      {isStudent ? `Isso apaga ${turmas.length ? `as matrículas dele(a) em ${plural(turmas.length, "turma", "turmas")}, inclusive as encerradas, e os resultados deixam de aparecer no histórico` : "o cadastro"}. Não é possível desfazer.` : "Isso apaga o cadastro do professor. Não é possível desfazer."}
    </ConfirmDialog>
  );

  return (
    <Dialog title={p.nome} onClose={onClose} labelledBy="dlg-title"
      actions={<><Button variant="danger-soft" onClick={() => setRemoving(true)} disabled={!!block}>{isStudent ? "Remover aluno" : "Remover professor"}</Button><Button variant="primary" onClick={() => onEdit(p)}>Editar dados</Button></>}>
      <div className="meta-line" style={{ marginTop: -8 }}><span className="num">{p.matricula}</span><span>{isStudent ? p.curso : "Professor"}</span></div>
      <div className="kv">
        <div><span className="muted">Contato</span><span>{p.contato || "—"}</span></div>
        <div><span className="muted">CPF</span><span className="num">{p.cpf || "—"}</span></div>
        <div><span className="muted">Nascimento</span><span className="num">{p.nascimento ? p.nascimento.split("-").reverse().join("/") : "—"}</span></div>
      </div>
      <section className="stack-8">
        <div className="label-caps">Turmas</div>
        {turmas.length ? turmas.map((t) => {
          const m = isStudent && matriculaDe(t, mat);
          return (
            <div key={t.codigo} className="row-between" style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <div className="stack-4"><b className="small strong">{d.disciplinaBy[t.disciplina]?.nome}</b>
                <ContextLine items={[t.codigo, m ? `Média ${m.notas.length ? fmtAvg(m.media) : "—"}` : t.semestre, m ? `Freq. ${fmtPct(m.frequencia)}%` : plural(t.matriculas.length, "aluno", "alunos")]} /></div>
              {m ? (t.encerrada ? <StatusBadge status={m.situacao} /> : <StatusBadge status="Cursando" />) : <GroupState closed={t.encerrada} />}
            </div>
          );
        }) : <p className="small muted">Nenhuma turma.</p>}
      </section>
      {block && <Callout tone="warning" title="Não dá para remover ainda">{block}</Callout>}
      {isStudent && <div><LinkButton onClick={() => go(`admin/historico/${mat}`)}>Ver histórico escolar<Icon as={ChevronRight} size={14} /></LinkButton></div>}
    </Dialog>
  );
}

export function Transcript({ mat }) {
  const { d, go } = useApp();
  const s = mat && d.alunoBy[mat];
  if (!s) return <div className="page"><div className="card"><EmptyState title="Aluno não encontrado"><button type="button" className="link" onClick={() => go("admin/alunos")}>Ver alunos</button></EmptyState></div></div>;
  const todas = turmasDoAluno(d, mat);
  const closed = todas.filter((t) => t.encerrada).map((t) => ({ t, m: matriculaDe(t, mat) }));
  const avg = closed.length ? closed.reduce((a, x) => a + x.m.media, 0) / closed.length : null;
  const ok = closed.filter((x) => x.m.situacao === "Aprovado");
  const horas = ok.reduce((a, x) => a + (d.disciplinaBy[x.t.disciplina]?.cargaHoraria || 0), 0);
  return (
    <div className="page">
      <div style={{ marginBottom: 8 }}><button type="button" className="back" onClick={() => go("admin/alunos")}><Icon as={ArrowLeft} size={16} />Alunos</button></div>
      <PageHeader title="Histórico escolar"><div style={{ marginTop: 8 }}><ContextLine items={[s.nome, s.matricula, s.curso]} /></div></PageHeader>
      <div className="stack-24">
        <Stats items={[
          { label: "Média geral", value: avg == null ? "—" : fmtAvg(avg), hint: "Disciplinas encerradas" },
          { label: "Aprovações", value: `${ok.length}/${closed.length}`, hint: "Disciplinas concluídas" },
          { label: "Carga cumprida", value: `${horas}h`, hint: "Só disciplinas aprovadas" },
          { label: "Em andamento", value: todas.length - closed.length, hint: "Neste período" },
        ]} />
        <HistoryList student={s} showCurrent />
      </div>
    </div>
  );
}

// ═════════════ Disciplinas ═════════════

export function Disciplines() {
  const { d, run, toast } = useApp();
  const mobile = useIsMobile();
  const [q, setQ] = useState("");
  const [form, setForm] = useState(null);
  const [ficha, setFicha] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);
  const turmasDe = (c) => d.turmas.filter((t) => t.disciplina === c);
  const x = ficha && d.disciplinaBy[ficha];
  const shown = d.disciplinas.filter((z) => normalize(`${z.nome} ${z.codigo}`).includes(normalize(q)));

  async function remove() {
    setBusy(true);
    try { await run("disciplinas/remover", { codigo: removing.codigo }); toast(`Disciplina ${removing.codigo} removida.`); setRemoving(null); setFicha(null); }
    catch (e) { toast(e.offline ? "Sem conexão. Nada foi removido." : e.message, { kind: "err" }); }
    setBusy(false);
  }

  const toolbar = <><div style={{ flex: 1, minWidth: 200, maxWidth: 360 }}><SearchBox value={q} onChange={setQ} placeholder="Buscar disciplina..." /></div><span className="count">{plural(d.disciplinas.length, "disciplina", "disciplinas")}</span></>;
  const empty = <EmptyState icon={BookOpen} title={q ? `Nenhum resultado para “${q}”` : "Nenhuma disciplina cadastrada"}>{q ? "Procure por nome ou código." : "Use “Nova disciplina” para cadastrar a primeira."}</EmptyState>;

  return (
    <div className="page">
      <PageHeader title={<>Disciplinas<span className="count-pill">{d.disciplinas.length}</span></>} actions={<Button variant="primary" icon={Plus} onClick={() => setForm("new")}>Nova disciplina</Button>} />
      {mobile ? (
        <div className="stack-12"><SearchBox value={q} onChange={setQ} placeholder="Buscar disciplina..." />
          <div className="card">{!shown.length ? empty : <ul className="mlist">{shown.map((z) => (
            <li key={z.codigo}><button type="button" className="mrow" onClick={() => setFicha(z.codigo)}><span className="grow"><b>{z.nome}</b><span className="s">{z.codigo} · {z.cargaHoraria}h · {d.professorBy[z.professor]?.nome || "Sem professor"}</span></span><Icon as={ChevronRight} size={16} className="muted" /></button></li>))}</ul>}</div>
        </div>
      ) : (
        <TableCard toolbar={toolbar}>
          {!shown.length ? empty : (
            <table className="dtable">
              <thead><tr><th>Disciplina</th><th>Professor</th><th className="r">Carga</th><th>Avaliação</th><th className="r">Turmas</th><th /></tr></thead>
              <tbody>
                {shown.map((z) => {
                  const p = d.professorBy[z.professor];
                  return (
                    <tr key={z.codigo} className="clickable" onClick={() => setFicha(z.codigo)}>
                      <td><button type="button" className="cell-btn" onClick={(e) => { e.stopPropagation(); setFicha(z.codigo); }}><div className="cell-name"><div><b>{z.nome}</b><span className="s num">{z.codigo}</span></div></div></button></td>
                      <td className={p ? "" : "muted"}>{p?.nome || "Sem professor"}</td>
                      <td className="r num">{z.cargaHoraria}h</td>
                      <td>{z.temFinal ? <Badge tone="warning">Com prova final</Badge> : <Badge>Sem prova final</Badge>}</td>
                      <td className="r num">{turmasDe(z.codigo).length}</td>
                      <td className="r"><Icon as={ChevronRight} size={16} className="muted" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </TableCard>
      )}

      {form && <DisciplineForm initial={form === "new" ? null : form} onClose={() => setForm(null)} />}
      {x && !form && !removing && (
        <Dialog title={x.nome} onClose={() => setFicha(null)}
          actions={<><Button variant="danger-soft" disabled={turmasDe(x.codigo).length > 0} onClick={() => setRemoving(x)}>Remover disciplina</Button><Button variant="primary" onClick={() => setForm(x)}>Editar dados</Button></>}>
          <div className="meta-line" style={{ marginTop: -8 }}><span className="num">{x.codigo}</span><span>{x.cargaHoraria}h</span><span>{x.temFinal ? "com prova final" : "sem prova final"}</span></div>
          <div className="kv">
            <div><span className="muted">Professor responsável</span><span>{d.professorBy[x.professor]?.nome || "Sem professor"}</span></div>
            <div><span className="muted">Turmas</span><span>{turmasDe(x.codigo).map((t) => t.codigo).join(", ") || "Nenhuma"}</span></div>
          </div>
          {x.ementa && <p className="text-2 small">{x.ementa}</p>}
          {turmasDe(x.codigo).length > 0 && <Callout tone="warning" title="Não dá para remover ainda">Esta disciplina tem turmas. Remova as turmas antes.</Callout>}
        </Dialog>
      )}
      {removing && (
        <ConfirmDialog title={`Remover ${removing.codigo}?`} confirmLabel="Remover disciplina" cancelLabel="Manter disciplina" destructive typeToConfirm={removing.codigo} busy={busy} onClose={() => setRemoving(null)} onConfirm={remove}>
          A disciplina {removing.nome} será apagada. Não é possível desfazer.
        </ConfirmDialog>
      )}
    </div>
  );
}

// ═════════════ Busca ═════════════

export function Search() {
  const { d, go, route } = useApp();
  const [q, setQ] = useState(route.query);
  useEffect(() => setQ(route.query), [route.query]);
  const term = route.query;
  const has = (txt) => normalize(txt).includes(normalize(term));
  const r = {
    alunos: d.alunos.filter((x) => has(`${x.nome} ${x.matricula}`)),
    professores: d.professores.filter((x) => has(`${x.nome} ${x.matricula}`)),
    disciplinas: d.disciplinas.filter((x) => has(`${x.nome} ${x.codigo}`)),
    turmas: d.turmas.filter((x) => has(x.codigo)),
  };
  const total = Object.values(r).reduce((s, l) => s + l.length, 0);
  const Group = ({ title, items, render }) => !items.length ? null : (
    <section><div className="label-caps" style={{ marginBottom: 8 }}>{title} · {items.length}</div><div className="card"><ul className="mlist">{items.map(render)}</ul></div></section>
  );
  const Row = ({ onClick, title, meta }) => <li><button type="button" className="mrow" onClick={onClick}><span className="grow"><b>{title}</b><span className="s">{meta}</span></span><Icon as={ChevronRight} size={16} className="muted" /></button></li>;
  return (
    <div className="page" style={{ maxWidth: 880, marginInline: 0 }}>
      <div style={{ marginBottom: 24 }}><SearchBox value={q} onChange={setQ} placeholder="Buscar aluno, professor, disciplina ou turma..." onSubmit={(v) => v.trim() && go(`admin/busca?${encodeURIComponent(v.trim())}`)} /></div>
      <PageHeader title={`Resultados para “${term}”`} subtitle={plural(total, "resultado", "resultados")} />
      {!total ? <div className="card"><EmptyState icon={SearchX} title={`Nenhum resultado para “${term}”`}>Procure por nome, matrícula ou código.</EmptyState></div> : (
        <div className="stack-24">
          <Group title="Alunos" items={r.alunos} render={(x) => <Row key={x.matricula} onClick={() => go(`admin/alunos?${x.matricula}`)} title={x.nome} meta={`${x.matricula} · ${x.curso}`} />} />
          <Group title="Professores" items={r.professores} render={(x) => <Row key={x.matricula} onClick={() => go(`admin/professores?${x.matricula}`)} title={x.nome} meta={x.matricula} />} />
          <Group title="Disciplinas" items={r.disciplinas} render={(x) => <Row key={x.codigo} onClick={() => go("admin/disciplinas")} title={x.nome} meta={`${x.codigo} · ${x.cargaHoraria}h`} />} />
          <Group title="Turmas" items={r.turmas} render={(x) => <Row key={x.codigo} onClick={() => go(`admin/turmas/${x.codigo}`)} title={x.codigo} meta={`${d.disciplinaBy[x.disciplina]?.nome} · ${x.semestre}`} />} />
        </div>
      )}
    </div>
  );
}
