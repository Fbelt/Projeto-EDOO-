// ═══════════════════════════════════════════════════════════════
//  Login FICTÍCIO (só frontend, para a apresentação).
//  Não existe autenticação real: nada é enviado ao servidor.
//  O perfil e o usuário ficam só na sessionStorage deste navegador.
// ═══════════════════════════════════════════════════════════════
const ROLE = "edoo_demo_role";   // admin | professor | aluno
const USER = "edoo_demo_user";   // matrícula (professor/aluno)
const NAME = "edoo_demo_email";

const get = (k) => { try { return sessionStorage.getItem(k); } catch { return null; } };
const set = (k, v) => { try { sessionStorage.setItem(k, v); } catch { /* sem armazenamento */ } };

export const readSession = () => {
  const role = get(ROLE);
  return role ? { role, user: get(USER) || "", email: get(NAME) || "" } : null;
};

export function startSession({ role, user, email }) {
  set(ROLE, role); set(USER, user || ""); set(NAME, email || "");
}

export function endSession() {
  try { [ROLE, USER, NAME].forEach((k) => sessionStorage.removeItem(k)); } catch { /* sem armazenamento */ }
}

// Qual pessoa abrir para o perfil escolhido: casa o começo do e-mail com o
// contato cadastrado (ana@… → Ana Souza); se não achar, usa a primeira da lista.
export function pickPerson(list, email) {
  const local = email.split("@")[0].trim().toLowerCase();
  const byContact = list.find((p) => (p.contato || "").split("@")[0].toLowerCase() === local);
  const byName = list.find((p) => local && p.nome.toLowerCase().split(" ")[0] === local);
  return (byContact || byName || list[0])?.matricula || "";
}

export const homeOf = (role, user) => (role === "admin" ? "admin" : role === "professor" ? `professor/${user}` : `aluno/${user}`);
