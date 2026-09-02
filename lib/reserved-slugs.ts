// Rotas do sistema/admin e páginas estáticas do app. Um slug público IGUAL a um
// destes nunca fica visível (o Next resolve a rota real/estática primeiro), então
// publicar uma cópia ali daria um "publicado" falso (página invisível). Usado pra
// avisar em vez de publicar no vazio.
//
// Autocontido de propósito (o padrão do projeto é arquivo testável não importar
// outros módulos de lib). ⚠️ Ao criar uma LP estática nova em lp-html/, adicione
// o slug aqui também (a lista espelha lib/lp-html-registry.ts).
const RESERVED = new Set([
  // rotas de sistema/admin (app/<rota>)
  "dashboard", "login", "cadastro", "leads", "forms", "settings", "paginas",
  "midia", "lixeira", "websites", "wordpress", "lps", "analytics", "sugestoes",
  "wp-pages", "p", "f", "api",
  // LPs/sites estáticos servidos por route handler (lib/lp-html-registry.ts)
  "basic-magic-shadow", "basic-magic-shadow-v2", "basic-nanofios",
  "curso-online-profissao-remove", "fio-a-fio-realista-by-james-olaya",
  "inmersion-pelo-a-pelo", "jamesolaya", "metodo-shadow-pro", "metodo-shadow-pro-2",
  "pdv-lips-sense-technique", "pmuclass", "laser", "magicshadow",
  "transforma",
  "academy",
]);

/** true = o slug colide com uma rota do sistema ou uma LP estática → não publicar ali. */
export function isReservedSlug(slug: string): boolean {
  const s = slug.toLowerCase().trim();
  return !s || RESERVED.has(s);
}
