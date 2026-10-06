import { CheckCircle2 } from "lucide-react";
import { useApp } from "../../App.jsx";
import { PageHeader } from "../../components/layout.jsx";
import { EmptyState } from "../../components/feedback.jsx";
import { AttentionList, GroupList } from "../../components/views.jsx";
import { Tabs } from "../../components/primitives.jsx";
import { useState } from "react";
import { pendenciasProfessor, turmasDoProfessor } from "../../lib/rules.js";

export function Groups({ teacher }) {
  const { d, go } = useApp();
  const [filter, setFilter] = useState("abertas");
  const mine = turmasDoProfessor(d, teacher.matricula);
  const list = mine.filter((t) => (filter === "abertas" ? !t.encerrada : t.encerrada));
  const n = (f) => mine.filter((t) => (f === "abertas" ? !t.encerrada : t.encerrada)).length;
  return (
    <div className="page">
      <PageHeader title={<>Turmas<span className="count-pill">{mine.length}</span></>} subtitle="Suas turmas do semestre e de semestres anteriores." />
      <div className="stack-16">
        <Tabs label="Filtrar turmas" value={filter} onChange={setFilter} tabs={[{ key: "abertas", label: "Em andamento", count: n("abertas") }, { key: "encerradas", label: "Encerradas", count: n("encerradas") }]} />
        <GroupList turmas={list} showTeacher={false} onOpen={(t) => go(`professor/${teacher.matricula}/turma/${t.codigo}`)} />
      </div>
    </div>
  );
}

export function Pending({ teacher }) {
  const { d, go } = useApp();
  const items = pendenciasProfessor(d, teacher.matricula).sort((a, b) => a.turma.codigo.localeCompare(b.turma.codigo));
  return (
    <div className="page" style={{ maxWidth: 880, marginInline: 0 }}>
      <PageHeader title="Pendências" subtitle="O que precisa da sua atenção, agrupado por turma." />
      <section className="card">
        {items.length
          ? <AttentionList items={items} onAction={(it) => go(`professor/${teacher.matricula}/turma/${it.turma.codigo}/${it.tab}`)} />
          : <EmptyState icon={CheckCircle2} title="Nenhuma pendência">Quando uma turma precisar de você, ela aparece aqui.</EmptyState>}
      </section>
      <p className="tiny muted" style={{ marginTop: 12 }}>A pendência de chamada considera só as chamadas feitas neste aparelho: o sistema ainda não guarda a data de cada aula.</p>
    </div>
  );
}
