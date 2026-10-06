import { useState } from "react";
import { ArrowRight, Eye, EyeOff, GraduationCap, Info, Lock, Mail, Presentation, ShieldCheck } from "lucide-react";
import campus from "../assets/campus.jpg";
import { useApp } from "../App.jsx";
import { Brand } from "../components/layout.jsx";
import { Button, Field, Icon, fieldProps } from "../components/primitives.jsx";

const ROLES = [
  { key: "admin", label: "Administrador", desc: "Gestão completa", icon: ShieldCheck },
  { key: "professor", label: "Professor", desc: "Ministra aulas", icon: Presentation },
  { key: "aluno", label: "Aluno", desc: "Acompanha disciplinas", icon: GraduationCap },
];

const BENEFITS = [
  ["Para alunos", "Acompanhe sua jornada acadêmica em um só lugar."],
  ["Para professores", "Gerencie turmas, chamadas e notas com mais autonomia."],
  ["Para administradores", "Tenha uma visão completa da instituição com dados organizados."],
];

const ADMIN_EMAIL = "administracao@edoo.edu.br";

// Dicas para a apresentação: quais cadastros mostram mais telas do sistema
const TIPS = {
  professor: { P001: "Recomendado · turma lotada e prova final", P003: "Recomendado · turma encerrada e turma aberta", P006: "Sem turmas · estado vazio" },
  aluno: { 2024001: "Recomendado · histórico completo, 5 turmas", 2024002: "Recomendado · reprovada por nota e por falta", 2024009: "Passou pela prova final", 2025006: "Sem turmas · estado vazio" },
};

// Contas que existem para o perfil escolhido (vêm do cadastro do servidor)
function accountsOf(role, d) {
  if (role === "admin") return [{ email: ADMIN_EMAIL, nome: "Administração", hint: "Recomendado · acesso a todas as telas" }];
  const people = role === "professor" ? d.professores : d.alunos;
  return people.map((p) => {
    const n = d.turmas.filter((t) => (role === "professor" ? t.professor === p.matricula : t.matriculas.some((m) => m.aluno === p.matricula))).length;
    return { email: p.contato, nome: p.nome, hint: TIPS[role][p.matricula] || `${n} ${n === 1 ? "turma" : "turmas"}` };
  });
}

// Login FICTÍCIO (demonstração): a senha pode ser qualquer uma, mas o e-mail
// precisa ser de um cadastro que já existe no perfil escolhido.
export function Login() {
  const { d, login, toast } = useApp();
  const [role, setRole] = useState(null);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);   // lista de cadastros sugeridos

  const accounts = role ? accountsOf(role, d) : [];
  const typed = email.trim().toLowerCase();
  const shown = accounts.filter((a) => !typed || a.email.toLowerCase().includes(typed) || a.nome.toLowerCase().includes(typed));

  function chooseRole(key) { setRole(key); setEmail(""); setOpen(false); }

  const err = {};
  if (!role) err.role = "Escolha o perfil de acesso.";
  else if (!typed) err.email = "Informe o e-mail ou escolha um cadastro sugerido.";
  else if (!accounts.some((a) => a.email.toLowerCase() === typed)) err.email = "Este e-mail não está cadastrado neste perfil. Escolha um da lista.";

  function submit(e) {
    e.preventDefault();
    setTouched(true);
    if (Object.keys(err).length) {
      setTimeout(() => document.querySelector(".login-form [aria-invalid='true']")?.focus(), 0);
      return;
    }
    setBusy(true);
    setTimeout(() => login(role, email.trim()), 350);
  }
  const show_ = (k) => touched && err[k];

  return (
    <div className="login">
      <section className="login-hero" style={{ backgroundImage: `url(${campus})` }} aria-label="EDOO, gestão acadêmica">
        <Brand onClick={(e) => e.preventDefault()} />
        <div>
          <span className="hero-kicker">Gestão acadêmica inteligente</span>
          <h2 className="hero-title">Educação<br />que organiza<br />o amanhã.</h2>
          <p className="hero-text">Uma plataforma completa para conectar alunos, professores e administração em uma experiência acadêmica mais simples, eficiente e humana.</p>
        </div>
        <div className="hero-benefits">
          {BENEFITS.map(([t, p]) => <div key={t}><b>{t}</b><p>{p}</p></div>)}
        </div>
      </section>

      <main className="login-side" id="main">
        <form className="login-form" onSubmit={submit} noValidate>
          <div className="login-brand"><span className="brand-mark"><GraduationCap size={20} strokeWidth={2} aria-hidden /></span><span className="brand-name"><b>EDOO</b><span>Sistema Acadêmico</span></span></div>
          <div className="stack-8">
            <h1>Acesse sua conta</h1>
            <p className="muted">Informe seus dados para continuar.</p>
          </div>

          <div className="field">
            <span className="label" id="role-label">Perfil de acesso</span>
            <div className="role-cards" role="radiogroup" aria-labelledby="role-label" aria-describedby={show_("role") ? "role-err" : undefined}>
              {ROLES.map((r) => (
                <button key={r.key} type="button" role="radio" aria-checked={role === r.key} className="role-card" onClick={() => chooseRole(r.key)}
                  onKeyDown={(e) => {
                    const i = ROLES.findIndex((x) => x.key === (role || ROLES[0].key));
                    if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); chooseRole(ROLES[(i + 1) % 3].key); }
                    if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); chooseRole(ROLES[(i + 2) % 3].key); }
                  }}>
                  <span className="ri"><Icon as={r.icon} size={17} /></span>
                  <span><b>{r.label}</b><br /><span className="d">{r.desc}</span></span>
                </button>
              ))}
            </div>
            {show_("role") && <span className="error" id="role-err" role="alert">{err.role}</span>}
          </div>

          <Field id="login-email" label="E-mail" error={show_("email")}>
            <Icon as={Mail} size={16} className="lead" />
            <input {...fieldProps("login-email", show_("email"))} className="input has-lead" type="email" autoComplete="off" placeholder={role ? "Clique para ver os cadastros" : "Escolha o perfil primeiro"} value={email}
              onChange={(e) => { setEmail(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onClick={() => setOpen(true)}
              onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }} />
            {open && shown.length > 0 && (
              <div className="suggest" role="listbox" aria-label="Cadastros existentes">
                {shown.map((a) => (
                  <button key={a.email} type="button" role="option" aria-selected={a.email.toLowerCase() === typed} className="suggest-item"
                    onMouseDown={(e) => e.preventDefault()} onClick={() => { setEmail(a.email); setOpen(false); }}>
                    <b>{a.nome}</b><span>{a.email}</span><span className="tip">{a.hint}</span>
                  </button>
                ))}
              </div>
            )}
          </Field>

          <Field id="login-pass" label="Senha" error={show_("pass")}>
            <Icon as={Lock} size={16} className="lead" />
            <input {...fieldProps("login-pass", show_("pass"))} className="input has-lead has-trail" type={show ? "text" : "password"} autoComplete="current-password" placeholder="Sua senha" value={pass} onChange={(e) => setPass(e.target.value)} />
            <span className="trail"><button type="button" className="icon-btn" onClick={() => setShow((s) => !s)} aria-label={show ? "Esconder senha" : "Mostrar senha"} aria-pressed={show}><Icon as={show ? EyeOff : Eye} size={18} /></button></span>
          </Field>

          <div className="row-between" style={{ marginTop: -8 }}>
            <button type="button" className="link" onClick={() => toast("Esta é uma demonstração: a recuperação de senha não está ativa.")}>Esqueceu sua senha?</button>
          </div>

          <Button type="submit" variant="primary" size="lg" block disabled={busy}>{busy ? "Entrando…" : <>Entrar<Icon as={ArrowRight} size={18} /></>}</Button>

          <p className="demo-note"><Icon as={Info} size={15} style={{ flex: "none", marginTop: 1 }} />Demonstração: só entram cadastros que já existem (clique no e-mail para ver as sugestões). Qualquer senha é aceita.</p>
        </form>
      </main>
    </div>
  );
}
