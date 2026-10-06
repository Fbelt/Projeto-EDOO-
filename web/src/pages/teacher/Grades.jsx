import { useEffect, useMemo, useState } from "react";
import { Plus, ClipboardList } from "lucide-react";
import { useApp, useChrome } from "../../App.jsx";
import { GradeCell, StatusBadge } from "../../components/academic.jsx";
import { Avatar, Button, useIsMobile } from "../../components/primitives.jsx";
import { EmptyState, ErrorPanel, SaveStatus } from "../../components/feedback.jsx";
import { TableCard } from "../../components/views.jsx";
import { fmtAvg, fmtGrade } from "../../lib/format.js";
import { maxNotas, media, projetar } from "../../lib/rules.js";
import { parseGrade, useSave } from "./useSave.js";

const key = (aluno, i) => `${aluno}|${i}`;

// Notas: tabela de dados com edição na própria célula
export function Grades({ t, disc }) {
  const { d, run, toast, setDirty } = useApp();
  const mobile = useIsMobile();
  const [edits, setEdits] = useState({});
  const [extra, setExtra] = useState(0);         // colunas novas ("Adicionar nota")
  const save = useSave();
  const k = maxNotas(t);
  const cols = Math.max(k + extra, 1);
  const temFinal = !!disc?.temFinal;

  // Só as alterações de verdade (valor diferente do salvo)
  const changes = useMemo(() => Object.entries(edits).filter(([kk, v]) => {
    const [aluno, i] = kk.split("|");
    const m = t.matriculas.find((x) => x.aluno === aluno);
    const orig = m?.notas[+i];
    const p = parseGrade(v);
    return p === "" ? false : orig === undefined || Number.isNaN(p) || p !== orig;
  }), [edits, t]);
  const invalid = changes.filter(([, v]) => Number.isNaN(parseGrade(v)));
  useChrome({ hideNav: mobile && changes.length > 0 });

  useEffect(() => {
    setDirty(changes.length ? `${changes.length === 1 ? "Há 1 nota" : `Há ${changes.length} notas`} ainda não salva${changes.length === 1 ? "" : "s"}.` : null);
    return () => setDirty(null);
  }, [changes.length, setDirty]);

  if (!t.matriculas.length) return <div className="card"><EmptyState icon={ClipboardList} title="Nenhum aluno matriculado">Quando houver alunos, as notas aparecem aqui.</EmptyState></div>;

  const setCell = (aluno, i, v) => { setEdits((e) => ({ ...e, [key(aluno, i)]: v })); if (save.phase !== "saving") save.reset(); };
  const revertCell = (aluno, i) => setEdits((e) => { const n = { ...e }; delete n[key(aluno, i)]; return n; });

  // Linha com as alterações aplicadas: a média e a situação se recalculam na hora
  function preview(m) {
    const notas = [...m.notas];
    for (let i = 0; i < cols; i++) {
      const p = parseGrade(edits[key(m.aluno, i)]);
      if (p === "" || Number.isNaN(p)) continue;
      if (i < notas.length) notas[i] = p; else if (i === notas.length) notas.push(p);
    }
    return { notas, avg: media(notas), status: notas.length ? projetar({ notas, frequencia: m.frequencia, notaFinal: m.notaFinal }, temFinal) : null };
  }

  // A célula i só aceita nota nova se as anteriores já existem (o servidor guarda por posição)
  function cellState(m, i) {
    if (i < m.notas.length) return "saved";
    let next = m.notas.length;
    while (next < i && parseGrade(edits[key(m.aluno, next)]) !== "" && !Number.isNaN(parseGrade(edits[key(m.aluno, next)]))) next++;
    return i <= next ? "missing" : "blocked";
  }

  async function submit() {
    if (invalid.length) return;
    save.start();
    const undo = [];
    const okKeys = [];
    try {
      for (const m of t.matriculas) {
        for (let i = 0; i < cols; i++) {
          const kk = key(m.aluno, i);
          const p = parseGrade(edits[kk]);
          if (p === "" || Number.isNaN(p)) continue;
          if (i < m.notas.length) {
            if (p === m.notas[i]) { okKeys.push(kk); continue; }
            await run("notas", { turma: t.codigo, aluno: m.aluno, nota: p, indice: i });
            undo.push({ aluno: m.aluno, i, from: m.notas[i], to: p });
          } else {
            await run("notas", { turma: t.codigo, aluno: m.aluno, nota: p });
            undo.push(null);   // nota nova: o sistema não remove notas
          }
          okKeys.push(kk);
        }
      }
      setEdits({}); setExtra(0); save.done();
      offerUndo(undo);
    } catch (e) {
      // O que já foi salvo sai da lista; o resto continua na tela
      setEdits((cur) => { const n = { ...cur }; okKeys.forEach((x) => delete n[x]); return n; });
      save.fail(e);
    }
  }

  // Sem confirmação, com desfazer (só para correções de notas existentes)
  function offerUndo(list) {
    if (!list.length || list.some((x) => x === null)) return;
    const one = list.length === 1 && list[0];
    const text = one ? `Nota ${one.i + 1} de ${d.alunoBy[one.aluno]?.nome} alterada de ${fmtGrade(one.from)} para ${fmtGrade(one.to)}.` : `${list.length} notas alteradas.`;
    toast(text, { undo: async () => {
      try { for (const x of list) await run("notas", { turma: t.codigo, aluno: x.aluno, nota: x.from, indice: x.i }); toast("Alteração desfeita."); }
      catch { toast("Não foi possível desfazer. As notas novas continuam salvas.", { kind: "err" }); }
    } });
  }

  const focusNext = (el) => {
    const all = [...document.querySelectorAll(`input.gcell[data-col="${el.dataset.col}"]`)];
    const idx = all.indexOf(el);
    (all[idx + 1] || el).focus();
  };

  const cell = (m, i) => {
    const st = cellState(m, i);
    const s = d.alunoBy[m.aluno];
    const v = edits[key(m.aluno, i)];
    const orig = i < m.notas.length ? fmtGrade(m.notas[i]) : undefined;
    const p = parseGrade(v);
    return (
      <GradeCell col={i} label={`Nota ${i + 1} de ${s?.nome}`} value={v} original={orig} missing={st === "missing"} blocked={st === "blocked"} disabled={save.saving}
        invalid={v !== undefined && v !== "" && Number.isNaN(p)} onChange={(x) => setCell(m.aluno, i, x)} onRevert={() => revertCell(m.aluno, i)} onCommit={focusNext} />
    );
  };

  const projection = (pv) => pv.status ? <StatusBadge status={pv.status} avg={pv.avg} projection /> : <span className="tiny muted">Não lançada</span>;

  return (
    <section className="stack-16" aria-labelledby="notas-title">
      <div className="row-between">
        <div className="stack-4"><h2 id="notas-title" className="section-title">Notas</h2><p className="small muted">Clique em uma nota para corrigi-la. <kbd>Enter</kbd> vai para o próximo aluno e <kbd>Esc</kbd> desfaz a célula.</p></div>
        <Button icon={Plus} onClick={() => setExtra((x) => x + 1)} disabled={save.saving}>Adicionar nota</Button>
      </div>

      {mobile ? (
        <div className="card"><ul className="mlist">
          {t.matriculas.map((m) => {
            const pv = preview(m);
            return (
              <li key={m.aluno} className="mrow" style={{ display: "grid", gap: 12 }}>
                <div className="row-between"><div className="cell-name"><Avatar name={d.alunoBy[m.aluno]?.nome} /><div><b>{d.alunoBy[m.aluno]?.nome}</b><span className="s num">{m.aluno}</span></div></div>
                  <div style={{ textAlign: "right" }}><div className="tiny muted">Média</div><div className="avg">{pv.notas.length ? fmtAvg(pv.avg) : "—"}</div></div></div>
                <div className="row" style={{ gap: 14 }}>
                  {Array.from({ length: cols }, (_, i) => <label key={i} style={{ display: "grid", gap: 4 }}><span className="tiny muted">Nota {i + 1}</span>{cell(m, i)}</label>)}
                  {temFinal && <div style={{ display: "grid", gap: 4 }}><span className="tiny muted">Final</span><span className="gcell readonly num">{m.notaFinal != null ? fmtGrade(m.notaFinal) : "—"}</span></div>}
                </div>
                {projection(pv)}
              </li>
            );
          })}
        </ul></div>
      ) : (
        <TableCard foot={`“Se encerrasse hoje” é uma projeção com as regras da disciplina (${temFinal ? "com" : "sem"} prova final). Notas são guardadas por posição: não há remoção.`}>
          <table className="dtable">
            <thead><tr><th>Aluno</th>{Array.from({ length: cols }, (_, i) => <th key={i} className="r">Nota {i + 1}</th>)}{temFinal && <th className="r">Final</th>}<th className="r">Média</th><th>Situação</th></tr></thead>
            <tbody>
              {t.matriculas.map((m) => {
                const pv = preview(m);
                return (
                  <tr key={m.aluno}>
                    <td><div className="cell-name"><Avatar name={d.alunoBy[m.aluno]?.nome} /><div><b>{d.alunoBy[m.aluno]?.nome}</b><span className="s num">{m.aluno}</span></div></div></td>
                    {Array.from({ length: cols }, (_, i) => <td key={i} className="r" style={{ width: 92 }}>{cell(m, i)}</td>)}
                    {temFinal && <td className="r num muted">{m.notaFinal != null ? fmtGrade(m.notaFinal) : "—"}</td>}
                    <td className="r"><span className="avg">{pv.notas.length ? fmtAvg(pv.avg) : "—"}</span></td>
                    <td>{projection(pv)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableCard>
      )}

      {save.phase === "error" && (
        <ErrorPanel title={save.error?.offline ? "Sem conexão" : "Não foi possível salvar as notas"} onRetry={submit}
          secondary={<Button size="sm" onClick={() => { setEdits({}); setExtra(0); save.reset(); }}>Descartar</Button>}>
          {save.error?.offline ? "As alterações continuam nesta tela. Salve quando a conexão voltar." : `${save.error?.message} As alterações continuam na tela, mas ainda não estão salvas.`}
        </ErrorPanel>
      )}

      {(changes.length > 0 || save.phase === "saving" || save.phase === "saved") && save.phase !== "error" && (
        <div className={`savebar sticky ${mobile ? "over-nav" : ""}`}>
          <div className="stack-4">
            <SaveStatus state={save.phase} changes={changes.length} savingLong={save.long} />
            {invalid.length > 0 && <span className="status-line danger">Use um valor de 0 a 10.</span>}
          </div>
          {changes.length > 0 && (
            <div className="row">
              <Button disabled={save.saving} onClick={() => { setEdits({}); setExtra(0); }}>Descartar</Button>
              <Button variant="primary" disabled={save.saving || invalid.length > 0} onClick={submit}>{save.saving ? "Salvando…" : "Salvar notas"}</Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
