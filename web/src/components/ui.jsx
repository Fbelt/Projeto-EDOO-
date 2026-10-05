import { useEffect, useRef } from "react";
import { X, AlertTriangle, Search, Inbox } from "lucide-react";
import { STATUS, fmt, gradeClass, initials, avatarColor } from "../lib.js";

export function Button({ variant = "secondary", size, icon: Icon, children, className = "", ...rest }) {
  const cls = ["btn", `btn-${variant}`, size === "sm" && "btn-sm", !children && "icon-btn", className].filter(Boolean).join(" ");
  return (
    <button className={cls} {...rest}>
      {Icon && <Icon size={size === "sm" ? 16 : 18} aria-hidden />}
      {children}
    </button>
  );
}

export function Badge({ tone = "neutral", icon: Icon, children }) {
  return (
    <span className={`badge tone-${tone}`}>
      {Icon && <Icon aria-hidden />}
      {children}
    </span>
  );
}

// Situação com ícone + texto (cor nunca é o único sinal)
export function StatusBadge({ status }) {
  const s = STATUS[status] || { tone: "neutral" };
  return <Badge tone={s.tone} icon={s.Icon}>{status}</Badge>;
}

export function Grade({ value, big }) {
  return <span className={`${big ? "big-grade" : "grade"} ${gradeClass(value)}`}>{fmt(value)}</span>;
}

// Medidor de frequência: verde ≥ 75%, vermelho abaixo, com a marca dos 75%
export function AttendanceMeter({ value, mark = 75 }) {
  const ok = value >= mark;
  return (
    <div className="meter" title={`Frequência ${fmt(value, 0)}% · mínimo ${mark}%`}>
      <div className="meter-track" role="meter" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} aria-label="Frequência">
        <div className="meter-fill" style={{ width: `${value}%`, background: ok ? "var(--good)" : "var(--critical)" }} />
        <div className="meter-mark" style={{ left: `${mark}%` }} aria-hidden />
      </div>
      <span className={`meter-value ${ok ? "" : "grade-bad"}`}>{fmt(value, 0)}%</span>
    </div>
  );
}

// Medidor neutro (ocupação de vagas)
export function Meter({ value, label }) {
  const full = value >= 100;
  return (
    <div className="meter" title={label}>
      <div className="meter-track" role="meter" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="meter-fill" style={{ width: `${Math.min(value, 100)}%`, background: full ? "var(--warning)" : "var(--accent)" }} />
      </div>
    </div>
  );
}

export function Avatar({ name, id, size = 40 }) {
  return (
    <span className="avatar" style={{ width: size, height: size, background: avatarColor(id || name), fontSize: size * 0.36 }} aria-hidden>
      {initials(name)}
    </span>
  );
}

export function Kpi({ icon: Icon, label, value, hint, delay = 0 }) {
  return (
    <div className="card kpi rise" style={{ animationDelay: `${delay}ms` }}>
      <div className="kpi-label">{Icon && <Icon size={16} aria-hidden />}{label}</div>
      <div className="kpi-value">{value}</div>
      {hint && <div className="kpi-hint">{hint}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <header className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children && <div className="actions">{children}</div>}
    </header>
  );
}

export function Empty({ icon: Icon = Inbox, title, children }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon size={24} aria-hidden /></div>
      <b>{title}</b>
      {children && <div>{children}</div>}
    </div>
  );
}

export function Field({ label, hint, error, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {error ? <span className="err"><AlertTriangle size={14} aria-hidden />{error}</span> : hint && <span className="hint">{hint}</span>}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder, inputRef, shortcut }) {
  return (
    <div className="search">
      <Search size={16} aria-hidden />
      <input ref={inputRef} className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
      {shortcut && !value && <kbd>{shortcut}</kbd>}
    </div>
  );
}

// Modal com X, ESC e clique fora para fechar (o usuário sempre tem saída)
export function Modal({ title, subtitle, icon, onClose, children, footer, width }) {
  const ref = useRef();
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    ref.current?.querySelector("input, select, textarea, button.btn-primary")?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} ref={ref} style={width ? { width: `min(${width}px, 100%)` } : null}>
        <div className="modal-head">
          {icon}
          <div style={{ flex: 1 }}>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <Button variant="ghost" size="sm" icon={X} onClick={onClose} aria-label="Fechar" />
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

// Confirmação antes de ação destrutiva (prevenção de erro)
export function Confirm({ title, children, confirmLabel = "Remover", onConfirm, onClose }) {
  return (
    <Modal
      title={title}
      icon={<span className="danger-icon"><AlertTriangle size={20} aria-hidden /></span>}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      <div style={{ color: "var(--text-2)" }}>{children}</div>
    </Modal>
  );
}
