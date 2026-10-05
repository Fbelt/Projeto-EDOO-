// Conversa com o servidor C++ (api/server.cpp).
// GET /api/dados devolve tudo; os POST mudam algo e devolvem { mensagem, dados }.

export async function loadAll() {
  const res = await fetch("/api/dados");
  if (!res.ok) throw new Error("Não foi possível falar com o servidor.");
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
    throw new Error("Servidor desligado. Rode ./servidor e tente de novo.");
  }
  const json = await res.json();
  if (!res.ok) throw new Error(json.erro || "Algo deu errado.");
  return json;
}
