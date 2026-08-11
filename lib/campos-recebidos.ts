/**
 * Acha nome, e-mail e telefone dentro de QUALQUER coisa que chegue.
 *
 * O webhook de entrada é pra ser colado em página nossa, em ferramenta de
 * terceiro, em automação — e cada um chama os campos do jeito dele: `name`,
 * `nome`, `full_name`, `your-name`, `form_fields[name]`. Se a gente exigisse
 * um formato, o link só funcionaria onde a gente mesmo montou o formulário, e
 * aí não serve de webhook.
 *
 * Puro de propósito: é a peça que decide se um lead entra inteiro ou entra
 * vazio, então tem teste.
 */

/** Achata `{a:{b:1}}` em `{"a.b":1}` — payload de ferramenta vem aninhado. */
export function achatar(
  obj: unknown,
  prefixo = "",
  saida: Record<string, string> = {},
  profundidade = 0
): Record<string, string> {
  if (profundidade > 4 || obj === null || obj === undefined) return saida;
  if (typeof obj !== "object") {
    if (prefixo) saida[prefixo] = String(obj);
    return saida;
  }
  if (Array.isArray(obj)) {
    // lista de {name, value} é como Elementor e afins mandam os campos
    const pares = obj.every(
      (i) => i && typeof i === "object" && "name" in i && "value" in i
    );
    if (pares) {
      for (const i of obj as { name: string; value: unknown }[]) {
        achatar(i.value, i.name, saida, profundidade + 1);
      }
      return saida;
    }
    obj.forEach((v, n) => achatar(v, prefixo ? `${prefixo}.${n}` : `${n}`, saida, profundidade + 1));
    return saida;
  }
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    // form_fields[name] → name
    const limpo = k.replace(/^.*\[(.+)\]$/, "$1");
    achatar(v, prefixo ? `${prefixo}.${limpo}` : limpo, saida, profundidade + 1);
  }
  return saida;
}

/** Nomes que cada campo costuma ter por aí, do mais exato pro mais solto. */
const APELIDOS: Record<"nome" | "email" | "telefone", string[]> = {
  nome: ["nome", "name", "full_name", "fullname", "your-name", "first_name", "nome_completo"],
  email: ["email", "e-mail", "mail", "your-email", "email_address"],
  telefone: [
    "whatsapp", "telefone", "phone", "celular", "tel", "fone",
    "your-tel", "phone_number", "mobile",
  ],
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function acharCampo(
  campos: Record<string, string>,
  qual: "nome" | "email" | "telefone"
): string {
  const entradas = Object.entries(campos).map(
    ([k, v]) => [k.trim().toLowerCase(), String(v ?? "").trim()] as const
  );
  // 1) nome exato
  for (const apelido of APELIDOS[qual]) {
    const achou = entradas.find(([k, v]) => k === apelido && v);
    if (achou) return achou[1];
  }
  // 2) nome que contém o apelido (form_fields[your-name], campo_email_2…)
  for (const apelido of APELIDOS[qual]) {
    const achou = entradas.find(([k, v]) => k.includes(apelido) && v);
    if (achou) return achou[1];
  }
  // 3) último recurso pelo FORMATO do valor: e-mail e telefone se reconhecem
  //    sozinhos, e é melhor um lead com contato do que um lead vazio
  if (qual === "email") {
    const achou = entradas.find(([, v]) => EMAIL.test(v));
    if (achou) return achou[1];
  }
  if (qual === "telefone") {
    const achou = entradas.find(([, v]) => /^[+()\d][\d\s()+-]{7,}$/.test(v));
    if (achou) return achou[1];
  }
  return "";
}
