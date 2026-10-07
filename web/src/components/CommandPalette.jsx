import { useEffect, useMemo, useRef, useState } from "react";
import { CornerDownLeft, Search } from "lucide-react";
import { Icon } from "./primitives.jsx";
import { normalize } from "../lib/format.js";

// Command Palette (⌘K / Ctrl K): só navega por rotas que já existem.
// items: [{ id, group, label, hint, icon, to }]
export function CommandPalette({ items, onClose, onGo }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const listRef = useRef();
  const opener = useRef(document.activeElement);

  const shown = useMemo(() => {
    const t = normalize(q.trim());
    return items.filter((i) => !t || normalize(`${i.label} ${i.hint || ""} ${i.group}`).includes(t)).slice(0, 30);
  }, [items, q]);

  useEffect(() => setSel(0), [q]);
  useEffect(() => { listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" }); }, [sel]);
  useEffect(() => { const prev = opener.current; return () => prev?.focus?.(); }, []);

  const choose = (i) => { if (i) { onClose(); onGo(i.to); } };
  const onKey = (e) => {
    if (e.key === "Escape") { e.preventDefault(); onClose(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, shown.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); choose(shown[sel]); }
  };

  let last = null;
  return (
    <div className="palette-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Busca e atalhos" onKeyDown={onKey}>
        <div className="palette-input">
          <Icon as={Search} size={18} />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar turma, aluno ou disciplina..." aria-label="Buscar" role="combobox" aria-expanded="true" aria-controls="palette-list" />
          <kbd>esc</kbd>
        </div>
        <div className="palette-list" id="palette-list" role="listbox" ref={listRef}>
          {shown.length === 0 && <div className="palette-empty">Nenhum resultado para “{q}”.</div>}
          {shown.map((it, idx) => {
            const head = it.group !== last ? <div className="palette-group" key={`g-${it.group}`}>{it.group}</div> : null;
            last = it.group;
            return (
              <div key={it.id} style={{ display: "contents" }}>
                {head}
                <button type="button" role="option" aria-selected={sel === idx} className="palette-item" onMouseMove={() => setSel(idx)} onClick={() => choose(it)}>
                  <Icon as={it.icon} size={18} /><span>{it.label}</span>{it.hint && <span className="hint">{it.hint}</span>}
                </button>
              </div>
            );
          })}
        </div>
        <div className="palette-foot">
          <span><kbd>↑</kbd> <kbd>↓</kbd> navegar</span>
          <span><kbd><CornerDownLeft size={11} aria-hidden /></kbd> abrir</span>
          <span><kbd>esc</kbd> fechar</span>
        </div>
      </div>
    </div>
  );
}
