// ═══════════════════════════════════════════════════════════════
//  Regras acadêmicas vistas pelo front.
//
//  O resultado OFICIAL e a previsão salva sempre vêm do servidor C++
//  (getStatus e calculateStatus). Aqui só existe:
//   · a mesma regra espelhada, para pré-visualizar ENQUANTO se digita
//     (antes de salvar), sempre marcada como projeção;
//   · leitura de horário e montagem das listas de pendência.
// ═══════════════════════════════════════════════════════════════
import { fmtAvg, fmtOne, fmtPct, isoDay, plural } from "./format.js";

export const MIN_FREQ = 75;

// ── Índices ──
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
export const matriculaDe = (t, mat) => t.matriculas.find((m) => m.aluno === mat);
export const aulasRegistradas = (t) => Math.max(0, ...t.matriculas.map((m) => m.aulas));
export const maxNotas = (t) => Math.max(0, ...t.matriculas.map((m) => m.notas.length));

// ── Mesma regra do C++ (Enrollment / FinalExamEnrollment), só para pré-visualizar ──
export const media = (notas) => (notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : 0);
export function projetar({ notas, frequencia, notaFinal }, temFinal) {
  const avg = media(notas);
  if (frequencia < MIN_FREQ) return "Reprovado por falta";
  if (!temFinal) return avg >= 7 ? "Aprovado" : "Reprovado por nota";
  if (avg >= 7) return "Aprovado";
  if (avg < 3) return "Reprovado por nota";
  if (notaFinal == null) return "Em prova final";
  return (avg + notaFinal) / 2 >= 5 ? "Aprovado" : "Reprovado por nota";
}
// (média + final) ÷ 2 ≥ 5  →  final ≥ 10 − média
export const precisaNaFinal = (avg) => Math.max(0, 10 - avg);
export const elegivelFinal = (m) => m.media >= 3 && m.media < 7 && m.frequencia >= MIN_FREQ;

// ── Tom de cada situação (a cor sempre vem com texto e ícone) ──
export function statusMeta(status) {
  switch (status) {
    case "Aprovado": return { tone: "success", label: "Aprovado" };
    case "Reprovado por nota": return { tone: "danger", label: "Reprovado por nota" };
    case "Reprovado por falta": return { tone: "danger", label: "Reprovado por falta" };
    case "Em prova final": return { tone: "warning", label: "Prova final" };
    case "Cursando": return { tone: "primary", label: "Em andamento" };
    default: return { tone: "neutral", label: status };
  }
}

// Texto de projeção: "Prova final · precisa de 3,3"
export function projectionLabel(status, avg) {
  const meta = statusMeta(status);
  if (status === "Em prova final") return `${meta.label} · precisa de ${fmtOne(precisaNaFinal(avg))}`;
  return meta.label;
}

// Legenda do instrumento de média
export function legendaMedia(avg, temFinal, semNotas) {
  if (semNotas) return "Nenhuma nota lançada";
  if (avg >= 7) return "7 ou mais: aprovado";
  if (!temFinal) return "Abaixo de 7: reprovado";
  if (avg < 3) return "Abaixo de 3: reprovado";
  return "Entre 3 e 7: prova final";
}

// Frequência se o aluno faltar à próxima aula
export const freqComFalta = (m) => (m.presencas * 100) / (m.aulas + 1);

// ── Horário: "SEG/QUA 8h-10h" ──
export const DIAS = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
export const DIA_NOME = { SEG: "segunda", TER: "terça", QUA: "quarta", QUI: "quinta", SEX: "sexta", SAB: "sábado" };
const DIA_JS = { SEG: 1, TER: 2, QUA: 3, QUI: 4, SEX: 5, SAB: 6 };

// Devolve null quando o texto não segue o formato (horário não reconhecido)
export function parseHorario(h = "") {
  const m = h.trim().match(/^([A-Z]{3}(?:\/[A-Z]{3})*)\s+(\d{1,2})h\s*-\s*(\d{1,2})h$/i);
  if (!m) return null;
  const dias = m[1].toUpperCase().split("/");
  if (!dias.every((x) => DIA_JS[x])) return null;
  const inicio = +m[2], fim = +m[3];
  if (fim <= inicio) return null;
  return { dias, inicio, fim };
}
export const faixa = (h) => `${h.inicio}h–${h.fim}h`;

export const temAulaNoDia = (h, date) => h && h.dias.some((x) => DIA_JS[x] === date.getDay());

// Momento da aula de hoje: "now" (em andamento), "later" (ainda vai começar), "past" (já terminou)
export function momento(h, now = new Date()) {
  const hr = now.getHours() + now.getMinutes() / 60;
  if (hr < h.inicio) return "later";
  if (hr >= h.fim) return "past";
  return "now";
}

// Próximas ocorrências a partir de "from" (exclusive se skipToday)
export function proximasAulas(turmas, from = new Date(), { count = 3, skipToday = false } = {}) {
  const out = [];
  for (let i = skipToday ? 1 : 0; i < 15 && out.length < count; i++) {
    const day = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    for (const t of turmas) {
      const h = parseHorario(t.horario);
      if (!h || !temAulaNoDia(h, day)) continue;
      if (i === 0 && momento(h, from) === "past") continue;
      out.push({ t, h, day, today: i === 0 });
    }
    out.sort((a, b) => a.day - b.day || a.h.inicio - b.h.inicio);
  }
  return out.slice(0, count);
}

// Semana atual: segunda a sábado
export function semanaAtual(now = new Date()) {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  return DIAS.map((dia, i) => ({ dia, date: new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i) }));
}

// Semestre corrente: o das turmas abertas (o banco não guarda "semestre atual")
export function semestreAtual(d) {
  const abertas = d.turmas.filter((t) => !t.encerrada).map((t) => t.semestre).sort();
  if (abertas.length) return abertas[abertas.length - 1];
  const now = new Date();
  return `${now.getFullYear()}.${now.getMonth() < 6 ? 1 : 2}`;
}

// ── Chamada registrada hoje (o banco não guarda a data das aulas) ──
// Guardado só neste navegador, para a lista de pendências.
const keyChamada = (code, day = new Date()) => `edoo:chamada:${code}:${isoDay(day)}`;
export const chamadaFeitaHoje = (code) => { try { return !!localStorage.getItem(keyChamada(code)); } catch { return false; } };
export const marcarChamadaHoje = (code) => { try { localStorage.setItem(keyChamada(code), "1"); } catch { /* sem armazenamento */ } };

// ── Pendências do professor ──
export function pendenciasProfessor(d, mat, now = new Date()) {
  const items = [];
  for (const t of turmasDoProfessor(d, mat).filter((x) => !x.encerrada)) {
    const disc = d.disciplinaBy[t.disciplina];
    const h = parseHorario(t.horario);
    if (h && temAulaNoDia(h, now) && momento(h, now) !== "later" && !chamadaFeitaHoje(t.codigo)) {
      items.push({ id: `ch-${t.codigo}`, kind: "attention", turma: t, tab: "chamada", action: "Fazer chamada",
        what: "Chamada de hoje não registrada", why: `${t.codigo} · Aula das ${faixa(h)}.` });
    }
    if (disc?.temFinal) {
      const pend = t.matriculas.filter((m) => elegivelFinal(m) && m.notaFinal == null);
      if (pend.length) {
        items.push({ id: `pf-${t.codigo}`, kind: "attention", turma: t, tab: "final", action: "Lançar provas finais",
          what: `Prova final de ${plural(pend.length, "aluno", "alunos")}`,
          why: `${t.codigo} · ${pend.length === 1 ? "Fica" : "Ficam"} em prova final se a turma for encerrada hoje.`, alunos: pend });
      }
    }
    const k = maxNotas(t);
    const faltando = t.matriculas.filter((m) => m.notas.length < k);
    if (k > 0 && faltando.length) {
      items.push({ id: `nt-${t.codigo}`, kind: "attention", turma: t, tab: "notas", action: "Lançar notas",
        what: `Nota ${k} não lançada para ${plural(faltando.length, "aluno", "alunos")}`, why: `${t.codigo} · Sem a nota, a média usa só as anteriores.` });
    }
  }
  return items;
}

// ── "Precisa de atenção" do admin: o que aconteceu, por que importa, o que fazer ──
export function atencaoAdmin(d) {
  const items = [];
  const abertas = d.turmas.filter((t) => !t.encerrada);
  for (const t of abertas) {
    const disc = d.disciplinaBy[t.disciplina];
    if (disc?.temFinal) {
      const pend = t.matriculas.filter((m) => elegivelFinal(m) && m.notaFinal == null);
      if (pend.length) items.push({ id: `pf-${t.codigo}`, kind: "attention", to: `admin/turmas/${t.codigo}`, action: "Abrir turma",
        what: `${plural(pend.length, "aluno aguarda", "alunos aguardam")} a nota da prova final`,
        why: `${t.codigo} · Se a turma for encerrada assim, ${pend.length === 1 ? "fica" : "ficam"} em prova final.` });
    }
    if (!t.professor) items.push({ id: `sp-${t.codigo}`, kind: "attention", to: `admin/turmas/${t.codigo}`, action: "Abrir turma",
      what: `${t.codigo} está sem professor`, why: "Ninguém pode lançar notas nem fazer chamada." });
    if (t.matriculas.length >= t.vagas) items.push({ id: `lt-${t.codigo}`, kind: "attention", to: `admin/turmas/${t.codigo}`, action: "Ver alunos",
      what: `Turma lotada: ${t.matriculas.length} de ${t.vagas} vagas`, why: `${t.codigo} · Novas matrículas serão recusadas.` });
    for (const m of t.matriculas.filter((x) => x.frequencia < MIN_FREQ)) {
      const s = d.alunoBy[m.aluno];
      items.push({ id: `fq-${t.codigo}-${m.aluno}`, kind: "attention", to: `admin/turmas/${t.codigo}`, action: "Abrir turma",
        what: `${s?.nome} está com ${fmtPct(m.frequencia)}% de frequência`, why: `${t.codigo} · Abaixo do mínimo de 75%: reprovaria por falta.` });
    }
  }
  for (const s of d.alunos) {
    if (turmasDoAluno(d, s.matricula, true).length) continue;
    const ultimas = turmasDoAluno(d, s.matricula).filter((t) => t.encerrada).sort((a, b) => b.semestre.localeCompare(a.semestre));
    const u = ultimas[0];
    const res = u && matriculaDe(u, s.matricula).situacao;
    items.push({ id: `sm-${s.matricula}`, kind: "empty", to: `admin/alunos?${s.matricula}`, action: "Abrir aluno",
      what: `${s.nome} não está em nenhuma turma em andamento`,
      why: u ? `Último resultado: ${res.toLowerCase()} em ${u.codigo}.` : "Ainda não cursou nenhuma turma." });
  }
  return items;
}

// Resposta do Aluno · Início (a resposta primeiro, os números em seguida)
export function respostaAluno(d, s) {
  const atuais = turmasDoAluno(d, s.matricula, true);
  if (!atuais.length) return { title: "Você não está em nenhuma turma agora.", sub: "Quando a secretaria fizer sua matrícula, as disciplinas aparecem aqui." };
  const linhas = atuais.map((t) => ({ t, m: matriculaDe(t, s.matricula), disc: d.disciplinaBy[t.disciplina] }));
  if (linhas.length === 1) return respostaDisciplina(linhas[0].m, linhas[0].disc, true);
  const semNota = linhas.filter((l) => !l.m.notas.length);
  const ok = linhas.filter((l) => l.m.notas.length && l.m.previsao === "Aprovado").length;
  const comNota = linhas.length - semNota.length;
  if (!comNota) return { title: "Ainda não há notas lançadas.", sub: "Assim que a primeira nota sair, a situação de cada disciplina aparece aqui." };
  const atencao = linhas.find((l) => l.m.notas.length && l.m.previsao !== "Aprovado");
  const sub = atencao ? `${atencao.disc?.nome}: ${respostaDisciplina(atencao.m, atencao.disc).sub}` : "Média e frequência atendem às regras em todas.";
  return { title: ok === comNota ? `Por enquanto, você passa em ${ok === 2 ? "as duas" : `todas as ${ok}`} disciplinas.` : `Por enquanto, você passa em ${ok} de ${comNota} disciplinas.`, sub };
}

export function respostaDisciplina(m, disc, longo = false) {
  if (!m.notas.length) return { short: "Ainda sem notas.", title: "Ainda não há notas lançadas.", sub: "Nenhuma nota lançada não é o mesmo que zero. A situação aparece quando a primeira nota sair." };
  switch (m.previsao) {
    case "Aprovado": return { short: "Por enquanto, aprovado.", title: longo ? "Por enquanto, você passa direto." : "Por enquanto, aprovado.", sub: `Média ${fmtAvg(m.media)} e frequência de ${fmtPct(m.frequencia)}% atendem às regras.` };
    case "Em prova final": return { short: "Por enquanto, prova final.", title: longo ? "Por enquanto, você vai para a prova final." : "Por enquanto, prova final.", sub: `Você precisaria de ${fmtOne(precisaNaFinal(m.media))} na prova final${longo ? "" : " para ser aprovado"}.`, strong: fmtOne(precisaNaFinal(m.media)) };
    case "Reprovado por falta": return { short: "Por enquanto, reprovado por falta.", title: longo ? "Por enquanto, você reprovaria por falta." : "Por enquanto, reprovado por falta.", sub: "A frequência está abaixo de 75%. Nesse caso a nota não muda o resultado." };
    default: return { short: "Por enquanto, reprovado por nota.", title: longo ? "Por enquanto, você reprovaria por nota." : "Por enquanto, reprovado por nota.", sub: disc?.temFinal ? "Média abaixo de 3: não há prova final." : "Média abaixo de 7. Esta disciplina não tem prova final." };
  }
}
