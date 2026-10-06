// Conversa com o servidor C++ (api/server.cpp). Contrato inalterado:
// GET /api/dados devolve tudo; os POST mudam algo e devolvem { mensagem, dados }.

export class ApiError extends Error {
  constructor(message, { offline = false } = {}) {
    super(message);
    this.offline = offline;
  }
}

export async function loadAll() {
  let res;
  try {
    res = await fetch("/api/dados");
  } catch {
    throw new ApiError("Sem conexão.", { offline: true });
  }
  if (!res.ok) throw new ApiError("Não foi possível carregar os dados.");
  return res.json();
}

export async function send(path, fields) {
  let res;
  try {
    res = await fetch("/api/" + path, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(fields),
    });
  } catch {
    throw new ApiError("Sem conexão.", { offline: true });
  }
  let json = {};
  try { json = await res.json(); } catch { /* resposta vazia */ }
  if (!res.ok) throw new ApiError(json.erro || "Não foi possível concluir. Tente de novo.");
  return json;
}
