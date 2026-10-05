import { Clock3, Users, User, BookMarked, TrendingUp, Award, Armchair, CalendarDays, ScrollText } from "lucide-react";
import { useApp } from "../App.jsx";
import { Avatar, AttendanceMeter, Badge, Empty, Grade, Kpi, Meter, Modal, StatusBadge } from "./ui.jsx";
import { DIAS, SERIES, STATUS, fmt, matriculaDe, parseHorario, statsTurma, turmasDoAluno } from "../lib.js";

// Notas como "chips"; com onEdit, cada nota vira botão para corrigir
export function GradeChips({ m, onEdit }) {
  if (!m.notas.length && m.notaFinal == null) return <span className="muted">sem notas</span>;
  return (
    <div className="chips">
      {m.notas.map((n, i) =>
        onEdit ? (
          <button key={i} className="chip" onClick={() => onEdit(i, n)} title={`Corrigir avaliação ${i + 1}`}>{fmt(n)}</button>
        ) : (
          <span key={i} className="chip" title={`Avaliação ${i + 1}`}>{fmt(n)}</span>
        )
      )}
      {m.notaFinal != null && <span className="chip chip-final" title="Prova final">PF {fmt(m.notaFinal)}</span>}
    </div>
  );
}

// Cartão de turma (usado pelo admin e pelo professor)
export function GroupCard({ t, onOpen, delay = 0 }) {
  const { d } = useApp();
  const disc = d.disciplinaBy[t.disciplina];
  const prof = d.professorBy[t.professor];
  const st = statsTurma(t);
  return (
    <button className="card group-card rise" style={{ animationDelay: `${delay}ms` }} onClick={onOpen}>
      <div className="top">
        <div style={{ flex: 1 }}>
          <div className="code">{t.codigo}</div>
          <h3>{disc?.nome}</h3>
        </div>
        {t.encerrada ? <Badge tone="neutral">Encerrada</Badge> : <Badge tone="good">Aberta</Badge>}
      </div>
      <div className="meta">
        <span><Clock3 size={14} aria-hidden />{t.horario}</span>
        <span><User size={14} aria-hidden />{prof?.nome || "Sem professor"}</span>
        <span><CalendarDays size={14} aria-hidden />{t.semestre}</span>
      </div>
      <div className="stack-8">
        <div className="row-between" style={{ fontSize: "var(--t-12)" }}>
          <span className="muted">Vagas ocupadas</span>
          <b className="num">{st.n} de {t.vagas}{st.n >= t.vagas && " · lotada"}</b>
        </div>
        <Meter value={st.ocupacao} label={`${st.n} de ${t.vagas} vagas ocupadas`} />
      </div>
    </button>
  );
}

// Indicadores da turma
export function GroupKpis({ t }) {
  const st = statsTurma(t);
  return (
    <div className="kpis">
      <Kpi icon={Users} label="Alunos" value={st.n} hint={`${t.vagas - st.n} vaga(s) livre(s)`} />
      <Kpi icon={TrendingUp} label="Média da turma" value={st.media == null ? "—" : fmt(st.media)} hint="Soma das médias ÷ alunos" delay={40} />
      <Kpi icon={Award} label="Aprovados" value={st.n ? `${st.aprovados}/${st.n}` : "—"} hint={st.previsao ? "Previsão: se encerrasse hoje" : "Resultado final"} delay={80} />
      <Kpi icon={Armchair} label="Taxa de aprovação" value={st.taxa == null ? "—" : `${fmt(st.taxa, 0)}%`} hint={st.previsao ? "Previsão pelas regras do C++" : "Turma encerrada"} delay={120} />
    </div>
  );
}

// Tabela da turma: notas, média, frequência, situação e previsão
export function GroupTable({ t, renderExtra, extraHead, onEditGrade }) {
  const { d } = useApp();
  if (!t.matriculas.length) return <Empty icon={Users} title="Nenhum aluno nesta turma">Matricule alunos para começar.</Empty>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Aluno</th><th>Notas</th><th className="right">Média</th><th>Frequência</th><th>Situação</th>
            {!t.encerrada && <th>Previsão</th>}
            {extraHead && <th className="right">{extraHead}</th>}
          </tr>
        </thead>
        <tbody>
          {t.matriculas.map((m) => {
            const s = d.alunoBy[m.aluno];
            return (
              <tr key={m.aluno}>
                <td><div className="person"><Avatar name={s?.nome} id={m.aluno} size={32} /><div><b>{s?.nome}</b><span>{m.aluno}</span></div></div></td>
                <td><GradeChips m={m} onEdit={onEditGrade && ((i, n) => onEditGrade(m, i, n))} /></td>
                <td className="right"><Grade value={m.media} /></td>
                <td><AttendanceMeter value={m.frequencia} /></td>
                <td><StatusBadge status={m.situacao} /></td>
                {!t.encerrada && <td><StatusBadge status={m.previsao} /></td>}
                {renderExtra && <td className="right">{renderExtra(m, s)}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Histórico escolar de um aluno
export function TranscriptView({ student }) {
  const { d } = useApp();
  const list = turmasDoAluno(d, student.matricula).sort((a, b) => b.semestre.localeCompare(a.semestre));
  const closed = list.filter((t) => t.encerrada);
  const ms = closed.map((t) => matriculaDe(t, student.matricula));
  const avg = ms.length ? ms.reduce((s, m) => s + m.media, 0) / ms.length : null;
  const ok = ms.filter((m) => m.situacao === "Aprovado").length;
  const hours = closed.filter((t, i) => ms[i].situacao === "Aprovado").reduce((s, t) => s + (d.disciplinaBy[t.disciplina]?.cargaHoraria || 0), 0);

  return (
    <>
      <div className="kpis">
        <Kpi icon={TrendingUp} label="Média geral" value={avg == null ? "—" : fmt(avg)} hint="Disciplinas já encerradas" />
        <Kpi icon={Award} label="Aprovações" value={`${ok}/${closed.length}`} hint="Disciplinas concluídas" delay={40} />
        <Kpi icon={BookMarked} label="Carga horária cumprida" value={`${hours}h`} hint="Só disciplinas aprovadas" delay={80} />
        <Kpi icon={Clock3} label="Em andamento" value={list.length - closed.length} hint="Neste semestre" delay={120} />
      </div>
      <h2 className="section-title">Disciplinas cursadas <span className="count">{list.length}</span></h2>
      <div className="card">
        {!list.length ? <Empty icon={ScrollText} title="Nenhuma disciplina cursada ainda" /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Semestre</th><th>Disciplina</th><th className="right">Carga</th><th className="right">Média</th><th>Frequência</th><th>Situação</th></tr></thead>
              <tbody>
                {list.map((t) => {
                  const m = matriculaDe(t, student.matricula);
                  const disc = d.disciplinaBy[t.disciplina];
                  return (
                    <tr key={t.codigo}>
                      <td className="num">{t.semestre}</td>
                      <td><b>{disc?.nome}</b><div className="muted" style={{ fontSize: "var(--t-12)" }}>{disc?.codigo} · {t.codigo}</div></td>
                      <td className="right num">{disc?.cargaHoraria}h</td>
                      <td className="right"><Grade value={m.media} /></td>
                      <td><AttendanceMeter value={m.frequencia} /></td>
                      <td><StatusBadge status={m.situacao} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

// Grade semanal: cada aula vira um bloco posicionado pelo dia e pela hora
export function TimetableView({ turmas }) {
  const { d } = useApp();
  if (!turmas.length) return <div className="card"><Empty icon={CalendarDays} title="Sem aulas neste semestre" /></div>;
  const slots = turmas.map((t, i) => ({ t, i, ...parseHorario(t.horario) }));
  const first = Math.min(...slots.map((s) => s.inicio));
  const last = Math.max(...slots.map((s) => s.fim));
  const hours = Array.from({ length: last - first }, (_, i) => first + i);
  const todayIdx = new Date().getDay() - 1;   // 0 = SEG

  return (
    <div className="card card-pad">
      <div className="table-wrap">
        <div className="timetable" style={{ gridTemplateRows: `auto repeat(${hours.length}, 48px)` }}>
          <div />
          {DIAS.map((dia, i) => <div key={dia} className={`tt-head ${i === todayIdx ? "today" : ""}`} style={{ gridColumn: i + 2, gridRow: 1 }}>{dia}{i === todayIdx && " · hoje"}</div>)}
          {hours.map((h, r) => (
            <div key={h} style={{ display: "contents" }}>
              <div className="tt-time" style={{ gridColumn: 1, gridRow: r + 2 }}>{h}h</div>
              {DIAS.map((_, c) => <div key={c} className="tt-cell" style={{ gridColumn: c + 2, gridRow: r + 2 }} />)}
            </div>
          ))}
          {slots.flatMap((s) =>
            s.dias.map((dia) => {
              const col = DIAS.indexOf(dia);
              if (col < 0) return null;
              const disc = d.disciplinaBy[s.t.disciplina];
              return (
                <div key={s.t.codigo + dia} className="tt-block" title={`${disc?.nome} · ${s.t.horario}`}
                  style={{ "--c": SERIES[s.i % SERIES.length], gridColumn: col + 2, gridRow: `${s.inicio - first + 2} / ${s.fim - first + 2}`, animationDelay: `${s.i * 60}ms` }}>
                  <b>{disc?.codigo}</b>
                  <span>{disc?.nome}</span>
                  <span>{s.inicio}h–{s.fim}h</span>
                </div>
              );
            })
          )}
        </div>
      </div>
      <div className="legend" style={{ marginTop: "var(--s-24)" }}>
        {turmas.map((t, i) => (
          <span key={t.codigo} className="chip" style={{ gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: SERIES[i % SERIES.length] }} aria-hidden />
            {d.disciplinaBy[t.disciplina]?.nome}
          </span>
        ))}
      </div>
    </div>
  );
}

// Ajuda: navegação, regras e legenda
export function HelpModal({ onClose }) {
  return (
    <Modal title="Ajuda" subtitle="Como usar o sistema e como a situação é calculada" onClose={onClose} width={640}>
      <div className="help-grid">
        <div>
          <h3>Navegação</h3>
          <ul>
            <li>O caminho no topo (Início › …) mostra onde você está. Clique em qualquer parte para voltar.</li>
            <li>O botão voltar do navegador também funciona.</li>
            <li><kbd>?</kbd> abre esta ajuda. <kbd>/</kbd> vai para a busca (Administrador). <kbd>Esc</kbd> fecha janelas.</li>
            <li>Toda ação que apaga dados pede confirmação antes.</li>
          </ul>
        </div>
        <div>
          <h3>Regras de aprovação</h3>
          <ul>
            <li><b>Sem prova final:</b> frequência abaixo de 75% reprova por falta; média 7 ou mais aprova.</li>
            <li><b>Com prova final:</b> média 7 ou mais aprova; abaixo de 3 reprova; entre 3 e 7 faz a final e passa se (média + final) ÷ 2 ≥ 5.</li>
            <li>Enquanto a turma está aberta, a situação é “Cursando”. A coluna “Previsão” mostra como ficaria se ela encerrasse hoje.</li>
          </ul>
        </div>
        <div>
          <h3>Matrícula</h3>
          <ul>
            <li>A turma tem limite de vagas, o mesmo aluno não entra duas vezes, e turma encerrada não aceita matrícula.</li>
          </ul>
        </div>
        <div>
          <h3>Legenda</h3>
          <div className="legend">{Object.keys(STATUS).map((s) => <StatusBadge key={s} status={s} />)}</div>
        </div>
      </div>
    </Modal>
  );
}
