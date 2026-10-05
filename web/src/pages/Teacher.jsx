import { useState } from "react";
import { Eye, PenLine, ClipboardCheck, Flag, Lock, Users, School, CheckCheck, Check, X, Save, Info } from "lucide-react";
import { useApp } from "../App.jsx";
import { Avatar, Button, Confirm, Empty, Field, Grade, Kpi, Modal, PageHeader, StatusBadge } from "../components/ui.jsx";
import { GradeChips, GroupCard, GroupKpis, GroupTable } from "../components/shared.jsx";
import { fmt, turmasDoProfessor } from "../lib.js";

// Converte o que foi digitado em nota. "" = vazio, NaN = inválido
const parseGrade = (txt) => {
  const s = String(txt).trim().replace(",", ".");
  if (s === "") return "";
  const n = Number(s);
  return /^\d+(\.\d+)?$/.test(s) && n >= 0 && n <= 10 ? n : NaN;
};

export function Home({ teacher }) {
  const { d, go } = useApp();
  const mine = turmasDoProfessor(d, teacher.matricula);
  const abertas = mine.filter((t) => !t.encerrada);
  const alunos = abertas.reduce((s, t) => s + t.matriculas.length, 0);
  const semNota = abertas.flatMap((t) => t.matriculas).filter((m) => !m.notas.length).length;

  return (
    <>
      <PageHeader title={`Olá, ${teacher.nome.split(" ")[0]}`} subtitle="Escolha uma turma para lançar notas, fazer a chamada ou encerrar o semestre" />
      <div className="kpis">
        <Kpi icon={School} label="Turmas abertas" value={abertas.length} hint={`${mine.length - abertas.length} encerrada(s)`} />
        <Kpi icon={Users} label="Alunos agora" value={alunos} hint="Nas turmas abertas" delay={40} />
        <Kpi icon={PenLine} label="Alunos sem nota" value={semNota} hint={semNota ? "Lance a primeira avaliação" : "Todos têm nota"} delay={80} />
      </div>
      <h2 className="section-title">Suas turmas <span className="count">{mine.length}</span></h2>
      <div className="grid-3">
        {mine.map((t, i) => <GroupCard key={t.codigo} t={t} delay={i * 40} onOpen={() => go(`professor/${teacher.matricula}/turma/${t.codigo}`)} />)}
      </div>
      {!mine.length && <div className="card"><Empty icon={School} title="Você ainda não tem turmas">A secretaria cria as turmas e escolhe o professor.</Empty></div>}
    </>
  );
}

const MODES = [
  { key: "ver", label: "Visão geral", Icon: Eye },
  { key: "notas", label: "Lançar notas", Icon: PenLine },
  { key: "chamada", label: "Chamada", Icon: ClipboardCheck },
  { key: "final", label: "Prova final", Icon: Flag },
];

export function Diary({ teacher, code }) {
  const { d, act } = useApp();
  const t = d.turmaBy[code];
  const [mode, setMode] = useState("ver");
  const [edit, setEdit] = useState(null);
  const [closing, setClosing] = useState(false);
  if (!t || t.professor !== teacher.matricula) return <Empty icon={School} title="Turma não encontrada" />;

  const disc = d.disciplinaBy[t.disciplina];
  const locked = t.encerrada;
  const modes = MODES.filter((m) => m.key !== "final" || disc?.temFinal);

  return (
    <>
      <PageHeader title={disc?.nome} subtitle={`${t.codigo} · ${t.horario} · ${t.matriculas.length} aluno(s) · ${disc?.temFinal ? "com prova final" : "sem prova final"}`}>
        {!locked && <Button icon={Lock} onClick={() => setClosing(true)}>Encerrar turma</Button>}
      </PageHeader>

      {locked && <div className="banner tone-neutral"><Lock size={20} aria-hidden /><p><b>Turma encerrada</b>A situação de cada aluno é final. Notas e frequência não podem mais mudar.</p></div>}

      <GroupKpis t={t} />

      <div className="row-between" style={{ margin: "var(--s-40) 0 var(--s-16)", flexWrap: "wrap" }}>
        <div className="segmented" role="group" aria-label="O que fazer no diário">
          {modes.map((m) => (
            <button key={m.key} aria-pressed={mode === m.key} onClick={() => setMode(m.key)} disabled={locked && m.key !== "ver"} title={locked && m.key !== "ver" ? "Turma encerrada" : ""}>
              <m.Icon size={16} aria-hidden />{m.label}
            </button>
          ))}
        </div>
        {mode === "ver" && !locked && <span className="muted" style={{ fontSize: "var(--t-12)", display: "inline-flex", gap: 4, alignItems: "center" }}><Info size={14} aria-hidden />Clique numa nota para corrigir</span>}
      </div>

      <div className="card" key={mode}>
        {mode === "ver" && <GroupTable t={t} onEditGrade={locked ? null : (m, i, n) => setEdit({ m, i, n })} />}
        {mode === "notas" && <GradesMode t={t} done={() => setMode("ver")} />}
        {mode === "chamada" && <AttendanceMode t={t} done={() => setMode("ver")} />}
        {mode === "final" && <FinalMode t={t} done={() => setMode("ver")} />}
      </div>

      {edit && <EditGrade t={t} {...edit} onClose={() => setEdit(null)} />}
      {closing && (
        <Confirm title={`Encerrar ${t.codigo}?`} confirmLabel="Encerrar turma" onClose={() => setClosing(false)}
          onConfirm={async () => { await act("turmas/encerrar", { turma: t.codigo }); setClosing(false); setMode("ver"); }}>
          A situação final de cada aluno será calculada pelas regras da disciplina, e notas e frequência ficarão travadas. Isso não pode ser desfeito.
        </Confirm>
      )}
    </>
  );
}

// Lança uma avaliação nova para a turma toda (campo vazio = pula o aluno)
function GradesMode({ t, done }) {
  const { d, act, toast } = useApp();
  const [vals, setVals] = useState({});
  const [saving, setSaving] = useState(false);
  const parsed = Object.fromEntries(t.matriculas.map((m) => [m.aluno, parseGrade(vals[m.aluno] ?? "")]));
  const filled = Object.values(parsed).filter((v) => v !== "");
  const invalid = filled.some((v) => Number.isNaN(v));

  async function save() {
    setSaving(true);
    let ok = 0;
    for (const m of t.matriculas) {
      const v = parsed[m.aluno];
      if (v !== "" && (await act("notas", { turma: t.codigo, aluno: m.aluno, nota: v }, { quiet: true }))) ok++;
    }
    setSaving(false);
    toast(`${ok} nota(s) lançada(s) e salva(s).`);
    done();
  }

  return (
    <>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Aluno</th><th>Notas atuais</th><th className="right">Média atual</th><th>Nova avaliação</th><th className="right">Nova média</th></tr></thead>
          <tbody>
            {t.matriculas.map((m, idx) => {
              const s = d.alunoBy[m.aluno];
              const v = parsed[m.aluno];
              const bad = Number.isNaN(v);
              const next = v === "" || bad ? null : (m.notas.reduce((a, b) => a + b, 0) + v) / (m.notas.length + 1);
              return (
                <tr key={m.aluno}>
                  <td><div className="person"><Avatar name={s?.nome} id={m.aluno} size={32} /><div><b>{s?.nome}</b><span>Avaliação {m.notas.length + 1}</span></div></div></td>
                  <td><GradeChips m={m} /></td>
                  <td className="right"><Grade value={m.media} /></td>
                  <td>
                    <input className="input input-sm" inputMode="decimal" placeholder="0–10" value={vals[m.aluno] ?? ""} aria-invalid={bad} autoFocus={idx === 0}
                      aria-label={`Nota de ${s?.nome}`} onChange={(e) => setVals({ ...vals, [m.aluno]: e.target.value })}
                      onKeyDown={(e) => { if (e.key === "Enter") e.target.closest("tr").nextElementSibling?.querySelector("input")?.focus(); }} />
                    {bad && <div className="err" style={{ marginTop: 4, fontSize: 12, color: "var(--critical-text)" }}>De 0 a 10</div>}
                  </td>
                  <td className="right">{next == null ? <span className="muted">—</span> : <Grade value={next} />}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="modal-foot" style={{ justifyContent: "space-between" }}>
        <span className="muted" style={{ alignSelf: "center" }}>Vazio = pula o aluno · <kbd>Enter</kbd> vai para o próximo</span>
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={done}>Cancelar</Button>
          <Button variant="primary" icon={Save} disabled={!filled.length || invalid || saving} onClick={save}>{saving ? "Salvando…" : `Salvar ${filled.length || ""} nota(s)`}</Button>
        </div>
      </div>
    </>
  );
}

// Chamada: todos começam presentes, o professor marca só as faltas
function AttendanceMode({ t, done }) {
  const { d, act } = useApp();
  const [absent, setAbsent] = useState(new Set());
  const toggle = (mat, isAbsent) => {
    const n = new Set(absent);
    isAbsent ? n.add(mat) : n.delete(mat);
    setAbsent(n);
  };
  const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  async function save() {
    const presentes = t.matriculas.map((m) => m.aluno).filter((m) => !absent.has(m)).join(",");
    if (await act("chamada", { turma: t.codigo, presentes })) done();
  }

  return (
    <>
      <div className="row-between" style={{ padding: "var(--s-16) var(--s-24)", borderBottom: "1px solid var(--line)" }}>
        <span><b>Aula de {today}</b> <span className="muted">· aula nº {(t.matriculas[0]?.aulas || 0) + 1}</span></span>
        <Button size="sm" icon={CheckCheck} onClick={() => setAbsent(new Set())}>Todos presentes</Button>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Aluno</th><th>Frequência até agora</th><th className="right">Presença</th></tr></thead>
          <tbody>
            {t.matriculas.map((m) => {
              const s = d.alunoBy[m.aluno];
              const isAbsent = absent.has(m.aluno);
              return (
                <tr key={m.aluno}>
                  <td><div className="person"><Avatar name={s?.nome} id={m.aluno} size={32} /><div><b>{s?.nome}</b><span>{m.presencas} de {m.aulas} aulas</span></div></div></td>
                  <td className="num">{fmt(m.frequencia, 0)}%</td>
                  <td className="right">
                    <div className="presence" role="group" aria-label={`Presença de ${s?.nome}`}>
                      <button className={!isAbsent ? "on-p" : ""} aria-pressed={!isAbsent} onClick={() => toggle(m.aluno, false)}><Check size={14} aria-hidden />Presente</button>
                      <button className={isAbsent ? "on-f" : ""} aria-pressed={isAbsent} onClick={() => toggle(m.aluno, true)}><X size={14} aria-hidden />Falta</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="modal-foot" style={{ justifyContent: "space-between" }}>
        <span className="muted" style={{ alignSelf: "center" }}>{t.matriculas.length - absent.size} presente(s) · {absent.size} falta(s)</span>
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={done}>Cancelar</Button>
          <Button variant="primary" icon={Save} onClick={save}>Salvar chamada</Button>
        </div>
      </div>
    </>
  );
}

// Prova final: só aparece quem tem média entre 3 e 7 e frequência ≥ 75%
function FinalMode({ t, done }) {
  const { d, act, toast } = useApp();
  const list = t.matriculas.filter((m) => m.media >= 3 && m.media < 7 && m.frequencia >= 75);
  const [vals, setVals] = useState({});
  const parsed = Object.fromEntries(list.map((m) => [m.aluno, parseGrade(vals[m.aluno] ?? "")]));
  const filled = Object.values(parsed).filter((v) => v !== "");
  const invalid = filled.some((v) => Number.isNaN(v));

  if (!list.length) return <Empty icon={Flag} title="Ninguém precisa de prova final">Só faz a final quem tem média entre 3 e 7 e frequência de pelo menos 75%.</Empty>;

  async function save() {
    let ok = 0;
    for (const m of list) {
      const v = parsed[m.aluno];
      if (v !== "" && (await act("final", { turma: t.codigo, aluno: m.aluno, nota: v }, { quiet: true }))) ok++;
    }
    toast(`${ok} nota(s) de prova final salva(s).`);
    done();
  }

  return (
    <>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Aluno</th><th className="right">Média</th><th className="right">Precisa tirar</th><th>Nota da final</th><th>Resultado</th></tr></thead>
          <tbody>
            {list.map((m) => {
              const s = d.alunoBy[m.aluno];
              const v = parsed[m.aluno];
              const need = Math.max(0, 10 - m.media);    // (média + final) / 2 ≥ 5
              const result = v === "" || Number.isNaN(v) ? null : (m.media + v) / 2 >= 5 ? "Aprovado" : "Reprovado por nota";
              return (
                <tr key={m.aluno}>
                  <td><div className="person"><Avatar name={s?.nome} id={m.aluno} size={32} /><div><b>{s?.nome}</b><span>{m.notaFinal != null ? `Final atual: ${fmt(m.notaFinal)}` : "Sem nota da final"}</span></div></div></td>
                  <td className="right"><Grade value={m.media} /></td>
                  <td className="right num" style={{ fontWeight: 600 }}>{fmt(need)}</td>
                  <td><input className="input input-sm" inputMode="decimal" placeholder="0–10" value={vals[m.aluno] ?? ""} aria-invalid={Number.isNaN(v)} aria-label={`Prova final de ${s?.nome}`} onChange={(e) => setVals({ ...vals, [m.aluno]: e.target.value })} /></td>
                  <td>{result ? <StatusBadge status={result} /> : <span className="muted">—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="modal-foot" style={{ justifyContent: "space-between" }}>
        <span className="muted" style={{ alignSelf: "center" }}>Passa se (média + final) ÷ 2 ≥ 5</span>
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={done}>Cancelar</Button>
          <Button variant="primary" icon={Save} disabled={!filled.length || invalid} onClick={save}>Salvar notas da final</Button>
        </div>
      </div>
    </>
  );
}

// Corrigir uma nota já lançada
function EditGrade({ t, m, i, n, onClose }) {
  const { d, act } = useApp();
  const [val, setVal] = useState(String(n).replace(".", ","));
  const v = parseGrade(val);
  const bad = v === "" || Number.isNaN(v);
  async function save(e) {
    e?.preventDefault();
    if (bad) return;
    if (await act("notas", { turma: t.codigo, aluno: m.aluno, nota: v, indice: i })) onClose();
  }
  return (
    <Modal title={`Corrigir avaliação ${i + 1}`} subtitle={d.alunoBy[m.aluno]?.nome} onClose={onClose}
      footer={<><Button onClick={onClose}>Cancelar</Button><Button variant="primary" onClick={save} disabled={bad}>Salvar</Button></>}>
      <form onSubmit={save}>
        <Field label="Nova nota" hint={`Nota atual: ${fmt(n)}`} error={val && bad ? "Digite um número de 0 a 10. Ex: 7,5" : null}>
          <input className="input num" inputMode="decimal" value={val} onChange={(e) => setVal(e.target.value)} aria-invalid={!!(val && bad)} />
        </Field>
      </form>
    </Modal>
  );
}
