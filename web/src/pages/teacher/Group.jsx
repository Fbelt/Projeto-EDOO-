import { useState } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { useApp } from "../../App.jsx";
import { PageHeader } from "../../components/layout.jsx";
import { ContextLine, GroupState } from "../../components/academic.jsx";
import { Button, Callout, Icon, Tabs } from "../../components/primitives.jsx";
import { ConfirmDialog, EmptyState } from "../../components/feedback.jsx";
import { Roster } from "../../components/views.jsx";
import { plural } from "../../lib/format.js";
import { elegivelFinal } from "../../lib/rules.js";
import { Attendance } from "./Attendance.jsx";
import { Grades } from "./Grades.jsx";
import { FinalExam } from "./FinalExam.jsx";

export function Group({ teacher, code, tab }) {
  const { d, go, run, toast } = useApp();
  const [closing, setClosing] = useState(false);
  const [busy, setBusy] = useState(false);
  const t = d.turmaBy[code];
  const base = `professor/${teacher.matricula}`;

  if (!t || t.professor !== teacher.matricula) {
    return <div className="page"><div className="card"><EmptyState title="Turma não encontrada">Ela pode ter sido removida pela secretaria.<br /><button type="button" className="link" onClick={() => go(`${base}/turmas`)}>Ver suas turmas</button></EmptyState></div></div>;
  }
  const disc = d.disciplinaBy[t.disciplina];
  const tabs = [
    { key: "visao", label: "Visão geral" }, { key: "chamada", label: "Chamada" }, { key: "notas", label: "Notas" },
    ...(disc?.temFinal ? [{ key: "final", label: "Prova final" }] : []),
  ];
  const active = t.encerrada ? "visao" : tabs.some((x) => x.key === tab) ? tab : "visao";
  const semFinal = t.matriculas.filter((m) => disc?.temFinal && elegivelFinal(m) && m.notaFinal == null).length;

  async function finish() {
    setBusy(true);
    try { await run("turmas/encerrar", { turma: t.codigo }); toast(`Turma ${t.codigo} encerrada. Resultados oficiais calculados.`); setClosing(false); }
    catch (e) { toast(e.offline ? "Sem conexão. A turma continua em andamento." : e.message, { kind: "err" }); }
    setBusy(false);
  }

  const heading = { visao: null, chamada: "Chamada", notas: "Notas", final: "Prova final" }[active];
  return (
    <div className="page">
      <div style={{ marginBottom: 8 }}><button type="button" className="back" onClick={() => go(`${base}/turmas`)}><Icon as={ArrowLeft} size={16} />Turmas</button></div>
      <PageHeader
        title={heading ? `${heading} · ${disc?.nome}` : disc?.nome}
        actions={!t.encerrada && active === "visao" ? <Button icon={Lock} onClick={() => setClosing(true)}>Encerrar turma</Button> : null}>
        <div style={{ marginTop: 8 }}><div className="row" style={{ gap: 12 }}><GroupState closed={t.encerrada} /><ContextLine items={[`Turma ${t.codigo}`, t.semestre, t.horario, plural(t.matriculas.length, "aluno", "alunos")]} /></div></div>
      </PageHeader>

      {t.encerrada ? (
        <div className="stack-16">
          <Callout tone="neutral" icon={Lock} title="Turma encerrada">Os dados não podem mais ser alterados. Esta tela é somente leitura.</Callout>
          <Roster t={t} />
        </div>
      ) : (
        <div className="stack-16">
          <Tabs label="Seções da turma" tabs={tabs} value={active} onChange={(k) => go(`${base}/turma/${t.codigo}${k === "visao" ? "" : "/" + k}`)} />
          {active === "visao" && <Roster t={t} />}
          {active === "chamada" && <Attendance t={t} onDone={() => go(`${base}/turma/${t.codigo}`)} />}
          {active === "notas" && <Grades t={t} disc={disc} />}
          {active === "final" && <FinalExam t={t} />}
        </div>
      )}

      {closing && (
        <ConfirmDialog title={`Encerrar turma ${t.codigo}?`} confirmLabel="Encerrar turma" busy={busy} onClose={() => setClosing(false)} onConfirm={finish}>
          {semFinal > 0 && <p style={{ marginBottom: 8 }}><b>{plural(semFinal, "aluno fica", "alunos ficam")} em prova final sem nota.</b></p>}
          <p>Depois de encerrada, ninguém altera notas nem chamada. Isso não pode ser desfeito.</p>
        </ConfirmDialog>
      )}
    </div>
  );
}
