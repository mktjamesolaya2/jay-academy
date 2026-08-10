/**
 * Colapsa as cópias que o WordPress gera da mesma foto.
 *
 * Mora fora do gerador porque é a única regra do manifesto que pode APAGAR
 * material da galeria — e já apagou: com `\d+` de largura ela comeu
 * `garantia-rosa-9x16.webp`, que é proporção de tela, não miniatura. Aqui ela
 * fica testável (scripts/variantes.test.mjs).
 */

/**
 * ⚠️ Dois dígitos no mínimo de cada lado, senão `-9x16` e `-4x5` (proporção)
 * passam por miniatura.
 */
const VARIANTE = /-(\d{2,4})x(\d{2,4})(?=(?:-[0-9a-z]{10})?\.[a-z0-9]+$)/i;

/**
 * Nome do espelho do WP: `<hash12>-<nome original>-<sufixo>.ext`. Só o sufixo
 * sai — ele é aleatório, e reimportar o mesmo arquivo gera outro, então dois
 * nomes com o MESMO hash12 são de fato o mesmo arquivo. O hash12 fica: ele
 * identifica a URL de origem, e sem ele o `modulo-07` de duas páginas
 * diferentes viraria um só.
 */
const SUFIXO_ESPELHO = /-[0-9a-z]{10}(?=\.[a-z0-9]+$)/i;

/**
 * Recebe `[{ url, nome, … }]` e devolve a mesma lista sem as cópias.
 *
 * Conservadora de propósito: arquivo SEM `-LARGURAxALTURA` no nome nunca é
 * descartado, e uma variante só some quando existe outra cópia do mesmo
 * arquivo. Assim nenhuma foto distinta some por engano.
 */
export function semVariantes(lista) {
  const grupos = new Map();
  for (const a of lista) {
    const dir = a.url.slice(0, a.url.lastIndexOf("/"));
    const base = a.nome.replace(SUFIXO_ESPELHO, "");
    const m = VARIANTE.exec(base);
    const chave = `${dir}/${base.replace(VARIANTE, "")}`;
    // sem medida no nome = original: ganha de qualquer variante
    const pixels = m ? Number(m[1]) * Number(m[2]) : Infinity;
    const atual = grupos.get(chave);
    if (!atual || pixels > atual.pixels) grupos.set(chave, { a, pixels });
  }
  return [...grupos.values()].map((v) => v.a);
}
