import { useEffect, useState } from "react";
import { X, Search } from "lucide-react";
import { initials } from "../lib/format.js";

// Ícones: uma família só (lucide), outline, 16–20px
export function Icon({ as: Cmp, size = 18, ...rest }) {
  return <Cmp size={size} strokeWidth={1.75} aria-hidden {...rest} />;
}

// Botão: primary · secondary · ghost · danger · danger-soft
export function Button({ variant = "secondary", size, block, icon, children, className = "", ...rest }) {
  const cls = ["btn", `btn-${variant}`, size && `btn-${size}`, block && "btn-block", className].filter(Boolean).join(" ");
  return (
    <button type="button" className={cls} {...rest}>
      {icon && <Icon as={icon} size={16} />}
      {children}
    </button>
  );
}

// Ação em texto (link azul)
export function LinkButton({ children, icon, danger, className = "", ...rest }) {
  return (
    <button type="button" className={`link ${danger ? "danger" : ""} ${className}`} {...rest}>
      {icon && <Icon as={icon} size={14} />}
      {children}
    </button>
  );
}

export function IconButton({ icon, label, size = 18, ...rest }) {
  return (
    <button type="button" className="icon-btn" aria-label={label} title={label} {...rest}>
      <Icon as={icon} size={size} />
    </button>
  );
}

export const CloseButton = ({ onClick, label = "Fechar" }) => <span className="x"><IconButton icon={X} label={label} onClick={onClick} /></span>;

export const Avatar = ({ name }) => <span className="avatar" aria-hidden>{initials(name)}</span>;
export const Tally = ({ n }) => (n ? <span className="tally" aria-label={`${n} pendente(s)`}>{n}</span> : null);

// Badge semântico discreto (verde = aprovado, âmbar = atenção, vermelho = risco, azul = em andamento)
export function Badge({ tone = "neutral", icon, dot = true, projection, children }) {
  return (
    <span className={`badge tone-${tone} ${projection ? "projection" : ""}`}>
      {icon ? <Icon as={icon} size={13} /> : dot ? <span className="dot" aria-hidden /> : null}
      {children}
    </span>
  );
}

// Aviso contextual
export function Callout({ tone = "neutral", icon, title, children }) {
  return (
    <div className={`callout tone-${tone}`} role={tone === "danger" ? "alert" : undefined}>
      {icon && <Icon as={icon} size={18} />}
      <div>{title && <b>{title}</b>}{children}</div>
    </div>
  );
}

export function Stats({ items }) {
  return (
    <div className="card stats" style={{ "--n": items.length }}>
      {items.map((s) => (
        <div className="stat" key={s.label}>
          <span className="k">{s.icon && <Icon as={s.icon} size={15} />}{s.label}</span>
          <span className="v">{s.value}</span>
          {s.hint && <span className="h">{s.hint}</span>}
        </div>
      ))}
    </div>
  );
}

// Rótulo sempre visível acima; ajuda embaixo; erro troca a ajuda
export function Field({ id, label, help, error, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="control">{children}</div>
      {error ? <span className="error" id={`${id}-msg`} role="alert">{error}</span> : help ? <span className="help" id={`${id}-msg`}>{help}</span> : null}
    </div>
  );
}
export const fieldProps = (id, error, help) => ({
  id, className: "input", "aria-invalid": error ? true : undefined, "aria-describedby": error || help ? `${id}-msg` : undefined,
});

export function SearchBox({ value, onChange, placeholder, inputRef, shortcut, onSubmit, label }) {
  return (
    <form className="search" role="search" onSubmit={(e) => { e.preventDefault(); onSubmit?.(value); }}>
      <Icon as={Search} size={16} className="lead" />
      <input ref={inputRef} className="input" type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={label || placeholder} />
      {shortcut && !value && <kbd aria-hidden>{shortcut}</kbd>}
    </form>
  );
}

export function Tabs({ tabs, value, onChange, label }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <button key={t.key} type="button" role="tab" className="tab" aria-selected={value === t.key} onClick={() => onChange(t.key)}>
          {t.label}{t.count != null && <span className="count-pill">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Segmented({ options, value, onChange, label }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => <button key={o.key} type="button" aria-pressed={value === o.key} onClick={() => onChange(o.key)}>{o.label}</button>)}
    </div>
  );
}

function useMedia(query) {
  const get = () => typeof window !== "undefined" && window.matchMedia(query).matches;
  const [match, setMatch] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}
export const useIsMobile = () => useMedia("(max-width: 767px)");
