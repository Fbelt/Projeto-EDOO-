import { ClipboardCheck, ArrowRight, CalendarOff, CheckCircle2, AlertTriangle } from "lucide-react";
import auditorio from "../../assets/auditorio.jpg";
import { useApp, useChrome } from "../../App.jsx";
import { PageHeader } from "../../components/layout.jsx";
import { ContextLine } from "../../components/academic.jsx";
import { Badge, Button, Icon, LinkButton, useIsMobile } from "../../components/primitives.jsx";
import { EmptyState } from "../../components/feedback.jsx";
import { AttentionList } from "../../components/views.jsx";
import { firstName, longDate, plural, shortDate } from "../../lib/format.js";
import {
  aulasRegistradas, chamadaFeitaHoje, faixa, momento, parseHorario, pendenciasProfessor, proximasAulas,
  temAulaNoDia, turmasDoProfessor,
} from "../../lib/rules.js";

// Professor · Hoje: central operacional do dia
export function Today({ teacher }) {
  const { d, go } = useApp();
  const mobile = useIsMobile();
  const now = new Date();
  const base = `professor/${teacher.matricula}`;
  const mine = turmasDoProfessor(d, teacher.matricula);
  const open = mine.filter((t) => !t.encerrada);
  const today = open.map((t) => ({ t, h: parseHorario(t.horario) })).filter((x) => x.h && temAulaNoDia(x.h, now)).sort((a, b) => a.h.inicio - b.h.inicio);
  const main = today.find((x) => momento(x.h, now) === "now") || today.find((x) => momento(x.h, now) === "later") || today[today.length - 1];
  const unreadable = open.filter((t) => !parseHorario(t.horario));
  const next = proximasAulas(open, now, { count: 3, skipToday: true });
  const pend = pendenciasProfessor(d, teacher.matricula, now);
  const openGroup = (t, tab = "") => go(`${base}/turma/${t.codigo}${tab ? "/" + tab : ""}`);
  useChrome({ dock: mobile && !!main });

  const header = <PageHeader title={`Olá, Prof. ${firstName(teacher.nome)}`} subtitle={`Aqui está o seu dia de hoje. ${longDate(now)}.`} />;

  if (!mine.length) {
    return <div className="page">{header}<div className="card"><EmptyState icon={CalendarOff} title="Você ainda não tem turmas">A secretaria cria as turmas e escolhe o professor. Quando isso acontecer, sua aula do dia aparece aqui.</EmptyState></div></div>;
  }

  return (
    <div className="page">
      {header}
      <div className="split">
        <div className="stack-24">
          {main ? <NextClass item={main} now={now} onCall={() => openGroup(main.t, "chamada")} onOpen={() => openGroup(main.t)} /> : (
            <div className="card">
              <EmptyState icon={CalendarOff} title="Nenhuma aula hoje">
                {next[0] ? `A próxima é ${d.disciplinaBy[next[0].t.disciplina]?.nome}, ${shortDate(next[0].day)}, ${faixa(next[0].h)}.` : "Nenhuma das suas turmas tem horário reconhecido."}
              </EmptyState>
              {next[0] && <div style={{ textAlign: "center", paddingBottom: 24 }}><Button onClick={() => openGroup(next[0].t)}>Ver turma</Button></div>}
            </div>
          )}

          <section className="card" aria-labelledby="seu-dia">
            <div className="card-head"><h2 id="seu-dia">Seu dia</h2><span className="tiny muted">{longDate(now)}</span></div>
            {today.length ? (
              <ol className="timeline">
                {today.map(({ t, h }) => {
                  const when = momento(h, now);
                  return (
                    <li key={t.codigo} className={`tl-item ${when === "now" ? "now" : when === "past" ? "past" : ""}`}>
                      <span className="tl-time">{h.inicio}h–{h.fim}h</span>
                      <span className="tl-rail"><span className="tl-dot" /></span>
                      <button type="button" className="tl-body cell-btn" onClick={() => openGroup(t)} style={{ textAlign: "left" }}>
                        <b>{d.disciplinaBy[t.disciplina]?.nome}</b>
                        <span>{t.codigo} · {plural(t.matriculas.length, "aluno", "alunos")}{when === "now" ? " · em andamento" : when === "past" ? " · encerrada" : ""}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            ) : <div className="card-pad muted small">Sem aulas hoje.</div>}
            {next.length > 0 && (
              <div className="card-foot">
                <div className="label-caps" style={{ marginBottom: 8 }}>Próximas aulas</div>
                <div className="stack-8">{next.map((x) => <div key={x.t.codigo + x.day} className="row-between small"><span><b className="strong num">{shortDate(x.day)} · {faixa(x.h)}</b> <span className="muted">· {d.disciplinaBy[x.t.disciplina]?.nome}</span></span></div>)}</div>
              </div>
            )}
          </section>

          {unreadable.map((t) => (
            <div key={t.codigo} className="callout tone-warning"><Icon as={AlertTriangle} size={18} /><div><b>Horário não reconhecido</b>O horário de {t.codigo} (“{t.horario || "vazio"}”) não segue o formato “SEG/QUA 8h-10h”, então ela não aparece no seu dia. <button type="button" className="link" onClick={() => openGroup(t)}>Abrir turma</button></div></div>
          ))}
        </div>

        <aside className="card" aria-labelledby="pendencias">
          <div className="card-head"><h2 id="pendencias">Pendências</h2>{pend.length > 0 && <Badge tone="warning">{pend.length}</Badge>}</div>
          {pend.length ? (
            <>
              <AttentionList narrow items={pend} limit={4} onAction={(it) => openGroup(it.turma, it.tab)} />
              {pend.length > 4 && <div className="card-foot"><LinkButton onClick={() => go(`${base}/pendencias`)}>Ver todas as {pend.length}</LinkButton></div>}
            </>
          ) : <EmptyState icon={CheckCircle2} title="Nenhuma pendência">Quando uma turma precisar de você, ela aparece aqui.</EmptyState>}
        </aside>
      </div>

      {main && <div className="dock"><Button variant="primary" size="lg" icon={ClipboardCheck} onClick={() => openGroup(main.t, "chamada")}>Fazer chamada</Button></div>}
    </div>
  );
}

function NextClass({ item, now, onCall, onOpen }) {
  const { d } = useApp();
  const { t, h } = item;
  const when = momento(h, now);
  const disc = d.disciplinaBy[t.disciplina];
  const done = chamadaFeitaHoje(t.codigo);
  return (
    <section className="card next-class" aria-labelledby="next-title">
      <div className="body">
        <div className="row-between">
          <span className="label-caps">{when === "now" ? "Aula em andamento" : when === "later" ? "Próxima aula" : "Última aula de hoje"}</span>
          {when === "now" && <span className="live">Agora</span>}
        </div>
        <div className="next-time">{h.inicio}h – {h.fim}h</div>
        <div className="stack-4">
          <h2 id="next-title" className="next-title">{disc?.nome}</h2>
          <ContextLine items={[`Turma ${t.codigo}`, t.semestre, plural(t.matriculas.length, "aluno", "alunos"), plural(aulasRegistradas(t), "aula registrada", "aulas registradas")]} />
        </div>
        {done && <div><Badge tone="success">Chamada de hoje registrada neste aparelho</Badge></div>}
        <div className="row hide-mobile" style={{ marginTop: 4 }}>
          <Button variant="primary" size="lg" icon={ClipboardCheck} onClick={onCall}>Fazer chamada</Button>
          <Button size="lg" onClick={onOpen}>Ver turma</Button>
        </div>
        <div className="only-mobile"><Button block onClick={onOpen}>Ver turma<Icon as={ArrowRight} size={16} /></Button></div>
      </div>
      <div className="next-photo" style={{ backgroundImage: `url(${auditorio})` }} role="img" aria-label="Auditório da universidade" />
    </section>
  );
}
