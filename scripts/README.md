# scripts/ — a caixa de ferramentas

Comandos que existem pra parar de reescrever o mesmo script descartável toda sessão.
Usam o que já está instalado (`puppeteer-core` + o Chrome da máquina, `sharp`). Não
precisam de nada novo.

Tudo que eles produzem cai em `tmp/`, que está no `.gitignore`.

---

## `npm run foto` — print de uma LP

```bash
npm run foto academy                          # página inteira, desktop + celular
npm run foto -- academy --dobras              # um arquivo por dobra
npm run foto -- academy --dobra experiencia   # só uma dobra
npm run foto -- academy --so mobile           # só um tamanho
npm run foto -- academy --url https://jayacademy.com.br   # contra produção
```

Desktop é 1440×900; celular é 390×844 (iPhone 13) em 2×.

**Duas coisas que ele resolve e que davam trabalho toda vez:**
- espera as fontes carregarem — sem isso o print sai com fonte de sistema e engana
- liga as animações `.surge`, que começam invisíveis; sem isso metade da página sai
  em branco no print
- volta ao topo antes de cada recorte de dobra. Rolar + `captureBeyondViewport` se
  somam e o recorte sai na dobra errada (esse bug já enganou uma revisão)

> ⚠️ Precisa do `npm run dev` rodando, a não ser que use `--url`.

---

## `npm run cortar` — foto pro slot de uma LP, sem ampliar

```bash
npm run cortar -- --de tmp/canva/p03.jpg --para public/lp/academy/reais/sala-aula.jpg --formato 3:4
npm run cortar -- --de https://... --para public/x.jpg --formato 4:5 --largura 1200
```

| Opção | O que faz |
|---|---|
| `--de` | arquivo local ou URL |
| `--para` | onde gravar |
| `--formato` | `3:4`, `4:5`, `5:6`, `16:9`… |
| `--largura` | largura desejada — **é um teto, não uma promessa** |
| `--evitar-topo N` | descarta N px do topo (tarja/legenda que veio no export) |
| `--evitar-baixo N` | idem no pé |
| `--foco` | `topo`, `centro` (padrão) ou `baixo` |

**A trava principal: ele se recusa a ampliar.** Se o corte real tem 800px e você pedir
1400, ele entrega 800 e avisa. Imagem ampliada foi reprovada pelo James em 05/08
("faltou qualidade, ficaram com muitos pixels") — a regra virou código pra não repetir.

No fim ele diz até que tamanho de card aquela imagem aguenta em tela retina, que é o
número que interessa na hora de decidir se serve.

---

## Achar o Chrome

Procura nos caminhos comuns de Windows, Mac e Linux. Se não achar, aponta com:

```bash
CHROME_PATH="C:/caminho/chrome.exe" npm run foto academy
```
