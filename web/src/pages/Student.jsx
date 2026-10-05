import { BookOpen, Clock3, User, TrendingUp, CalendarCheck, Target, AlertTriangle } from "lucide-react";
import { useApp } from "../App.jsx";
import { AttendanceMeter, Empty, Grade, Kpi, PageHeader, StatusBadge } from "../components/ui.jsx";
import { GradeChips, TimetableView, TranscriptView } from "../components/shared.jsx";
import { fmt, matriculaDe, turmasDoAluno } from "../lib.js";

export function Home({ student }) {
  const { d } = useApp();
  const atuais = turmasDoAluno(d, student.matricula, true);
  const ms = atuais.map((t) => matriculaDe(t, student.matricula));
  const media = ms.length ? ms.reduce((s, m) => s + m.media, 0) / ms.length : null;
  const freq = ms.length ? ms.reduce((s, m) => s + m.frequencia, 0) / ms.length : null;
  const noCaminho = ms.filter((m) => m.previsao === "Aprovado").length;

  return (
    <>
      <PageHeader title={`Olá, ${student.nome.split(" ")[0]}`} subtitle={`${student.curso} · matrícula ${student.matricula}`} />
      <div className="kpis">
        <Kpi icon={BookOpen} label="Disciplinas agora" value={atuais.length} hint="Neste semestre" />
        <Kpi icon={TrendingUp} label="Média do semestre" value={media == null ? "—" : fmt(media)} hint="Média das disciplinas atuais" delay={40} />
        <Kpi icon={CalendarCheck} label="Frequência média" value={freq == null ? "—" : `${fmt(freq, 0)}%`} hint="Mínimo de 75% em cada disciplina" delay={80} />
        <Kpi icon={Target} label="Aprovaria hoje" value={ms.length ? `${noCaminho}/${ms.length}` : "—"} hint="Se as turmas encerrassem agora" delay={120} />
      </div>

      <h2 className="section-title">Minhas disciplinas <span className="count">{atuais.length}</span></h2>
      {!atuais.length && <div className="card"><Empty icon={BookOpen} title="Você não está em nenhuma turma aberta">Fale com a secretaria para se matricular.</Empty></div>}
      <div className="grid-2">
        {atuais.map((t, i) => {
          const m = matriculaDe(t, student.matricula);
          const disc = d.disciplinaBy[t.disciplina];
          const prof = d.professorBy[t.professor];
          const falta = Math.max(0, 7 - m.media);
          return (
            <article key={t.codigo} className="card subject rise" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="row-between" style={{ alignItems: "flex-start" }}>
                <div>
                  <div className="muted" style={{ fontSize: "var(--t-12)", fontWeight: 600 }}>{disc?.codigo}</div>
                  <h3>{disc?.nome}</h3>
                </div>
                <StatusBadge status={m.situacao} />
              </div>
              <div className="row-between" style={{ alignItems: "flex-end" }}>
                <div className="stack-8">
                  <span className="muted" style={{ fontSize: "var(--t-12)" }}>Notas</span>
                  <GradeChips m={m} />
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="muted" style={{ fontSize: "var(--t-12)", marginBottom: 4 }}>Média</div>
                  <Grade value={m.media} big />
                </div>
              </div>
              <div className="stack-8">
                <div className="row-between" style={{ fontSize: "var(--t-12)" }}>
                  <span className="muted">Frequência · {m.presencas} de {m.aulas} aulas</span>
                </div>
                <AttendanceMeter value={m.frequencia} />
              </div>
              {m.frequencia < 75 && (
                <div className="banner tone-critical" style={{ margin: 0 }}><AlertTriangle size={18} aria-hidden /><p>Frequência abaixo de 75%: reprovaria por falta.</p></div>
              )}
              <dl className="dl" style={{ paddingTop: "var(--s-16)", borderTop: "1px solid var(--line)" }}>
                <dt><User size={14} aria-hidden style={{ verticalAlign: -2 }} /> Professor</dt><dd>{prof?.nome || "—"}</dd>
                <dt><Clock3 size={14} aria-hidden style={{ verticalAlign: -2 }} /> Horário</dt><dd>{t.horario}</dd>
                <dt><Target size={14} aria-hidden style={{ verticalAlign: -2 }} /> Previsão</dt>
                <dd style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <StatusBadge status={m.previsao} />
                  {falta > 0 && <span className="muted" style={{ fontSize: "var(--t-12)" }}>faltam {fmt(falta)} pts na média para aprovar direto</span>}
                </dd>
              </dl>
            </article>
          );
        })}
      </div>
    </>
  );
}

export function Timetable({ student }) {
  const { d } = useApp();
  const atuais = turmasDoAluno(d, student.matricula, true);
  const horas = atuais.reduce((s, t) => s + (d.disciplinaBy[t.disciplina]?.cargaHoraria || 0), 0);
  return (
    <>
      <PageHeader title="Horário semanal" subtitle={`${atuais.length} disciplina(s) · ${horas}h no semestre`} />
      <TimetableView turmas={atuais} />
    </>
  );
}

export function History({ student }) {
  return (
    <>
      <PageHeader title="Histórico escolar" subtitle={`${student.nome} · ${student.matricula}`} />
      <TranscriptView student={student} />
    </>
  );
}
