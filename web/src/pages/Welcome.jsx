import { useState } from "react";
import { ArrowRight, ArrowLeft, ShieldCheck, Presentation, GraduationCap, Database, School, UserX } from "lucide-react";
import { useApp } from "../App.jsx";
import { AttendanceMeter, Avatar, Button, Empty, Grade, SearchInput, StatusBadge } from "../components/ui.jsx";
import { normalize, turmasDoAluno, turmasDoProfessor } from "../lib.js";

const PROFILES = [
  { key: "admin", label: "Administrador", desc: "Secretaria: cadastros, turmas, matrículas e relatórios", Icon: ShieldCheck, to: "admin" },
  { key: "teacher", label: "Professor", desc: "Diário de classe: notas, chamada e prova final", Icon: Presentation, to: "entrar/professor" },
  { key: "student", label: "Aluno", desc: "Notas, frequência, horário e histórico", Icon: GraduationCap, to: "entrar/aluno" },
];

export function Welcome() {
  const { d, go } = useApp();
  return (
    <div className="welcome">
      <div className="welcome-main">
        <div className="logo"><span className="logo-mark"><School size={18} aria-hidden /></span>EDOO Acadêmico</div>
        <div>
          <span className="eyebrow"><span className="live-dot" aria-hidden />Conectado ao banco SQLite · {d.alunos.length} alunos · {d.turmas.length} turmas</span>
          <h1>Quem está usando<br />o sistema hoje?</h1>
          <p className="lead">Escolha um perfil. Cada um vê só o que precisa, e todas as regras de aprovação são calculadas pelas classes C++ do projeto.</p>
        </div>
        <div className="profiles">
          {PROFILES.map((p, i) => (
            <button key={p.key} className="profile-card rise" data-profile={p.key} style={{ animationDelay: `${i * 60}ms` }} onClick={() => go(p.to)}>
              <span className="ico"><p.Icon size={24} aria-hidden /></span>
              <span className="txt"><b>{p.label}</b><span>{p.desc}</span></span>
              <ArrowRight className="go" size={20} aria-hidden />
            </button>
          ))}
        </div>
        <div className="welcome-foot">
          <span>CIN0135 · Estruturas de Dados Orientadas a Objetos · CIn/UFPE</span>
          <span><Database size={12} aria-hidden style={{ verticalAlign: -1 }} /> data/escola.db</span>
        </div>
      </div>
      <Art />
    </div>
  );
}

// Ilustração do lado direito: cartões reais do sistema flutuando
function Art() {
  const { d } = useApp();
  const t = d.turmas.find((x) => !x.encerrada) || d.turmas[0];
  const m = t?.matriculas[0];
  const s = m && d.alunoBy[m.aluno];
  if (!m) return <div className="welcome-art" />;
  return (
    <div className="welcome-art" aria-hidden>
      <div className="art-stack">
        <div className="art-card float">
          <div className="person"><Avatar name={s.nome} id={s.matricula} /><div><b>{s.nome}</b><span>{d.disciplinaBy[t.disciplina]?.nome}</span></div></div>
        </div>
        <div className="art-card float d2" style={{ display: "grid", gap: 16 }}>
          <div className="row-between"><span className="muted">Média</span><Grade value={m.media} big /></div>
          <AttendanceMeter value={m.frequencia} />
        </div>
        <div className="art-card float d3 row-between">
          <span className="muted">Se encerrasse hoje</span>
          <StatusBadge status={m.previsao} />
        </div>
      </div>
    </div>
  );
}

// Escolher qual professor ou aluno está entrando (reconhecer em vez de lembrar)
export function PersonPicker({ kind }) {
  const { d, go } = useApp();
  const [q, setQ] = useState("");
  const isTeacher = kind === "professor";
  const list = (isTeacher ? d.professores : d.alunos).filter((p) => normalize(p.nome + p.matricula).includes(normalize(q)));
  const profile = isTeacher ? "teacher" : "student";
  const P = PROFILES.find((p) => p.key === profile);

  return (
    <div className="welcome" data-profile={profile}>
      <div className="welcome-main">
        <Button variant="ghost" icon={ArrowLeft} onClick={() => go("")} style={{ justifySelf: "start", marginLeft: -8 }}>Trocar de perfil</Button>
        <div>
          <span className="eyebrow"><P.Icon size={14} aria-hidden />Entrar como {P.label.toLowerCase()}</span>
          <h1>Quem é você?</h1>
          <p className="lead">Escolha seu nome na lista. Não precisa lembrar a matrícula.</p>
        </div>
        <div style={{ display: "grid", gap: 16, maxWidth: 520 }}>
          <SearchInput value={q} onChange={setQ} placeholder="Buscar por nome ou matrícula" />
          <div className="picker-list">
            {list.map((p, i) => {
              const n = isTeacher ? turmasDoProfessor(d, p.matricula).length : turmasDoAluno(d, p.matricula, true).length;
              return (
                <button key={p.matricula} className="picker-item rise" style={{ animationDelay: `${i * 30}ms` }} onClick={() => go(`${kind}/${p.matricula}`)}>
                  <Avatar name={p.nome} id={p.matricula} />
                  <span style={{ flex: 1 }}>
                    <b>{p.nome}</b>
                    <span>{p.matricula} · {isTeacher ? `${n} turma(s)` : `${p.curso} · ${n} disciplina(s) agora`}</span>
                  </span>
                  <ArrowRight size={18} className="muted" aria-hidden />
                </button>
              );
            })}
            {!list.length && <Empty icon={UserX} title="Ninguém encontrado">Tente só uma parte do nome.</Empty>}
          </div>
        </div>
      </div>
      <Art />
    </div>
  );
}
