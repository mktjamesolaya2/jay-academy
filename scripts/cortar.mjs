/**
 * cortar — prepara uma foto pro slot de uma LP, sem nunca ampliar.
 *
 * A regra que o James cobrou em 05/08 ("faltou qualidade, ficaram com muitos
 * pixels") virou trava aqui: o script se RECUSA a entregar imagem ampliada.
 * Se você pedir 1400 de largura e o corte só tem 900 reais, ele entrega 900 e
 * avisa — em vez de esticar e ficar borrado.
 *
 *   npm run cortar -- --de tmp/canva/p03.jpg --para public/lp/academy/reais/sala-aula.jpg --formato 3:4
 *   npm run cortar -- --de https://... --para public/x.jpg --formato 4:5 --largura 1200
 *
 * Cortar fora tarja/legenda que veio na imagem (comum em export de Canva):
 *   --evitar-topo 420     ignora os 420px de cima
 *   --evitar-baixo 300    ignora os 300px de baixo
 *
 * Enquadramento dentro da área que sobrou: --foco topo | centro | baixo  (padrão centro)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { lerArgumentos } from './lib/navegador.mjs';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const { opcoes } = lerArgumentos(process.argv.slice(2));

if (!opcoes.de || !opcoes.para) {
  console.error('Uso: npm run cortar -- --de <arquivo|url> --para <caminho> --formato 3:4 [--largura N]');
  process.exit(1);
}

const formato = String(opcoes.formato || '3:4');
const [fw, fh] = formato.split(':').map(Number);
if (!fw || !fh) {
  console.error(`--formato inválido: "${formato}". Use tipo 3:4, 4:5, 5:6, 16:9.`);
  process.exit(1);
}

const evitarTopo = Number(opcoes['evitar-topo'] || 0);
const evitarBaixo = Number(opcoes['evitar-baixo'] || 0);
const foco = String(opcoes.foco || 'centro');

// --- entrada: arquivo local ou URL ---
let entrada = opcoes.de;
if (/^https?:\/\//.test(entrada)) {
  const r = await fetch(entrada);
  if (!r.ok) { console.error(`Não consegui baixar (${r.status}): ${entrada}`); process.exit(1); }
  const tmp = resolve('tmp', `cortar-${Date.now()}.bin`);
  mkdirSync(dirname(tmp), { recursive: true });
  writeFileSync(tmp, Buffer.from(await r.arrayBuffer()));
  entrada = tmp;
}

const original = sharp(entrada);
const meta = await original.metadata();

// --- área utilizável, depois de descartar as faixas pedidas ---
const topo = evitarTopo;
const altura = meta.height - evitarTopo - evitarBaixo;
if (altura <= 0) { console.error('--evitar-topo e --evitar-baixo comeram a imagem inteira.'); process.exit(1); }

// maior retângulo no formato pedido que cabe na área utilizável
let larguraCorte = meta.width;
let alturaCorte = Math.round((larguraCorte * fh) / fw);
if (alturaCorte > altura) {
  alturaCorte = altura;
  larguraCorte = Math.round((alturaCorte * fw) / fh);
}

const esquerda = Math.round((meta.width - larguraCorte) / 2);
const topoCorte =
  foco === 'topo' ? topo :
  foco === 'baixo' ? topo + (altura - alturaCorte) :
  topo + Math.round((altura - alturaCorte) / 2);

// --- largura final: NUNCA maior que a real do corte ---
const pedida = Number(opcoes.largura || larguraCorte);
const larguraFinal = Math.min(pedida, larguraCorte);
const ampliariaSe = pedida > larguraCorte;
// quando não reduz, mantém a altura do corte: recalcular pela proporção
// arredondava 1px pra cima e esticava a imagem à toa
const alturaFinal = larguraFinal === larguraCorte
  ? alturaCorte
  : Math.round((larguraFinal * alturaCorte) / larguraCorte);

const destino = resolve(opcoes.para);
mkdirSync(dirname(destino), { recursive: true });

await original
  .extract({ left: esquerda, top: topoCorte, width: larguraCorte, height: alturaCorte })
  .resize(larguraFinal, alturaFinal, { kernel: 'lanczos3' })
  .sharpen({ sigma: 0.6 })
  .jpeg({ quality: 90, mozjpeg: true, chromaSubsampling: '4:4:4' })
  .toFile(destino);

const saida = await sharp(destino).metadata();

console.log('');
console.log(`  origem   ${meta.width}×${meta.height}`);
if (evitarTopo || evitarBaixo) console.log(`  descartei  ${evitarTopo}px do topo, ${evitarBaixo}px do pé`);
console.log(`  corte    ${larguraCorte}×${alturaCorte}  (${formato}, foco ${foco})`);
console.log(`  saída    ${saida.width}×${saida.height}`);
if (ampliariaSe) {
  console.log('');
  console.log(`  ⚠️  você pediu ${pedida} de largura, mas o corte só tem ${larguraCorte} de verdade.`);
  console.log('     Entreguei os', larguraCorte, 'reais — ampliar deixaria a imagem borrada.');
}
console.log('');
console.log(`  ${destino}`);
console.log('');

// pra saber se o resultado aguenta o slot: tela retina pede o dobro do tamanho renderizado
console.log(`  serve pra card renderizado até ~${Math.floor(saida.width / 2)}px de largura em tela retina.`);
console.log('');
