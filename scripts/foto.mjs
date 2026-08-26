/**
 * foto — tira print de uma LP no desktop e no celular.
 *
 * Existe porque isso era escrito do zero toda vez que alguém pedia "me mostra
 * como ficou no celular". Agora é um comando.
 *
 *   npm run foto academy                        página inteira, desktop + celular
 *   npm run foto -- academy --dobras            um arquivo por dobra
 *   npm run foto -- academy --dobra experiencia só uma dobra
 *   npm run foto -- academy --so mobile         só um tamanho
 *   npm run foto -- clinica --esperar 2500      espera mais (efeito longo na tela)
 *   npm run foto -- academy --url https://...   contra produção em vez do localhost
 *
 * Sai em tmp/fotos/<slug>/ (fora do git).
 */
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { abrirNavegador, prepararPagina, esperar, lerArgumentos } from './lib/navegador.mjs';

const { soltos, opcoes } = lerArgumentos(process.argv.slice(2));
const slug = soltos[0];

if (!slug) {
  console.error('Falta o slug da LP. Ex: npm run foto academy');
  process.exit(1);
}

const base = opcoes.url || 'http://localhost:4000';
const endereco = `${base.replace(/\/$/, '')}/${slug.replace(/^\//, '')}`;

// iPhone 13 no celular; 1440 é a largura de notebook mais comum
const TAMANHOS = [
  { nome: 'desktop', width: 1440, height: 900, deviceScaleFactor: 1 },
  { nome: 'mobile', width: 390, height: 844, deviceScaleFactor: 2 },
];

const escolhido = opcoes.so ? TAMANHOS.filter((t) => t.nome === opcoes.so) : TAMANHOS;
if (!escolhido.length) {
  console.error(`--so aceita: ${TAMANHOS.map((t) => t.nome).join(' ou ')}`);
  process.exit(1);
}

const destino = resolve('tmp/fotos', slug);
mkdirSync(destino, { recursive: true });

const navegador = await abrirNavegador();
const salvos = [];

try {
  for (const tamanho of escolhido) {
    const pagina = await navegador.newPage();
    await pagina.setViewport(tamanho);

    const resposta = await pagina.goto(endereco, { waitUntil: 'networkidle2', timeout: 60000 });
    // ⚠️ `ok()` é falso pra 304, que é RESPOSTA BOA — é o cache do navegador
    // dizendo "não mudou". Fotografando produção isso derrubava o script com
    // a mensagem errada ("o dev está rodando?"). O que interroga de verdade é
    // 4xx/5xx.
    if (!resposta || resposta.status() >= 400) {
      throw new Error(`${endereco} respondeu ${resposta ? resposta.status() : 'nada'}. O dev está rodando? (npm run dev)`);
    }
    await prepararPagina(pagina, Number(opcoes.esperar) || 600);

    if (opcoes.dobras || opcoes.dobra) {
      const dobras = await pagina.evaluate(() => {
        // toda dobra com id, mais as duas que não têm (abertura e hero)
        const achadas = [];
        const semId = [['abertura', '.abertura'], ['hero', '.hero']];
        for (const [nome, sel] of semId) {
          const el = document.querySelector(sel);
          if (el) achadas.push({ nome, topo: Math.round(el.getBoundingClientRect().top + window.scrollY), altura: Math.round(el.offsetHeight) });
        }
        document.querySelectorAll('section[id]').forEach((el) => {
          achadas.push({ nome: el.id, topo: Math.round(el.getBoundingClientRect().top + window.scrollY), altura: Math.round(el.offsetHeight) });
        });
        return achadas.sort((a, b) => a.topo - b.topo);
      });

      const alvo = opcoes.dobra ? dobras.filter((d) => d.nome === opcoes.dobra) : dobras;
      if (!alvo.length) {
        console.error(`Dobra "${opcoes.dobra}" não existe. Tem: ${dobras.map((d) => d.nome).join(', ')}`);
        process.exitCode = 1;
      }

      for (const d of alvo) {
        // volta pro topo antes de cada corte: rolar + captureBeyondViewport
        // se somam e o recorte sai deslocado
        await pagina.evaluate(() => window.scrollTo(0, 0));
        await esperar(200);
        const arquivo = `${destino}/${d.nome}-${tamanho.nome}.png`;
        await pagina.screenshot({
          path: arquivo,
          captureBeyondViewport: true,
          clip: { x: 0, y: d.topo, width: tamanho.width, height: Math.min(d.altura, 4000) },
        });
        salvos.push(`${d.nome}-${tamanho.nome}.png  (${tamanho.width}×${Math.min(d.altura, 4000)})`);
      }
    } else {
      const arquivo = `${destino}/pagina-${tamanho.nome}.png`;
      await pagina.screenshot({ path: arquivo, fullPage: true });
      const altura = await pagina.evaluate(() => document.body.scrollHeight);
      salvos.push(`pagina-${tamanho.nome}.png  (${tamanho.width}×${altura})`);
    }

    await pagina.close();
  }
} finally {
  await navegador.close();
}

console.log(`\n${endereco}\n`);
salvos.forEach((s) => console.log('  ' + s));
console.log(`\nem ${destino}\n`);
