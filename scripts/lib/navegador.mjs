// Coisas que todo script de navegador precisa. Ficam aqui pra não repetir.
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/** puppeteer-core não baixa Chrome — a gente usa o que já está instalado na máquina. */
const CAMINHOS_CHROME = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

export function acharChrome() {
  const encontrado = CAMINHOS_CHROME.find((c) => existsSync(c));
  if (!encontrado) {
    throw new Error(
      'Não achei o Chrome. Instala o Chrome ou aponta o caminho na variável CHROME_PATH.\n' +
        'Procurei em:\n  ' + CAMINHOS_CHROME.join('\n  '),
    );
  }
  return encontrado;
}

export async function abrirNavegador() {
  const puppeteer = require('puppeteer-core');
  return puppeteer.launch({
    executablePath: acharChrome(),
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
}

/**
 * Deixa a página pronta pra foto:
 * - espera as fontes (senão o print sai com a fonte de sistema e engana)
 * - liga as animações de entrada `.surge`, que começam invisíveis e só acendem
 *   quando entram na tela — sem isso metade da página sai em branco
 */
export async function prepararPagina(pagina, espera = 600) {
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.evaluate(() => {
    document.querySelectorAll('.surge').forEach((e) => e.classList.add('visivel'));
  });
  // ⚠️ 600ms cobre a entrada padrão (.surge, 700ms). Efeito mais longo que
  // isso — traço que se desenha, contador — sai pela metade no print, e aí
  // parece que quebrou. Nesses casos, passar --esperar.
  await esperar(espera);
}

export const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/** Lê `--chave valor` e `--flag` da linha de comando. */
export function lerArgumentos(argv) {
  const soltos = [];
  const opcoes = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { soltos.push(a); continue; }
    const chave = a.slice(2);
    const proximo = argv[i + 1];
    if (proximo && !proximo.startsWith('--')) { opcoes[chave] = proximo; i++; }
    else opcoes[chave] = true;
  }
  return { soltos, opcoes };
}
