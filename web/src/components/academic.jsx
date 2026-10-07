// Assinaturas do EDOO: situação acadêmica e Academic Status Rail.
import { AlertTriangle } from "lucide-react";
import { MIN_FREQ, projectionLabel, statusMeta } from "../lib/rules.js";
import { fmtAvg, fmtPct, plural } from "../lib/format.js";
import { Badge, Icon } from "./primitives.jsx";

// Situação: sempre texto + ponto semântico (a cor nunca vai sozinha)
export function StatusBadge({ status, avg, projection, text, prefix }) {
  const meta = statusMeta(status);
  const label = text || (projection ? projectionLabel(status, avg) : meta.label);
  return (
    <Badge tone={meta.tone} projection={projection}>
      {prefix}{label}
      {projection && <span className="sr-only"> (projeção)</span>}
    </Badge>
  );
}

export const GroupState = ({ closed }) => <Badge tone={closed ? "neutral" : "primary"}>{closed ? "Encerrada" : "Em andamento"}</Badge>;

// Linha de contexto: código · semestre · professor
export const ContextLine = ({ items }) => <div className="meta-line">{items.filter(Boolean).map((x, i) => <span key={i}>{x}</span>)}</div>;

// ── Academic Status Rail ───────────────────────────────────────
// Valor atual + trilho fino com o limite (threshold) marcado.
export function StatusRail({ label, value, display, unit, max, threshold, thresholdLabel, tone, foot, compact, ariaLabel }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const tick = Math.max(0, Math.min(100, (threshold / max) * 100));
  return (
    <div className={`rail ${tone || ""} ${compact ? "compact" : ""}`}>
      <div className="rail-top">
        <span className="rail-label">{label}</span>
        <span className="rail-value">{display}{unit && <small>{unit}</small>}</span>
      </div>
      <div className="rail-track" role="meter" aria-label={ariaLabel || `${label} ${display}${unit || ""}, mínimo ${thresholdLabel}`} aria-valuenow={Math.round(value * 10) / 10} aria-valuemin={0} aria-valuemax={max}>
        <div className="rail-fill" style={{ width: `${pct}%` }} />
        <span className="rail-tick" style={{ left: `${tick}%` }} />
        <span className="rail-tick-label" style={{ left: `${tick}%` }}>{thresholdLabel}</span>
        <span className="rail-dot" style={{ left: `${pct}%` }} />
      </div>
      {foot && !compact && <div className="rail-foot">{foot}</div>}
    </div>
  );
}

// Média (limite 7,0) + Frequência (limite 75%): vêm dos dados da matrícula
export function AcademicRails({ m, compact }) {
  const semNotas = !m.notas.length;
  const mediaTone = semNotas ? "" : m.media >= 7 ? "ok" : m.media >= 3 ? "warn" : "bad";
  const freqLow = m.frequencia < MIN_FREQ;
  return (
    <div className="rails">
      <StatusRail compact={compact} label="Média" value={semNotas ? 0 : m.media} display={semNotas ? "—" : fmtAvg(m.media)} max={10} threshold={7} thresholdLabel="7,0" tone={mediaTone}
        foot={semNotas ? "Nenhuma nota lançada" : m.media >= 7 ? "Acima do mínimo para aprovação direta" : "Abaixo de 7,0"} />
      <StatusRail compact={compact} label="Frequência" value={m.frequencia} display={fmtPct(m.frequencia)} unit="%" max={100} threshold={MIN_FREQ} thresholdLabel="75%" tone={freqLow ? "bad" : "ok"}
        foot={m.aulas ? `${m.presencas} de ${plural(m.aulas, "aula", "aulas")}${freqLow ? " · abaixo do mínimo" : ""}` : "Nenhuma aula registrada"} />
    </div>
  );
}

// Presente (verde) · Falta (vermelho) — controle segmentado
export function AttendanceToggle({ absent, onChange, name, disabled }) {
  return (
    <div className="presence" role="group" aria-label={`Presença de ${name}`}>
      <button type="button" className="p" aria-pressed={!absent} onClick={() => onChange(false)} disabled={disabled}>Presente</button>
      <button type="button" className="f" aria-pressed={absent} onClick={() => onChange(true)} disabled={disabled}>Falta</button>
    </div>
  );
}

// Célula de nota: salva · hover · foco · alterada · inválida · não lançada · leitura
export function GradeCell({ value, original, onChange, onCommit, onRevert, missing, readOnly, blocked, invalid, label, disabled, col }) {
  if (readOnly) return <span className="gcell readonly num" aria-label={label}>{original ?? "—"}</span>;
  if (blocked) return <span className="gcell blocked num" title="Lance a nota anterior primeiro" aria-label={`${label}: lance a nota anterior primeiro`}>—</span>;
  const changed = value !== undefined && value !== original;
  return (
    <input
      className={`gcell num ${missing && !changed ? "missing" : ""} ${changed && !invalid ? "changed" : ""} ${invalid ? "invalid" : ""}`}
      inputMode="decimal" disabled={disabled} data-col={col} aria-label={label} aria-invalid={invalid || undefined}
      placeholder={missing ? "Lançar" : ""} value={value ?? original ?? ""}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") { e.preventDefault(); onCommit?.(e.currentTarget); }
        if (e.key === "Escape") { e.preventDefault(); onRevert?.(); }
      }}
    />
  );
}

export const WarnLine = ({ children }) => <div className="consequence"><Icon as={AlertTriangle} size={13} />{children}</div>;
