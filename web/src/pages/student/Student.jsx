import { ArrowLeft, BookOpen, CalendarOff, CheckCircle2, ChevronDown, ChevronRight, Flag, Gauge, TrendingUp, XCircle, Clock, CalendarCheck } from "lucide-react";
import { useApp } from "../../App.jsx";
import { PageHeader } from "../../components/layout.jsx";
import { AcademicRails, ContextLine, StatusBadge } from "../../components/academic.jsx";
import { Callout, Icon, Stats } from "../../components/primitives.jsx";
import { EmptyState } from "../../components/feedback.jsx";
import { HistoryList } from "../../components/views.jsx";
import { DIA_NOME, faixa, matriculaDe, momento, parseHorario, precisaNaFinal, proximasAulas, semanaAtual, temAulaNoDia, turmasDoAluno } from "../../lib/rules.js";
import { firstName, fmtAvg, fmtGrade, fmtOne, fmtPct, plural, sameDay, shortDate } from "../../lib/format.js";

// Aviso de situação: prova final (âmbar) · aprovado (verde) · reprovado (vermelho)
function SituationNote({ m }) {
  if (!m.notas.length) return <Callout tone="neutral" icon={Clock} title="Ainda sem notas">Nenhuma nota lançada não é o mesmo que zero. A situação aparece quando a primeira nota sair.</Callout>;
  switch (m.previsao) {
    case "Em prova final":
      return <Callout tone="warning" icon={Flag} title="Prova final necessária">Você precisa de <b style={{ display: "inline", color: "var(--text)" }}>{fmtOne(precisaNaFinal(m.media))}</b> para aprovação.</Callout>;
    case "Aprovado":
      return <Callout tone="success" icon={CheckCircle2} title="Por enquanto, aprovado">Média {fmtAvg(m.media)} e frequência de {fmtPct(m.frequencia)}% atendem às regras.</Callout>;
    case "Reprovado por falta":
      return <Callout tone="danger" icon={XCircle} title="Frequência abaixo de 75%">Nesse caso a reprovação é por falta e a nota não muda o resultado.</Callout>;
    default:
      return <Callout tone="danger" icon={XCircle} title="Média abaixo do mínimo">{m.media < 3 ? "Com média abaixo de 3 não há prova final." : "Esta disciplina não tem prova final: é preciso média 7 ou mais."}</Callout>;
  }
}

const Explain = ({ temFinal }) => (
  <details className="explain">
    <summary>Como isso é calculado?<Icon as={ChevronDown} size={14} /></summary>
    <div className="explain-body">
      <p>A média é a soma das notas dividida pela quantidade de notas. Com frequência abaixo de 75%, a reprovação é por falta e a nota não muda o resultado.</p>
      {temFinal
        ? <p>Esta disciplina tem prova final: média 7 ou mais aprova, abaixo de 3 reprova. Entre 3 e 7, você faz a final e passa se (média + final) ÷ 2 for 5 ou mais.</p>
        : <p>Esta disciplina não tem prova final: média 7 ou mais aprova.</p>}
      <p>“Por enquanto” é uma projeção. O resultado oficial sai quando o professor encerra a turma.</p>
    </div>
  </details>
);

// Aluno · Início
export function Home({ student }) {
  const { d, go } = useApp();
  const base = `aluno/${student.matricula}`;
  const atuais = turmasDoAluno(d, student.matricula, true);
  const ms = atuais.map((t) => matriculaDe(t, student.matricula));
  const comNota = ms.filter((m) => m.notas.length);
  const media = comNota.length ? comNota.reduce((s, m) => s + m.media, 0) / comNota.length : null;
  const freq = ms.length ? ms.reduce((s, m) => s + m.frequencia, 0) / ms.length : null;
  const ok = comNota.filter((m) => m.previsao === "Aprovado").length;
  const emFinal = comNota.filter((m) => m.previsao === "Em prova final").length;
  const risco = comNota.filter((m) => m.previsao.startsWith("Reprovado")).length;
  const situacao = !comNota.length ? "Sem notas" : risco ? "Atenção" : emFinal ? "Prova final" : "Em dia";
  const next = proximasAulas(atuais, new Date(), { count: 3 });

  return (
    <div className="page">
      <PageHeader title={`Olá, ${firstName(student.nome)}`} subtitle="Aqui está o seu desempenho neste período." />

      <Stats items={[
        { label: "Disciplinas", icon: BookOpen, value: atuais.length, hint: "Neste período" },
        { label: "Média", icon: TrendingUp, value: media == null ? "—" : fmtAvg(media), hint: "Mínimo de 7,0 para aprovação direta" },
        { label: "Frequência", icon: CalendarCheck, value: freq == null ? "—" : `${fmtPct(freq)}%`, hint: "Mínimo de 75% por disciplina" },
        { label: "Situação", icon: Gauge, value: situacao, hint: comNota.length ? `${ok} de ${comNota.length} aprovariam hoje` : "Aguardando a primeira nota" },
      ]} />

      <div className="split" style={{ marginTop: 24 }}>
        <section aria-labelledby="minhas-disc">
          <div className="row-between" style={{ marginBottom: 12 }}><h2 id="minhas-disc" className="section-title">Minhas disciplinas</h2></div>
          <div className="card">
            {atuais.length === 0 && <EmptyState icon={BookOpen} title="Você não está em nenhuma turma agora">Quando a secretaria fizer sua matrícula, as disciplinas aparecem aqui.</EmptyState>}
            {atuais.map((t) => {
              const m = matriculaDe(t, student.matricula);
              const disc = d.disciplinaBy[t.disciplina];
              const prof = d.professorBy[t.professor];
              return (
                <article key={t.codigo} className="subj">
                  <div className="subj-head">
                    <div className="stack-4"><h3>{disc?.nome}</h3><ContextLine items={[`${disc?.codigo} · ${t.codigo}`, t.semestre, prof && `Prof. ${prof.nome}`]} /></div>
                    {m.notas.length > 0 ? <StatusBadge status={m.previsao} avg={m.media} projection prefix="Por enquanto: " /> : <StatusBadge status="Cursando" />}
                  </div>
                  <AcademicRails m={m} />
                  <SituationNote m={m} />
                  <div className="subj-foot">
                    <Explain temFinal={!!disc?.temFinal} />
                    <button type="button" className="link" onClick={() => go(`${base}/disciplina/${t.codigo}`)}>Ver notas e presença<Icon as={ChevronRight} size={14} /></button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="stack-16">
          <section className="card">
            <div className="card-head"><h2>Próximas aulas</h2><button type="button" className="link" onClick={() => go(`${base}/horario`)}>Horário</button></div>
            {next.length ? (
              <ol className="timeline">
                {next.map((x) => (
                  <li key={x.t.codigo + x.day} className={`tl-item ${x.today ? "now" : ""}`}>
                    <span className="tl-time">{x.today ? "Hoje" : shortDate(x.day)}</span>
                    <span className="tl-rail"><span className="tl-dot" /></span>
                    <div className="tl-body"><b>{d.disciplinaBy[x.t.disciplina]?.nome}</b><span className="num">{faixa(x.h)} · {x.t.codigo}</span></div>
                  </li>
                ))}
              </ol>
            ) : <p className="card-pad small muted">Nenhuma aula com horário nos próximos dias.</p>}
          </section>
        </aside>
      </div>
    </div>
  );
}

// Aluno · Disciplina
export function Subject({ student, code }) {
  const { d, go } = useApp();
  const base = `aluno/${student.matricula}`;
  const t = d.turmaBy[code];
  const m = t && matriculaDe(t, student.matricula);
  if (!m) return <div className="page"><div className="card"><EmptyState title="Disciplina não encontrada">Você não está matriculado nesta turma.<br /><button type="button" className="link" onClick={() => go(base)}>Voltar ao início</button></EmptyState></div></div>;
  const disc = d.disciplinaBy[t.disciplina];
  const prof = d.professorBy[t.professor];

  return (
    <div className="page">
      <div style={{ marginBottom: 8 }}><button type="button" className="back" onClick={() => go(base)}><Icon as={ArrowLeft} size={16} />Início</button></div>
      <PageHeader title={disc?.nome} actions={t.encerrada ? <StatusBadge status={m.situacao} /> : m.notas.length ? <StatusBadge status={m.previsao} avg={m.media} projection prefix="Por enquanto: " /> : <StatusBadge status="Cursando" />}>
        <div style={{ marginTop: 8 }}><ContextLine items={[`${disc?.codigo} · ${t.codigo}`, t.semestre, prof && `Prof. ${prof.nome}`, t.horario]} /></div>
      </PageHeader>

      <div className="split">
        <div className="stack-16">
          <section className="card card-pad stack-24"><AcademicRails m={m} />{!t.encerrada && <SituationNote m={m} />}<Explain temFinal={!!disc?.temFinal} /></section>
        </div>
        <aside className="stack-16">
          <section className="card">
            <div className="card-head"><h2>Notas</h2></div>
            {m.notas.length || m.notaFinal != null ? (
              <ul className="mlist">
                {m.notas.map((n, i) => <li key={i} className="mrow row-between" style={{ minHeight: 48 }}><span>Nota {i + 1}</span><b className="avg">{fmtGrade(n)}</b></li>)}
                {m.notaFinal != null && <li className="mrow row-between" style={{ minHeight: 48 }}><span>Prova final</span><b className="avg">{fmtGrade(m.notaFinal)}</b></li>}
              </ul>
            ) : <p className="card-pad small muted">Nenhuma nota lançada. Não é o mesmo que zero.</p>}
          </section>
          <section className="card">
            <div className="card-head"><h2>Presença</h2></div>
            <div className="mrow row-between" style={{ minHeight: 48 }}><span>{plural(m.presencas, "presença", "presenças")}</span><span className="muted">{plural(m.aulas - m.presencas, "falta", "faltas")}</span></div>
          </section>
        </aside>
      </div>
    </div>
  );
}

// Aluno · Horário (semana atual)
export function Schedule({ student }) {
  const { d } = useApp();
  const now = new Date();
  const atuais = turmasDoAluno(d, student.matricula, true);
  const week = semanaAtual(now);
  const days = week.map(({ dia, date }) => ({
    dia, date, today: sameDay(date, now),
    aulas: atuais.map((t) => ({ t, h: parseHorario(t.horario) })).filter((x) => x.h && temAulaNoDia(x.h, date)).sort((a, b) => a.h.inicio - b.h.inicio),
  }));
  const unreadable = atuais.filter((t) => !parseHorario(t.horario));
  const fmt = (dt) => dt.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
  const horas = atuais.reduce((s, t) => s + (d.disciplinaBy[t.disciplina]?.cargaHoraria || 0), 0);

  return (
    <div className="page">
      <PageHeader title="Horário" subtitle={`Semana de ${week[0].date.getDate()} a ${fmt(week[5].date)} · ${plural(atuais.length, "disciplina", "disciplinas")} · ${horas}h no período.`} />
      {!atuais.length ? <div className="card"><EmptyState icon={CalendarOff} title="Nenhuma aula esta semana">Você não está em nenhuma turma em andamento.</EmptyState></div> : (
        <div className="card week">
          {days.map((day) => (
            <section key={day.dia} className={`week-day ${day.today ? "today" : ""} ${day.aulas.length ? "" : "empty-day"}`} aria-label={DIA_NOME[day.dia]}>
              <header><b>{DIA_NOME[day.dia]}{day.today ? " · hoje" : ""}</b><span>{day.date.getDate()}/{String(day.date.getMonth() + 1).padStart(2, "0")}</span></header>
              {day.aulas.length === 0 && <span className="none">Sem aula</span>}
              {day.aulas.map(({ t, h }) => (
                <div key={t.codigo} className={`slot ${day.today && momento(h, now) === "past" ? "past" : ""}`}>
                  <b>{faixa(h)}</b>
                  <span className="t">{d.disciplinaBy[t.disciplina]?.nome}</span>
                  <span className="c">{t.codigo}{d.professorBy[t.professor] ? ` · ${d.professorBy[t.professor].nome}` : ""}</span>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
      {unreadable.map((t) => <div key={t.codigo} style={{ marginTop: 16 }}><Callout tone="warning" title="Horário não reconhecido">O horário de {t.codigo} (“{t.horario || "vazio"}”) não segue o formato esperado.</Callout></div>)}
    </div>
  );
}

export function History({ student }) {
  const { d } = useApp();
  const list = turmasDoAluno(d, student.matricula).filter((t) => t.encerrada);
  const ok = list.filter((t) => matriculaDe(t, student.matricula).situacao === "Aprovado").length;
  return (
    <div className="page">
      <PageHeader title="Histórico" subtitle={`Resultados oficiais de semestres encerrados. ${list.length ? `${ok} de ${plural(list.length, "disciplina", "disciplinas")} com aprovação.` : ""}`} />
      <HistoryList student={student} />
    </div>
  );
}
