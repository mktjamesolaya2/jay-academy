/**
 * Tirar o nome da pessoa do que ela escreveu no chat.
 *
 * ⚠️ Existe porque a conversa **não tem mais formulário de entrada**. James:
 * *"o email a gente pergunta so dps pq a gente não sabe c é a duvida da
 * pessoa"* — pedir e-mail de compra pra quem só quer saber onde está a apostila
 * é atrito à toa, e formulário antes de falar é onde a pessoa desiste.
 *
 * Então a conversa abre com a saudação perguntando o nome, e o nome vem no meio
 * de uma frase de gente: "oi, sou a Ana", "meu nome é Renata Lima", ou só
 * "Ana Paula".
 *
 * ⚠️ **Na dúvida, devolve null.** Chamar a aluna por um nome errado é pior do
 * que não chamar por nome nenhum — e o nome certo costuma chegar depois pela
 * Hotmart, junto com a compra.
 */

/** Coisas que a pessoa escreve e NÃO são nome. */
const NAO_E_NOME =
  /^(oi|ola|ol[áa]|bom dia|boa tarde|boa noite|tudo bem|opa|eai|e a[ií]|sim|nao|n[ãa]o|ok|obrigad[ao]|help|socorro|ajuda|bom|boa)$/i;

/**
 * Palavras de enfeite que vêm junto do nome.
 *
 * ⚠️ É uma lista de PALAVRAS, não uma expressão de frases inteiras. A primeira
 * versão tentava apagar "meu nome é" de uma vez e falhou num caso real:
 * `"meu nome é Renata Lima"` virava `"Meu Nome"`, porque o `\b` do fim não
 * casa depois do "é" (acento não conta como letra pro `\b` do JavaScript). A
 * aluna seria chamada de "Meu Nome" na conversa e na caixa do time.
 */
const RECHEIO = new Set([
  "oi", "ola", "olá", "opa", "eai",
  "bom", "boa", "dia", "tarde", "noite",
  "meu", "minha", "nome", "chamo", "chama", "me", "sou", "aqui",
  "e", "é", "eh",
  "prazer", "tudo", "bem", "por", "favor", "obrigada", "obrigado",
]);

/**
 * Uma palavra pode ser parte de um nome?
 *
 * Só letras (com acento), hífen e apóstrofo — "D'Ávila", "Ana-Clara". Número e
 * arroba matam na hora: é e-mail ou telefone, não nome.
 */
function pareceParteDeNome(p: string): boolean {
  return /^[a-zà-öø-ÿ'’-]{2,}$/i.test(p);
}

/** Partículas que ficam minúsculas e não valem como nome sozinhas. */
const PARTICULAS = new Set(["de", "da", "do", "das", "dos", "e", "di", "del", "la"]);

/**
 * Palavras que denunciam que a pessoa está perguntando, não se apresentando.
 *
 * ⚠️ Sem isto, "onde fica a apostila do primeiro módulo?" virava a aluna
 * **"Onde Fica"** — na conversa e na caixa do time. É curto o bastante pra
 * passar por qualquer limite de tamanho; o que entrega é o vocabulário.
 */
const PALAVRA_DE_DUVIDA = new Set([
  "onde", "quando", "como", "quanto", "quanta", "qual", "quais", "quem",
  "porque", "porquê", "pq", "cade", "cadê",
  "quero", "queria", "preciso", "gostaria", "tem", "tenho", "comprei", "paguei",
  "consigo", "consegui", "entrar", "acessar", "acesso", "login", "senha",
  "curso", "aula", "aulas", "modulo", "módulo", "apostila", "material",
  "certificado", "reembolso", "boleto", "cartao", "cartão", "pagamento",
  "nao", "não", "nada", "ainda", "pra", "para", "sobre", "ajudar",
]);

/** Capitaliza cada pedaço, respeitando hífen e apóstrofo: "D'Ávila", "Ana-Clara". */
function capitalizar(p: string): string {
  const b = p.toLowerCase();
  if (PARTICULAS.has(b)) return b;
  return b.replace(/(^|['’-])([a-zà-öø-ÿ])/g, (_, sep: string, letra: string) =>
    sep + letra.toUpperCase()
  );
}

/**
 * O nome, ou null quando não dá pra ter certeza.
 *
 * Devolve no máximo dois nomes: é o que cabe na caixa de entrada e é como uma
 * pessoa chamaria a outra.
 */
export function nomeDaMensagem(texto: string): string | null {
  if (typeof texto !== "string") return null;

  const cru = texto.trim();
  // ⚠️ Frase longa é dúvida, não apresentação. Quem responde "não estou
  // conseguindo entrar no curso que comprei" não está dizendo o nome — e tratar
  // isso como nome encheria a caixa de entrada de frases.
  if (!cru || cru.length > 60) return null;
  // E-mail ou telefone não é nome.
  if (/[@\d]/.test(cru)) return null;
  // ⚠️ Interrogação encerra o assunto: quem pergunta não está se apresentando.
  if (cru.includes("?")) return null;

  const limpo = cru
    // ⚠️ Apóstrofo e hífen NÃO entram aqui: tirá-los transformava "D'Ávila" em
    // "Ávila" e cortava o nome da pessoa pela metade.
    .replace(/[.,!;:"()]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!limpo || NAO_E_NOME.test(limpo)) return null;

  const palavras = limpo.split(" ");
  // ⚠️ Mais de 8 palavras já é frase, não apresentação — mesmo curta. Conta
  // ANTES de tirar o enfeite, senão "oi, tudo bem, então, o meu nome é Ana"
  // passaria como se fosse só "Ana".
  if (palavras.length > 8) return null;
  // Vocabulário de pergunta em qualquer lugar da frase já derruba.
  if (palavras.some((p) => PALAVRA_DE_DUVIDA.has(p.toLowerCase()))) return null;

  const partes = palavras
    .filter((p) => !RECHEIO.has(p.toLowerCase()))
    .filter(pareceParteDeNome);

  // Tira partícula solta que tenha sobrado no começo ("da Silva" → "Silva").
  while (partes.length && PARTICULAS.has(partes[0].toLowerCase())) partes.shift();
  if (!partes.length) return null;
  if (NAO_E_NOME.test(partes[0])) return null;

  return partes.slice(0, 2).map(capitalizar).join(" ");
}

/**
 * Como a pessoa aparece na caixa do time quando ainda não deu o nome.
 *
 * ⚠️ Nunca "Teste": esse era o rótulo da fase em que só o James conversava, e
 * numa caixa com aluna de verdade ele faria o time ignorar a conversa.
 */
export const SEM_NOME = "Sem nome ainda";
