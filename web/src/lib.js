import { CheckCircle2, XCircle, Clock3, Flag, CalendarX2 } from "lucide-react";

// ── Situação do aluno → cor + ícone + texto (cor nunca sozinha) ──
export const STATUS = {
  "Aprovado": { tone: "good", Icon: CheckCircle2 },
  "Reprovado por nota": { tone: "critical", Icon: XCircle },
  "Reprovado por falta": { tone: "critical", Icon: CalendarX2 },
  "Cursando": { tone: "info", Icon: Clock3 },
  "Em prova final": { tone: "warning", Icon: Flag },
};

export const fmt = (n, d = 1) =>
  Number(n).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });

export const gradeClass = (g) => (g >= 7 ? "grade-good" : g >= 3 ? "grade-mid" : "grade-bad");

export const initials = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

// Cor do avatar: sempre a mesma para a mesma pessoa
const AVATAR = ["#4f46e5", "#0f766e", "#a21caf", "#1e5aa6", "#b45309", "#166534", "#be123c", "#4a3aa7"];
export const avatarColor = (key = "") => {
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR[h % AVATAR.length];
};

// ── Índices para achar as coisas pelo código ──
export function indexData(d) {
  const by = (list, key) => Object.fromEntries(list.map((x) => [x[key], x]));
  return {
    ...d,
    alunoBy: by(d.alunos, "matricula"),
    professorBy: by(d.professores, "matricula"),
    disciplinaBy: by(d.disciplinas, "codigo"),
    turmaBy: by(d.turmas, "codigo"),
  };
}

export const turmasDoAluno = (d, mat, soAtuais = false) =>
  d.turmas.filter((t) => t.matriculas.some((m) => m.aluno === mat) && (!soAtuais || !t.encerrada));

export const turmasDoProfessor = (d, mat) => d.turmas.filter((t) => t.professor === mat);

export const matriculaDe = (turma, mat) => turma.matriculas.find((m) => m.aluno === mat);

// Estatísticas da turma: média, aprovados (oficial ou previsão), ocupação
export function statsTurma(t) {
  const n = t.matriculas.length;
  const soma = t.matriculas.reduce((s, m) => s + m.media, 0);
  const campo = t.encerrada ? "situacao" : "previsao";
  const aprovados = t.matriculas.filter((m) => m[campo] === "Aprovado").length;
  return {
    n,
    media: n ? soma / n : null,
    aprovados,
    taxa: n ? (aprovados * 100) / n : null,
    ocupacao: (n * 100) / t.vagas,
    previsao: !t.encerrada,
  };
}

// Taxa de aprovação de todas as turmas encerradas
export function aprovacaoGeral(d) {
  const ms = d.turmas.filter((t) => t.encerrada).flatMap((t) => t.matriculas);
  if (!ms.length) return null;
  return (ms.filter((m) => m.situacao === "Aprovado").length * 100) / ms.length;
}

// ── Horário: "SEG/QUA 8h-10h" → { dias: ["SEG","QUA"], inicio: 8, fim: 10 } ──
export const DIAS = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
export function parseHorario(h = "") {
  const [diasTxt = "", horas = ""] = h.split(" ");
  const m = horas.match(/(\d+)h-(\d+)h/);
  return { dias: diasTxt.split("/").filter(Boolean), inicio: m ? +m[1] : 8, fim: m ? +m[2] : 10 };
}

// Cor de cada disciplina no horário (paleta categórica, ordem fixa)
export const SERIES = Array.from({ length: 8 }, (_, i) => `var(--series-${i + 1})`);

export const normalize = (s = "") => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
