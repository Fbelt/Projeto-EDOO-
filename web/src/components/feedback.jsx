import { useEffect, useRef, useState } from "react";
import { CheckCircle2, AlertCircle, X, Inbox } from "lucide-react";
import { Button, CloseButton, Icon } from "./primitives.jsx";

// Estado vazio: ícone discreto + frase + instrução
export const EmptyState = ({ title, children, icon = Inbox, bare }) => (
  <div className={bare ? "" : "empty"} style={bare ? { padding: "8px 0" } : null}>
    {!bare && <span className="ico"><Icon as={icon} size={20} /></span>}
    <b>{title}</b>
    {children && <p>{children}</p>}
  </div>
);

// Estado de salvamento: alterado → salvando → salvo
export function SaveStatus({ state, changes, noun = "notas", savingLong }) {
  if (state === "saving") return (
    <span className="status-line" role="status"><span className="spinner" />
      {savingLong ? <>Ainda salvando. <span className="sub">Não feche esta tela.</span></> : `Salvando ${noun === "notas" ? "as notas" : noun === "chamada" ? "a chamada" : "as alterações"}…`}
    </span>
  );
  if (state === "saved") return <span className="status-line success" role="status"><Icon as={CheckCircle2} size={16} />{noun === "chamada" ? "Chamada salva" : noun === "notas" ? "Notas salvas" : "Salvo"}</span>;
  if (changes > 0) return (
    <span className="status-line"><span className="spinner" style={{ animation: "none", borderTopColor: "var(--primary)" }} />{changes === 1 ? "1 alteração não salva" : `${changes} alterações não salvas`}</span>
  );
  return null;
}

// Falha: o que falhou, o que aconteceu com os dados, como tentar de novo
export function ErrorPanel({ title, children, onRetry, retryLabel = "Tentar de novo", secondary }) {
  return (
    <div className="callout tone-danger" role="alert" style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 12 }}>
        <Icon as={AlertCircle} size={18} />
        <div><b>{title}</b>{children}</div>
      </div>
      {(onRetry || secondary) && (
        <div className="row" style={{ paddingLeft: 30 }}>
          {onRetry && <Button variant="primary" size="sm" onClick={onRetry}>{retryLabel}</Button>}
          {secondary}
        </div>
      )}
    </div>
  );
}

// Diálogo (desktop) / folha inferior (celular). ESC e clique fora fecham.
export function Dialog({ title, onClose, children, actions, wide, fullscreen, labelledBy, icon }) {
  const ref = useRef();
  const opener = useRef(document.activeElement);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { e.stopPropagation(); close.current(); }
      if (e.key === "Tab" && ref.current) {   // mantém o foco dentro do diálogo
        const f = ref.current.querySelectorAll("button:not(:disabled), input:not(:disabled), select, textarea, [tabindex='0']");
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    (ref.current?.querySelector("input:not(:disabled), select, textarea") || ref.current?.querySelector(".dialog-actions .btn-primary, .dialog-actions .btn"))?.focus();
    const prev = opener.current;
    return () => { document.removeEventListener("keydown", onKey); prev?.focus?.(); };
  }, []);
  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className={`dialog ${wide ? "wide" : ""} ${fullscreen ? "fullscreen" : ""}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy || "dlg-title"}>
        <div className="dialog-body">
          {title && <div className="dialog-head">{icon}<h2 id="dlg-title">{title}</h2><CloseButton onClick={onClose} /></div>}
          {children}
        </div>
        {actions && <div className="dialog-actions">{actions}</div>}
      </div>
    </div>
  );
}

// Confirmação. Nível 1: um passo. Nível 2: digitar para confirmar.
export function ConfirmDialog({ title, children, confirmLabel, cancelLabel = "Voltar", onConfirm, onClose, destructive, typeToConfirm, busy, icon }) {
  const [typed, setTyped] = useState("");
  const ok = !typeToConfirm || typed.trim() === typeToConfirm;
  return (
    <Dialog title={title} onClose={onClose} icon={icon}
      actions={<>
        <Button variant="secondary" onClick={onClose}>{cancelLabel}</Button>
        <Button variant={destructive ? "danger" : "primary"} disabled={!ok || busy} onClick={onConfirm}>{busy ? "Aguarde…" : confirmLabel}</Button>
      </>}>
      <div style={{ color: "var(--text-2)", fontSize: 14, lineHeight: "21px" }}>{children}</div>
      {typeToConfirm && (
        <div className="field">
          <label htmlFor="type-confirm">Digite <b>{typeToConfirm}</b> para confirmar</label>
          <input id="type-confirm" className="input" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
        </div>
      )}
    </Dialog>
  );
}

export function Toasts({ items, dismiss }) {
  return (
    <div className="toasts" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast ${t.kind === "err" ? "err" : ""}`} role="status">
          <Icon as={t.kind === "err" ? AlertCircle : CheckCircle2} size={18} className="t-ico" />
          <p>{t.text}</p>
          {t.undo && <button type="button" className="undo" onClick={() => { t.undo(); dismiss(t.id); }}>Desfazer</button>}
          <button type="button" className="icon-btn" aria-label="Fechar aviso" onClick={() => dismiss(t.id)}><X size={16} aria-hidden /></button>
        </div>
      ))}
    </div>
  );
}

// Esqueleto: mesma anatomia da tela real, só luminosidade
export function PageSkeleton() {
  return (
    <div className="app" aria-busy="true" aria-label="Carregando">
      <aside className="sidebar" aria-hidden />
      <div className="main">
        <div className="page">
          <div className="sk" style={{ width: 280, height: 30, marginBottom: 12 }} />
          <div className="sk" style={{ width: 200, height: 14, marginBottom: 32 }} />
          <div className="card" style={{ padding: 20, display: "grid", gap: 14 }}>
            <div className="sk" style={{ width: 120, height: 14 }} />
            <div className="sk" style={{ width: "min(440px, 80%)", height: 36 }} />
            <div className="sk" style={{ width: 200, height: 14 }} />
          </div>
          <div className="card" style={{ marginTop: 16, padding: "8px 20px" }}>
            {[0, 1, 2].map((i) => <div key={i} style={{ display: "flex", gap: 24, padding: "16px 0", borderBottom: i < 2 ? "1px solid var(--border)" : 0 }}><div className="sk" style={{ width: 200, height: 14 }} /><div className="sk" style={{ width: 60, height: 14, marginLeft: "auto" }} /></div>)}
          </div>
        </div>
      </div>
    </div>
  );
}
