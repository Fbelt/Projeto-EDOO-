import { useEffect, useMemo, useState } from "react";
import { Flag } from "lucide-react";
import { useApp, useChrome } from "../../App.jsx";
import { StatusBadge } from "../../components/academic.jsx";
import { Avatar, Button, useIsMobile } from "../../components/primitives.jsx";
import { EmptyState, ErrorPanel, SaveStatus } from "../../components/feedback.jsx";
import { TableCard } from "../../components/views.jsx";
import { fmtAvg, fmtGrade, fmtOne } from "../../lib/format.js";
import { elegivelFinal, precisaNaFinal } from "../../lib/rules.js";
import { parseGrade, useSave } from "./useSave.js";

// Prova final: "Precisa de" em destaque; a projeção aparece ao digitar
export function FinalExam({ t }) {
  const { d, run, toast, setDirty } = useApp();
  const mobile = useIsMobile();
  const [vals, setVals] = useState({});
  const save = useSave();
  const list = t.matriculas.filter(elegivelFinal);

  const changes = useMemo(() => Object.entries(vals).filter(([aluno, v]) => {
    const p = parseGrade(v);
    const orig = list.find((m) => m.aluno === aluno)?.notaFinal;
    return p !== "" && (Number.isNaN(p) || p !== orig);
  }), [vals, list]);
  const invalid = changes.filter(([, v]) => Number.isNaN(parseGrade(v)));
  useChrome({ hideNav: mobile && changes.length > 0 });
  useEffect(() => { setDirty(changes.length ? "Há notas de prova final ainda não salvas." : null); return () => setDirty(null); }, [changes.length, setDirty]);

  if (!list.length) return <div className="card"><EmptyState icon={Flag} title="Ninguém precisa de prova final">Só faz a final quem tem média entre 3 e 7 e frequência de pelo menos 75%.</EmptyState></div>;

  async function submit() {
    if (invalid.length) return;
    save.start();
    const done = [];
    try {
      for (const [aluno, v] of changes) { await run("final", { turma: t.codigo, aluno, nota: parseGrade(v) }); done.push(aluno); }
      setVals({}); save.done(); toast(`${changes.length === 1 ? "Prova final salva" : `${changes.length} provas finais salvas`}.`);
    } catch (e) {
      setVals((cur) => { const n = { ...cur }; done.forEach((a) => delete n[a]); return n; });
      save.fail(e);
    }
  }

  const row = (m) => {
    const s = d.alunoBy[m.aluno];
    const v = vals[m.aluno];
    const p = parseGrade(v ?? (m.notaFinal != null ? String(m.notaFinal) : ""));
    const final = p === "" || Number.isNaN(p) ? null : (m.media + p) / 2;
    const status = final == null ? null : final >= 5 ? "Aprovado" : "Reprovado por nota";
    const bad = v !== undefined && v !== "" && Number.isNaN(parseGrade(v));
    const id = `pf-${m.aluno}`;
    const input = (
      <input id={id} className={`gcell num ${bad ? "invalid" : v !== undefined && v !== "" ? "changed" : "missing"}`} style={{ border: "1px solid var(--border-strong)", background: "#fff", width: 88 }} inputMode="decimal" aria-label={`Prova final de ${s?.nome}`} aria-invalid={bad || undefined}
        disabled={save.saving} value={v ?? (m.notaFinal != null ? fmtGrade(m.notaFinal) : "")} placeholder="0 a 10" onChange={(e) => { setVals({ ...vals, [m.aluno]: e.target.value }); save.reset(); }} />
    );
    const result = bad ? <span className="status-line danger">Use um valor de 0 a 10.</span>
      : status ? <StatusBadge status={status} projection text={`Média final ${fmtOne(final)} · ${status === "Aprovado" ? "aprovado" : "reprovado"}`} />
      : <span className="tiny muted">Não lançada</span>;
    return { s, input, result };
  };

  return (
    <section className="stack-16" aria-labelledby="pf-title">
      <div className="stack-4"><h2 id="pf-title" className="section-title">Prova final</h2><p className="small muted">Quem tem média entre 3 e 7 e frequência de pelo menos 75%. A projeção aparece assim que a nota é digitada.</p></div>

      {mobile ? (
        <div className="card"><ul className="mlist">
          {list.map((m) => { const { s, input, result } = row(m); return (
            <li key={m.aluno} className="mrow" style={{ display: "grid", gap: 12 }}>
              <div className="row-between"><div className="cell-name"><Avatar name={s?.nome} /><div><b>{s?.nome}</b><span className="s num">Média {fmtAvg(m.media)}</span></div></div>
                <div style={{ textAlign: "right" }}><div className="tiny muted">Precisa de</div><div className="metric" style={{ fontSize: 24 }}>{fmtOne(precisaNaFinal(m.media))}</div></div></div>
              <div className="row-between">{input}{result}</div>
            </li>); })}
        </ul></div>
      ) : (
        <TableCard foot="Média final = (média + prova final) ÷ 2. Aprova com 5 ou mais.">
          <table className="dtable">
            <thead><tr><th>Aluno</th><th className="r">Média</th><th className="r">Precisa de</th><th className="r">Prova final</th><th>Resultado</th></tr></thead>
            <tbody>
              {list.map((m) => { const { s, input, result } = row(m); return (
                <tr key={m.aluno}>
                  <td><div className="cell-name"><Avatar name={s?.nome} /><div><b>{s?.nome}</b><span className="s num">{m.aluno}</span></div></div></td>
                  <td className="r"><span className="avg">{fmtAvg(m.media)}</span></td>
                  <td className="r"><span className="metric" style={{ fontSize: 24, color: "var(--primary)" }}>{fmtOne(precisaNaFinal(m.media))}</span></td>
                  <td className="r">{input}</td>
                  <td>{result}</td>
                </tr>); })}
            </tbody>
          </table>
        </TableCard>
      )}

      {save.phase === "error" && (
        <ErrorPanel title={save.error?.offline ? "Sem conexão" : "Não foi possível salvar as provas finais"} onRetry={submit} secondary={<Button size="sm" onClick={() => { setVals({}); save.reset(); }}>Descartar</Button>}>
          As notas continuam na tela, mas ainda não estão salvas.
        </ErrorPanel>
      )}
      {(changes.length > 0 || save.phase === "saving" || save.phase === "saved") && save.phase !== "error" && (
        <div className={`savebar sticky ${mobile ? "over-nav" : ""}`}>
          <SaveStatus state={save.phase} changes={changes.length} savingLong={save.long} noun="notas" />
          {changes.length > 0 && <div className="row">
            <Button disabled={save.saving} onClick={() => setVals({})}>Descartar</Button>
            <Button variant="primary" disabled={save.saving || invalid.length > 0} onClick={submit}>{save.saving ? "Salvando…" : "Salvar provas finais"}</Button>
          </div>}
        </div>
      )}
    </section>
  );
}
