# 📋 Backlog — Portal Jay Academy

> Fila ordenada do que sobrou pra fazer. Substitui o antigo `backlog.md`.
>
> Quando uma feature for completada, move pra `progresso-atual.md` (seção "Features completas") + anota a decisão em `historico-decisoes.md`.

---

## 🔥 Sprint atual — 3 features priorizadas (2026-06-01)

James decidiu atacar 3 features em ordem:

### 1ª — Editor das LPs nativas no portal ⭐ (começar por essa)
**O ganho**: para de depender de mim/dev pra ajustar texto/imagem do PMU CLASS, Magic Shadow, Jayo Laser.

**Trabalho**: ~3-4h. Precisa converter cada LP em esquema JSON editável + renderer + editor.

**Estado atual**:
- ✅ `EditorShell` (`components/editor-shell.tsx`) já é visual editor completo (Canva-style: select, inspect, move, resize, undo/redo, image replace, layers)
- ✅ `/lps/[slug]/edit-visual` funciona pra **Magic Shadow** e **Jayo Laser** (embed HTML estático)
- ✅ `lp-content-store.ts` tem schema JSON pro **PMU CLASS** (`PmuClassContent` com heroSlides + whatsappLink)
- ✅ `/lps/pmuclass/edit-content` edita PMU CLASS via campos custom
- ❌ Falta: PMU CLASS hoje só edita 3 hero slides + WA. Tem que cobrir resto da LP (módulos, depoimentos, CTA, etc.)
- ❌ Falta: experiência unificada — hoje cada LP tem "tipo de editor" diferente, confunde

**Decisões pendentes**:
- Visual (estilo Canva) ou Campos (estilo form) pro PMU CLASS?
- Estender schemas de Magic Shadow / Laser pra também edit-content via campos?
- Unificar URLs (todas `/lps/[slug]/edit`) ou manter separação (`edit-visual` vs `edit-content`)?

### 2ª — Editor visual no /forms
**O ganho**: forms com mais campos (radio, select, textarea, checkbox) + cores customizadas.

**Trabalho**: ~3h. Field builder + style panel no `/forms/new` e `/forms/[id]`.

**Estado atual**: `/forms/new/new-form-view.tsx` existe. Falta inspecionar o que cobre.

### 3ª — Páginas do zero estilo Webflow
**O ganho**: criar LPs novas SEM depender de WP nem de dev escrever React. Blocos pré-feitos (hero, depoimentos, FAQ, CTA) arrasta e configura.

**Trabalho**: ~1 dia inteiro. A mais ambiciosa.

**Considerações iniciais**:
- Pode aproveitar o `EditorShell` existente como base
- Schema JSON de página = array de blocos tipados (hero, faq, testimonials, cta, etc.)
- Cada bloco tem variantes visuais + campos editáveis
- Renderer público em `/p/[slug]` consumindo o JSON
- Criação via "adicionar bloco" → modal com galeria de templates

---

### Outros caminhos guardados (não atacar agora)
- Polimento visual — varrer rotas e refinar consistência
- ~~Recopiar 17 páginas WP antigas sem `fullHtml`~~ **SUPERADO (17/07/2026)**: cobertura re-validada contra o sitemap do WP (68/68 na Vercel) nas sessões de 16/07; a UI de importação foi removida — usar `?wpcheck=1` como verificação
- Deploy real em `jayacademy.com.br`

---

## 💪 Backlog priorizado

### 1. Deploy em produção (`jayacademy.com.br`)
- Vercel project linkado
- Variáveis de ambiente (`AUTH_SECRET`, KV/DB, GA4, Meta Pixel)
- `vercel.json` com rewrites pras LPs:
  - `/pmuclass/*` → deploy PMU CLASS
  - `/magicshadow/*` → deploy Magic Shadow 3
  - `/laser/*` → deploy Jayo Laser
- **Decidir**: destino do WordPress atual (backup em `wp.`? redirects 301? morre?) → **DECIDIDO (17/07/2026): morre** após backup (dump do banco + uploads) e `?wpcheck=1` retornando `ok:true` — ver checklist na sessão parte 7 do `progresso-atual.md`
- **Decidir**: migrar `data/` JSON local pra Vercel KV / Postgres / Supabase

### 2. Analytics
- Plugar GA4 + Meta Pixel
- Decidir: por sub-projeto ou global no portal?
- Exibir métricas básicas no card de cada LP (visits, leads, conversão)

### 3. ~~Recopiar páginas WP antigas~~ SUPERADO (17/07/2026)
- O diretório `data/wp-content/` não existe mais; o conteúdo vive no KV de produção e a cobertura foi re-validada contra o sitemap do WP (68/68). A UI de importação (`/wordpress`) foi removida — verificação atual: `/api/wp-localize?wpcheck=1`

### 4. Sistema de notificações in-app (toast)
- Hoje: ações concluídas via redirect+revalidate, sem feedback visual claro
- Adicionar toast lib (sonner é popular) ou custom
- Disparar em: save, publish, delete, trash, restore

### 5. Bulk actions na lista de LPs/páginas WP
- Checkbox nas linhas → barra de ações em massa
- Ações: publicar, arquivar, mover pra lixeira, mover pra categoria X
- Útil quando passar de ~10 itens (já tem ~22 entre LPs e WP)

### 6. Templates de LP (nova LP a partir de template)
- "Criar LP" oferece opções: em branco / a partir de PMU CLASS / a partir de Magic Shadow
- Clona estrutura + conteúdo placeholder

### 7. Preview com toggle de dispositivo
- Botões `desktop / tablet / mobile` no preview iframe
- Mostra responsividade direto no portal

### 8. Analytics próprio sutil (não substituto do GA)
- Pageviews por dia/semana
- Top páginas
- Tempo médio na página
- **Trade-off**: implementar tracking básico ou esperar GA4?

---

## 🔒 Decidido pular (NÃO fazer por enquanto)

### Auth granular além dos 3 roles
- Hoje: senior / admin / viewer cobre o caso
- Permissões por LP, por feature, etc. — overkill agora

### Versionamento completo de páginas
- Ctrl+Z no editor basta por enquanto
- Snapshots pesam muito sem ROI claro

### Drag-to-reorder global
- Lista de LPs cabe na tela
- Quando passar de 30+, considerar

### Comments inline no editor
- Equipe pequena, não vale a complexidade

### Deploy centralizado completo
- Vercel já tem dashboard ótimo, não precisamos recriar

### Multi-tenancy / sub-contas
- James é único senior por enquanto
- Se vender o portal como produto, retomar

---

## 🆕 Como adicionar ao backlog

1. Avalia prioridade:
   - **Sprint atual** = decidi com James que faz agora
   - **Priorizado** = vai fazer, mas não agora
   - **Pulando** = decidi não fazer (anota motivo)

2. Cada item tem:
   - Título claro
   - O que fazer (bullets)
   - Por quê (motivação)
   - Trade-offs / decisões pendentes

3. Quando completar:
   - Move pra `progresso-atual.md` → "Features completas"
   - Anota decisão final em `historico-decisoes.md` (se teve trade-off importante)
   - Remove daqui

---

> **Última revisão**: 2026-06-01
