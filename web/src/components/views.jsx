// Composições usadas por mais de um perfil: tabelas no desktop, listas no celular
import { AlertTriangle, ChevronRight, Info, Users } from "lucide-react";
import { useApp } from "../App.jsx";
import { ContextLine, GroupState, StatusBadge } from "./academic.jsx";
import { EmptyState } from "./feedback.jsx";
import { Avatar, Icon, useIsMobile } from "./primitives.jsx";
import { fmtAvg, fmtPct } from "../lib/format.js";
import { MIN_FREQ, matriculaDe, turmasDoAluno } from "../lib/rules.js";

export const TableCard = ({ children, foot, toolbar }) => (
  <div className="table-card">
    {toolbar && <div className="toolbar">{toolbar}</div>}
    <div className="table-scroll">{children}</div>
    {foot && <div className="card-foot tiny muted" style={{ display: "flex", gap: 8, alignItems: "center" }}><Icon as={Info} size={14} />{foot}</div>}
  </div>
);

const Freq = ({ m }) => (
  <div style={{ minWidth: 110 }}>
    <span className="num strong" style={{ color: m.frequencia < MIN_FREQ ? "var(--danger)" : undefined }}>{fmtPct(m.frequencia)}%</span>
    <span className="tiny muted num"> · {m.presencas}/{m.aulas}</span>
    <div className={`meter ${m.frequencia < MIN_FREQ ? "full" : ""}`} style={{ marginTop: 4, height: 4 }}><div style={{ width: `${m.frequencia}%`, background: m.frequencia < MIN_FREQ ? "var(--danger-dot)" : undefined }} /></div>
  </div>
);

// Alunos da turma: Aluno · Média · Frequência · Situação (projeção ou oficial)
export function Roster({ t, rowAction }) {
  const { d } = useApp();
  const mobile = useIsMobile();
  const closed = t.encerrada;
  if (!t.matriculas.length) return <div className="card"><EmptyState icon={Users} title="Nenhum aluno matriculado">Use “Matricular aluno” para incluir o primeiro.</EmptyState></div>;

  const res = (m) => closed
    ? <StatusBadge status={m.situacao} />
    : m.notas.length ? <StatusBadge status={m.previsao} avg={m.media} projection /> : <span className="tiny muted">Sem notas lançadas</span>;

  if (mobile) return (
    <div className="card">
      <ul className="mlist">
        {t.matriculas.map((m) => {
          const s = d.alunoBy[m.aluno];
          return (
            <li key={m.aluno} className="mrow" style={{ display: "grid", gap: 8 }}>
              <div className="row-between"><div className="cell-name"><Avatar name={s?.nome} /><div><b>{s?.nome}</b><span className="s">{m.aluno}</span></div></div>{rowAction?.(m, s)}</div>
              <div className="small muted num">Média <b className="strong">{m.notas.length ? fmtAvg(m.media) : "—"}</b> · Frequência <b className="strong" style={{ color: m.frequencia < MIN_FREQ ? "var(--danger)" : undefined }}>{fmtPct(m.frequencia)}%</b></div>
              {res(m)}
            </li>
          );
        })}
      </ul>
      {!closed && <div className="card-foot tiny muted">“Se encerrasse hoje” é uma projeção. O resultado oficial vale só depois de encerrar.</div>}
    </div>
  );

  return (
    <TableCard foot={closed ? "Resultado oficial. Notas e chamada somente para leitura." : "“Se encerrasse hoje” é uma projeção (borda tracejada). O resultado oficial vale só depois de encerrar."}>
      <table className="dtable">
        <thead><tr><th className="idx">#</th><th>Aluno</th><th>Matrícula</th><th className="r">Média</th><th>Frequência</th><th>{closed ? "Resultado" : "Se encerrasse hoje"}</th>{rowAction && <th className="r"><span className="sr-only">Ações</span></th>}</tr></thead>
        <tbody>
          {t.matriculas.map((m, i) => {
            const s = d.alunoBy[m.aluno];
            return (
              <tr key={m.aluno}>
                <td className="idx">{i + 1}</td>
                <td><div className="cell-name"><Avatar name={s?.nome} /><b>{s?.nome}</b></div></td>
                <td className="num muted">{m.aluno}</td>
                <td className="r"><span className="avg">{m.notas.length ? fmtAvg(m.media) : "—"}</span></td>
                <td><Freq m={m} /></td>
                <td>{res(m)}</td>
                {rowAction && <td className="r">{rowAction(m, s)}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </TableCard>
  );
}

// Lista de turmas
export function GroupList({ turmas, onOpen, showTeacher = true }) {
  const { d } = useApp();
  const mobile = useIsMobile();
  if (!turmas.length) return <div className="card"><EmptyState title="Nenhuma turma aqui" /></div>;
  if (mobile) return (
    <div className="card">
      <ul className="mlist">
        {turmas.map((t) => (
          <li key={t.codigo}>
            <button type="button" className="mrow" onClick={() => onOpen(t)}>
              <span className="grow stack-4">
                <b>{d.disciplinaBy[t.disciplina]?.nome}</b>
                <ContextLine items={[t.codigo, showTeacher && (d.professorBy[t.professor]?.nome || "Sem professor"), t.horario]} />
                <span className="row" style={{ gap: 8, marginTop: 4 }}><GroupState closed={t.encerrada} /><span className="tiny muted num">{t.matriculas.length} de {t.vagas} vagas</span></span>
              </span>
              <Icon as={ChevronRight} size={18} className="muted" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <TableCard>
      <table className="dtable">
        <thead><tr><th>Turma</th><th>Disciplina</th>{showTeacher && <th>Professor</th>}<th>Horário</th><th>Vagas</th><th>Situação</th><th /></tr></thead>
        <tbody>
          {turmas.map((t) => {
            const prof = d.professorBy[t.professor];
            const full = t.matriculas.length >= t.vagas;
            return (
              <tr key={t.codigo} className="clickable" onClick={() => onOpen(t)}>
                <td><button type="button" className="cell-btn" onClick={(e) => { e.stopPropagation(); onOpen(t); }}><b>{t.codigo}</b></button></td>
                <td>{d.disciplinaBy[t.disciplina]?.nome}</td>
                {showTeacher && <td className={prof ? "" : "muted"}>{prof?.nome || "Sem professor"}</td>}
                <td className="num" style={{ whiteSpace: "nowrap" }}>{t.horario || "—"}</td>
                <td style={{ minWidth: 120 }}><span className="num small strong">{t.matriculas.length}/{t.vagas}</span><div className={`meter ${full ? "full" : ""}`} style={{ marginTop: 4, height: 4 }}><div style={{ width: `${Math.min(100, (t.matriculas.length * 100) / t.vagas)}%` }} /></div></td>
                <td><GroupState closed={t.encerrada} /></td>
                <td className="r"><Icon as={ChevronRight} size={16} className="muted" /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </TableCard>
  );
}

// Histórico: disciplina, semestre, média, frequência e resultado oficial
export function HistoryList({ student, showCurrent }) {
  const { d } = useApp();
  const mobile = useIsMobile();
  const all = turmasDoAluno(d, student.matricula).sort((a, b) => b.semestre.localeCompare(a.semestre));
  const list = showCurrent ? all : all.filter((t) => t.encerrada);
  if (!list.length) return <div className="card"><EmptyState title="Ainda não há semestres anteriores">As turmas encerradas ficam neste histórico.</EmptyState></div>;
  const row = (t) => {
    const m = matriculaDe(t, student.matricula);
    const disc = d.disciplinaBy[t.disciplina];
    const badge = t.encerrada ? <StatusBadge status={m.situacao} /> : m.notas.length ? <StatusBadge status={m.previsao} avg={m.media} projection prefix="Por enquanto: " /> : <span className="tiny muted">Sem notas</span>;
    return { t, m, disc, badge };
  };
  const foot = "Resultado oficial dos semestres encerrados. Disciplinas em andamento mostram só uma projeção.";
  if (mobile) return (
    <div className="card">
      <ul className="mlist">
        {list.map((t) => { const { m, disc, badge } = row(t); return (
          <li key={t.codigo} className="mrow" style={{ display: "grid", gap: 6 }}>
            <div className="row-between"><b>{disc?.nome}</b><span className="small num strong">{m.notas.length ? fmtAvg(m.media) : "—"}</span></div>
            <ContextLine items={[t.codigo, t.semestre, `${fmtPct(m.frequencia)}% de frequência`]} />
            <div>{badge}</div>
          </li>); })}
      </ul>
      <div className="card-foot tiny muted">{foot}</div>
    </div>
  );
  return (
    <TableCard foot={foot}>
      <table className="dtable">
        <thead><tr><th>Semestre</th><th>Disciplina</th><th className="r">Carga</th><th className="r">Média</th><th>Frequência</th><th>Situação</th></tr></thead>
        <tbody>
          {list.map((t) => { const { m, disc, badge } = row(t); return (
            <tr key={t.codigo}>
              <td className="num">{t.semestre}</td>
              <td><b>{disc?.nome}</b><div className="tiny muted">{disc?.codigo} · {t.codigo}</div></td>
              <td className="r num muted">{disc?.cargaHoraria}h</td>
              <td className="r"><span className="avg">{m.notas.length ? fmtAvg(m.media) : "—"}</span></td>
              <td><Freq m={m} /></td>
              <td>{badge}</td>
            </tr>); })}
        </tbody>
      </table>
    </TableCard>
  );
}

// Lista estruturada de pendências / atenção: ícone · o quê · por quê · ação
export function AttentionList({ items, onAction, limit, narrow }) {
  const shown = limit ? items.slice(0, limit) : items;
  return (
    <ul className={`ilist ${narrow ? "narrow" : ""}`}>
      {shown.map((it) => (
        <li key={it.id}>
          <span className={`ico ${it.kind === "attention" ? "warning" : ""}`}><Icon as={AlertTriangle} size={16} /></span>
          <div className="grow"><div className="what">{it.what}</div><div className="why">{it.why}</div></div>
          <span className="do"><button type="button" className="link" onClick={() => onAction(it)}>{it.action}<Icon as={ChevronRight} size={14} /></button></span>
        </li>
      ))}
    </ul>
  );
}

// ── Gráficos monocromáticos (navy + azul + neutros) ──
export function VBars({ data }) {
  const max = Math.max(1, ...data.map((x) => x.value));
  return (
    <div>
      <div className="vbars" role="img" aria-label={data.map((x) => `${x.label}: ${x.value}`).join("; ")}>
        {data.map((x) => (
          <div key={x.label} className={`vbar ${x.past ? "past" : ""}`}><span className="val">{x.value}</span><div className="col" style={{ height: `${(x.value / max) * 130}px` }} /></div>
        ))}
      </div>
      <div className="vbar-labels">{data.map((x) => <span key={x.label}>{x.label}</span>)}</div>
    </div>
  );
}

export function HBars({ data, total }) {
  return (
    <div className="hbars">
      {data.map((x) => (
        <div className="hbar" key={x.label}>
          <span className="name">{x.dot && <i className="dotm" style={{ background: x.dot }} aria-hidden />}{x.label}</span>
          <div className="track" role="meter" aria-label={`${x.label}: ${x.value}`} aria-valuenow={x.value} aria-valuemin={0} aria-valuemax={total}><div className="fill" style={{ width: `${total ? (x.value * 100) / total : 0}%`, background: x.color }} /></div>
          <span className="val">{x.value}<small className="muted num"> · {total ? Math.round((x.value * 100) / total) : 0}%</small></span>
        </div>
      ))}
    </div>
  );
}

// Vagas: "3 de 3" + barra fina (âmbar quando lotada)
export function SeatsMeter({ used, total }) {
  const full = used >= total;
  return (
    <div className="stack-8" style={{ minWidth: 160 }}>
      <div className="row-between small"><span className="muted">Vagas</span><b className="strong num">{used} de {total}</b></div>
      <div className={`meter ${full ? "full" : ""}`} role="meter" aria-label={`${used} de ${total} vagas ocupadas`} aria-valuenow={used} aria-valuemin={0} aria-valuemax={total}><div style={{ width: `${Math.min(100, (used * 100) / Math.max(total, 1))}%` }} /></div>
    </div>
  );
}
