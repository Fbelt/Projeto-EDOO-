// Formatação em pt-BR (números tabulares, datas por extenso)

const nf = (min, max) => new Intl.NumberFormat("pt-BR", { minimumFractionDigits: min, maximumFractionDigits: max });
const one = nf(1, 1);
const upToOne = nf(0, 1);
const zero = nf(0, 0);

// Nota individual: "7,5", "6", "10"
export const fmtGrade = (n) => (n == null || Number.isNaN(n) ? "" : upToOne.format(n));
// Média: "6,8", "3,0"; extremos sem casa ("0", "10")
export const fmtAvg = (n) => (n === 0 || n === 10 ? zero.format(n) : one.format(n));
export const fmtPct = (n) => zero.format(n);
export const fmtOne = (n) => one.format(n);

export const initials = (name = "") =>
  name.split(" ").filter(Boolean).filter((w, i, a) => i === 0 || i === a.length - 1).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export const firstName = (name = "") => name.split(" ")[0];

export const normalize = (s = "") => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// "terça, 6 de outubro"
export function longDate(d = new Date()) {
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }).replace("-feira", "");
}

// "Ter 13/10"
export function shortDate(d) {
  const wd = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
  return `${wd[0].toUpperCase()}${wd.slice(1, 3)} ${d.getDate()}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export const sameDay = (a, b) => a.toDateString() === b.toDateString();

export const isoDay = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
