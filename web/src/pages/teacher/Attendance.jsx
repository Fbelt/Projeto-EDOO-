import { useEffect, useMemo, useState } from "react";
import { CheckCheck, CheckCircle2, UserSearch } from "lucide-react";
import { useApp, useChrome } from "../../App.jsx";
import { AttendanceToggle, WarnLine } from "../../components/academic.jsx";
import { Avatar, Badge, Button, Icon, SearchBox, useIsMobile } from "../../components/primitives.jsx";
import { EmptyState, ErrorPanel, SaveStatus } from "../../components/feedback.jsx";
import { TableCard } from "../../components/views.jsx";
import { fmtPct, longDate, normalize, plural } from "../../lib/format.js";
import { MIN_FREQ, freqComFalta, marcarChamadaHoje } from "../../lib/rules.js";
import { useSave } from "./useSave.js";

// Anel de presença: azul (presentes) + cinza (faltas)
function Ring({ present, total }) {
  const r = 38, c = 2 * Math.PI * r;
  const pct = total ? present / total : 0;
  return (
    <svg className="donut" width="104" height="104" viewBox="0 0 104 104" role="img" aria-label={`${present} de ${total} presentes`}>
      <circle cx="52" cy="52" r={r} fill="none" stroke="var(--border)" strokeWidth="9" />
      <circle cx="52" cy="52" r={r} fill="none" stroke="var(--primary)" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} transform="rotate(-90 52 52)" style={{ transition: "stroke-dasharray 400ms var(--ease)" }} />
      <text x="52" y="57" textAnchor="middle" fontSize="17" fontWeight="650" fill="var(--text)" style={{ fontVariantNumeric: "tabular-nums" }}>{Math.round(pct * 100)}%</text>
    </svg>
  );
}

// Chamada: ferramenta operacional
export function Attendance({ t, onDone }) {
  const { d, run, setDirty } = useApp();
  const mobile = useIsMobile();
  const [absent, setAbsent] = useState(() => new Set());
  const [q, setQ] = useState("");
  const [result, setResult] = useState(null);
  const save = useSave();
  useChrome({ hideNav: mobile && !result });

  useEffect(() => {
    setDirty(absent.size && !result ? `Você marcou ${plural(absent.size, "falta", "faltas")} que ainda não ${absent.size === 1 ? "foi registrada" : "foram registradas"}.` : null);
    return () => setDirty(null);
  }, [absent, result, setDirty]);

  const rows = useMemo(() => t.matriculas.map((m, i) => ({ m, i, s: d.alunoBy[m.aluno] })).filter(({ m, s }) => !q || normalize(`${s?.nome} ${m.aluno}`).includes(normalize(q))), [t, d, q]);

  if (!t.matriculas.length) return <div className="card"><EmptyState title="Nenhum aluno matriculado">Não há chamada a fazer nesta turma.</EmptyState></div>;

  const total = t.matriculas.length;
  const present = total - absent.size;
  const toggle = (mat, isAbsent) => { const n = new Set(absent); isAbsent ? n.add(mat) : n.delete(mat); setAbsent(n); save.reset(); };

  async function submit() {
    save.start();
    try {
      await run("chamada", { turma: t.codigo, presentes: t.matriculas.map((m) => m.aluno).filter((m) => !absent.has(m)).join(",") });
      marcarChamadaHoje(t.codigo);
      setResult({ present, absent: absent.size });
      setAbsent(new Set());
      save.done();
    } catch (e) { save.fail(e); }
  }

  if (result) {
    return (
      <div className="card card-pad stack-16" aria-live="polite" style={{ maxWidth: 560 }}>
        <span className="status-line success"><Icon as={CheckCircle2} size={18} />Chamada registrada</span>
        <p className="text-2">{plural(result.present, "presente", "presentes")} · {plural(result.absent, "falta", "faltas")}. A turma agora tem {plural(Math.max(...t.matriculas.map((m) => m.aulas)), "aula registrada", "aulas registradas")}.</p>
        <div className="row"><Button variant="primary" onClick={onDone}>Voltar à visão geral</Button><Button onClick={() => { setResult(null); save.reset(); }}>Fazer outra chamada</Button></div>
      </div>
    );
  }

  const locked = save.saving;
  return (
    <div className="att-layout">
      <section className="stack-16" aria-labelledby="att-title">
        <div className="row-between">
          <div className="stack-4"><h2 id="att-title" className="section-title">Fazer chamada</h2><p className="small muted">{longDate()}. Todos começam presentes: marque só quem faltou.</p></div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <div style={{ flex: 1, minWidth: 200, maxWidth: 360 }}><SearchBox value={q} onChange={setQ} placeholder="Buscar aluno..." /></div>
          <Button icon={CheckCheck} onClick={() => { setAbsent(new Set()); save.reset(); }} disabled={locked || absent.size === 0}>Marcar todos</Button>
        </div>

        {save.phase === "error" && (
          <ErrorPanel title={save.error?.offline ? "Sem conexão" : "Não foi possível registrar a chamada"} onRetry={submit} secondary={<Button size="sm" onClick={onDone}>Voltar</Button>}>
            Nada foi salvo. As marcações continuam aqui; você pode tentar de novo.
          </ErrorPanel>
        )}

        {rows.length === 0 ? <div className="card"><EmptyState icon={UserSearch} title={`Nenhum resultado para “${q}”`}>Procure por nome ou matrícula.</EmptyState></div> : mobile ? (
          <div className="card"><ul className="mlist">
            {rows.map(({ m, s }) => {
              const isAbsent = absent.has(m.aluno);
              const after = freqComFalta(m);
              return (
                <li key={m.aluno} className="mrow" style={{ display: "grid", gap: 10 }}>
                  <div className="cell-name"><Avatar name={s?.nome} /><div><b>{s?.nome}</b><span className="s num">{m.aluno} · {fmtPct(m.frequencia)}% de frequência</span></div></div>
                  <AttendanceToggle name={s?.nome} absent={isAbsent} onChange={(v) => toggle(m.aluno, v)} disabled={locked} />
                  {!isAbsent && after < MIN_FREQ && m.frequencia >= MIN_FREQ && <WarnLine>Uma falta leva a {fmtPct(after)}%, abaixo do mínimo de 75%.</WarnLine>}
                  {isAbsent && after < MIN_FREQ && <WarnLine>Com esta falta: {fmtPct(after)}%, abaixo do mínimo.</WarnLine>}
                </li>
              );
            })}
          </ul></div>
        ) : (
          <TableCard>
            <table className="dtable">
              <thead><tr><th className="idx">#</th><th>Aluno</th><th>Matrícula</th><th>Status</th><th className="r">Ação</th></tr></thead>
              <tbody>
                {rows.map(({ m, i, s }) => {
                  const isAbsent = absent.has(m.aluno);
                  const after = freqComFalta(m);
                  return (
                    <tr key={m.aluno}>
                      <td className="idx">{i + 1}</td>
                      <td><div className="cell-name"><Avatar name={s?.nome} /><div><b>{s?.nome}</b>
                        {(!isAbsent && after < MIN_FREQ && m.frequencia >= MIN_FREQ) && <WarnLine>Uma falta leva a {fmtPct(after)}%, abaixo do mínimo de 75%.</WarnLine>}
                        {(isAbsent && after < MIN_FREQ) && <WarnLine>Com esta falta: {fmtPct(after)}%, abaixo do mínimo.</WarnLine>}
                      </div></div></td>
                      <td className="num muted">{m.aluno}</td>
                      <td><Badge tone={isAbsent ? "danger" : "success"}>{isAbsent ? "Falta" : "Presente"}</Badge></td>
                      <td className="r"><AttendanceToggle name={s?.nome} absent={isAbsent} onChange={(v) => toggle(m.aluno, v)} disabled={locked} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableCard>
        )}
      </section>

      <aside className="card att-summary hide-mobile" aria-labelledby="att-res">
        <div className="card-head"><h2 id="att-res">Resumo da chamada</h2></div>
        <div className="card-pad stack-16">
          <div style={{ display: "grid", justifyItems: "center" }}><Ring present={present} total={total} /></div>
          <div className="summary-nums"><div><b>{present}</b><span>Presentes</span></div><div><b>{absent.size}</b><span>Faltas</span></div><div><b>{total}</b><span>Total</span></div></div>
          <div style={{ minHeight: 20 }}><SaveStatus state={save.phase === "error" ? "idle" : save.phase} changes={0} noun="chamada" savingLong={save.long} /></div>
          <Button variant="primary" size="lg" block onClick={submit} disabled={locked}>{locked ? "Salvando…" : "Salvar chamada"}</Button>
        </div>
      </aside>

      <div className="savebar sticky over-nav only-mobile">
        <div className="summary-nums" style={{ gap: 16, display: "flex" }}><div><b style={{ fontSize: 18 }}>{present}</b> <span className="tiny muted">presentes</span></div><div><b style={{ fontSize: 18 }}>{absent.size}</b> <span className="tiny muted">faltas</span></div></div>
        <Button variant="primary" onClick={submit} disabled={locked}>{locked ? "Salvando…" : "Salvar chamada"}</Button>
      </div>
    </div>
  );
}
