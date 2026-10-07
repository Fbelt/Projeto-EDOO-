import { useCallback, useEffect, useRef, useState } from "react";

// Estados de salvamento: idle → saving (→ "ainda salvando" após 5 s) → saved (4 s) | error
export function useSave() {
  const [phase, setPhase] = useState("idle");
  const [error, setError] = useState(null);
  const [long, setLong] = useState(false);
  const timers = useRef([]);
  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => clear, []);

  const start = useCallback(() => {
    clear(); setPhase("saving"); setError(null); setLong(false);
    timers.current.push(setTimeout(() => setLong(true), 5000));
  }, []);
  const done = useCallback(() => {
    clear(); setPhase("saved"); setLong(false);
    timers.current.push(setTimeout(() => setPhase("idle"), 4000));
  }, []);
  const fail = useCallback((e) => { clear(); setPhase("error"); setError(e); setLong(false); }, []);
  const reset = useCallback(() => { clear(); setPhase("idle"); setError(null); }, []);

  return { phase, error, long, start, done, fail, reset, saving: phase === "saving" };
}

// "7,5" → 7.5 · "" → "" · inválido → NaN
export function parseGrade(txt) {
  const s = String(txt ?? "").trim().replace(",", ".");
  if (s === "") return "";
  if (!/^\d{1,2}(\.\d+)?$/.test(s)) return NaN;
  const n = Number(s);
  return n >= 0 && n <= 10 ? n : NaN;
}
