# SmartCheck — AGENTS.md

Projeto: PWA de lista de compras 100% offline. Vue 3 + Vite 6 + Tailwind 4 + Dexie.js.

## Comandos

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | Dev server em `:5173` (base `/`) |
| `npm run build` | Build prod em `dist/` + gera SW. Base muda para `/lista-compras/` |
| `npm run preview` | Preview do build em `:4173` (essencial para testar PWA offline) |
| `npx playwright test` | E2E tests. O webServer do config roda build+preview automaticamente |

Teste offline: `npm run build && npm run preview`, depois DevTools > Network > Offline.

## Setup Inicial e Dependências

### Node.js e npm
- **Node.js:** >= 20 (validado em GitHub Actions)
- **npm:** >= 9

### Dependencies (Produção)
| Pacote | Versão | Função |
|--------|--------|--------|
| `vue` | ^3.5.13 | Framework de UI |
| `dexie` | ^4.0.11 | IndexedDB wrapper com transações e liveQuery |
| `@lucide/vue` | ^1.17.0 | Ícones — importar PascalCase (`<ShoppingCart />`) |

### DevDependencies (Build e Dev)
| Pacote | Versão | Crítico? |
|--------|--------|----------|
| `vite` | ^6.3.2 | Bundler ultrarrápido |
| `@vitejs/plugin-vue` | ^5.2.3 | Suporte Vue 3 |
| `@tailwindcss/vite` | ^4.1.4 | ⚠️ **Tailwind 4 usa Vite**, não CLI |
| `tailwindcss` | ^4.1.4 | Framework CSS |
| `vite-plugin-pwa` | ^1.0.0 | Service Worker + manifest automático |
| `@playwright/test` | ^1.60.0 | E2E tests (mobile Pixel 5) |
| `eslint` + `eslint-plugin-vue` | ^9.39.4, ^9.33.0 | Linting (rule `vue/multi-word-component-names: 'off'`) |

### Tailwind CSS 4 — Mudança Crítica
**Não usa `tailwind.config.js`.** Em vez disso:
- Importar em `src/style.css`: `@import "tailwindcss";`
- Customização via variáveis CSS (`:root { --color-*: ... }`)
- Nenhum arquivo de config necessário

## Arquitetura

- `App.vue` alterna `EditMode` / `ExecutionMode` via `useMode()`. `NavBar`, `FooterTotals`, `Toast`, `ConfirmModal` estão sempre montados.
- Composables com estado **singleton** (module-level): `useMode`, `useToast`, `useConfirm`. `useDb` retorna funções, não estado.
- DB acessado **apenas** via `useDb` composable — nunca chamar `db.*` diretamente fora de `useDb` ou `db.js`.
- Pacote de ícones: `@lucide/vue` — importar componentes PascalCase.

## Padrões de State Management (Composables Singleton)

Três composables mantêm estado **global** via variáveis module-level, compartilhadas entre todos os componentes:

### useMode() — Alternar Modo (Edit ↔ Execute)
```js
// src/composables/useMode.js
const mode = ref('edit')  // Module-level, singleton

export function useMode() {
  function toggleMode() {
    mode.value = mode.value === 'edit' ? 'execute' : 'edit'
  }
  return { mode, toggleMode }
}
```
- **Uso:** `const { mode, toggleMode } = useMode()` em qualquer componente
- **Reatividade:** Todos os componentes veem a mesma instância `mode`
- Usado por: `App.vue` (condicional renderização), `NavBar.vue` (botão toggle), `FooterTotals` (exibir/esconder)

### useToast() — Notificações Efêmeras
```js
// src/composables/useToast.js
const toasts = ref([])  // Lista de mensagens ativas

export function useToast() {
  function show(message, type = 'info', duration = 3000) {
    const id = Date.now()
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, duration)
  }
  return { toasts, show }
}
```
- **Uso:** `const { show } = useToast(); show('Item adicionado', 'success')`
- Renderizado uma única vez em `App.vue` → teleportado para `<body>`

### useConfirm() — Diálogo de Confirmação (Uma Única Janela)
```js
// src/composables/useConfirm.js
let resolver  // Module-level promise resolver

export function useConfirm() {
  function show(title, message) {
    return new Promise((resolve) => {
      resolver = resolve  // Sobrescreve promise anterior
      // ... mostrar diálogo
    })
  }
  return { show }
}
```
- **Limitação importante:** Suporta **um diálogo por vez**. Se chamar `show()` enquanto outro está aberto, o primeiro é silenciado.
- Usado por: `NavBar.vue` (confirmar importação), `CategoryAccordion.vue` (confirmar exclusão)

### useDb() — Funções de Database (SEM Estado)
```js
// src/composables/useDb.js
export function useDb() {
  async function getCategories() {
    return await db.categories.toArray()
  }
  async function deleteCategory(id) {
    return await db.transaction('rw', db.categories, db.items, async () => {
      await db.items.where('categoryId').equals(id).delete()
      await db.categories.delete(id)
    })
  }
  return { getCategories, deleteCategory, /* ... */ }
}
```
- **Não retorna estado reativo**, apenas funções
- Cada chamada é uma query fresca do DB
- Nunca guardar resultado em variável fora do componente

## Dexie.js / IndexedDB

- **Nome do banco**: `new Dexie('SmartCheck')` — exato, sem versão no nome.
- **Schema**:
  - `categories`: `++id, name, order, isEditable`
  - `items`: `++id, categoryId, name, quantity, price, isChecked`
- **Seed**: `db.on('ready')` — se `categories.count() === 0`, `bulkAdd` 6 categorias padrão com `isEditable: false`.
- **Sanitização obrigatória** em toda escrita: `name` → `sanitizeString()`, `quantity` → `sanitizeQuantity()`, `price` → `sanitizePrice()`. Raw input nunca vai para o DB.
- **Transações explícitas** (`db.transaction('rw', ...)`) apenas em `deleteCategory` (deleta items + categoria) e `importFromJSON` (clear + bulkAdd ambos). Operações single-table não usam `db.transaction`.
- **`useTotals`** usa `liveQuery(() => db.items.toArray())` com subscribe — **sempre** dar unsubscribe no `onUnmounted` (ver seção "Padrão de Subscription com Dexie").

## Padrão de Subscription com Dexie (liveQuery)

**Usado em:** `src/composables/useTotals.js`

```js
import { liveQuery } from 'dexie'
let subscription  // Module-level

onMounted(() => {
  const observable = liveQuery(() => db.items.toArray())
  subscription = observable.subscribe({
    next: (items) => {
      // Recalcular totais em tempo real
      totalPrevisto.value = items.reduce((s, i) => s + (i.price * i.quantity), 0)
    },
    error: (err) => console.error('liveQuery error:', err),
  })
})

onUnmounted(() => {
  if (subscription) subscription.unsubscribe()  // CRÍTICO: previne memory leak
})
```

**Regras obrigatórias:**
1. Subscribe em `onMounted`, unsubscribe em `onUnmounted`
2. **Nunca** reutilizar `subscription` entre componentes — cria memory leak
3. Se esquecer unsubscribe, `liveQuery` continua ativo em background indefinidamente
4. Debug: DevTools → Application → IndexedDB → SmartCheck → verificar se reatividade funciona

## PWA / vite-plugin-pwa

- `registerType: 'autoUpdate'` — SW atualiza silenciosamente. Mudar para `'prompt'` se quiser UX de "atualização disponível".
- **`base` condicional**: `base: mode === 'production' ? '/lista-compras/' : '/'`. Hardcodar quebra dev server ou deploy.
- `scope` e `start_url` no manifest **devem** casar com `base` — ambos `/lista-compras/`. Discrepância impede instalação do PWA.
- **Ordem do `runtimeCaching` importa**: Google Fonts (`CacheFirst` 1 ano) **antes** do catch-all `StaleWhileRevalidate`.
- `globPatterns` lista extensões explicitamente — incluir novos tipos de asset (`.svg`, `.woff2`, `.webp`) aqui.
- **Deploy**: `peaceiris/actions-gh-pages@v4` publica `./dist`. Precisa de `contents: write` e `npm run build` executado antes.

## Assets Obrigatórios para PWA

Todos os ícones **devem** estar em `public/` para vite-plugin-pwa pre-cachear:

### Favicons (especificados em `index.html`)
- `favicon.svg` — Ícone SVG padrão
- `favicon.ico` — Fallback Windows
- `favicon-16x16.png` — Pequeno (16×16)
- `favicon-32x32.png` — Médio (32×32)

### PWA Icons (especificados em `vite.config.js` manifest)
- `pwa-192x192.png` — **Deve ser maskable** (design dentro de safe zone)
- `pwa-512x512.png` — **Deve ser maskable**
- `apple-touch-icon.png` — iOS home screen (180×180 PNG)

**⚠️ Se faltar ícone, PWA pode não instalar no iOS ou Android.**

## Toast / ConfirmModal

- `<Toast>` usa `TransitionGroup name="toast"` com transições CSS (não `@keyframes`). **Requer** `.toast-leave-active { position: absolute; }` para FLIP funcionar.
- `useConfirm` é **singleton** com `resolver` module-level — suporta apenas **um** diálogo por vez. O segundo `show()` silencia o primeiro.
- Ambos teleportados para `<body>`. O scoped CSS do componente funciona mesmo com Teleport.

## CSS e Variáveis de Marca

### Tailwind 4
- Tailwind 4 via `@import "tailwindcss"` em `src/style.css` — **não** há `tailwind.config.js`.
- Customização exclusiva via variáveis CSS (nenhum arquivo de config).

### Variáveis CSS Disponíveis (em `:root`)
| Variável | Valor | Uso |
|----------|-------|-----|
| `--color-brand` | `#008080` (teal) | Botões primários, checkboxes, acentos, modo Execução |
| `--color-gold` | `#FFD700` | Badge modo Edição |
| `--color-text` | `#333333` | Textos padrão, labels, inputs |
| `--color-bg` | `#f3f4f5` | Fundo geral (cinza claro) |
| `--color-deep` | `#003366` | **Legacy — não usado** (remover em refactor futuro) |

### Fonte
- **Montserrat:** Definida no `body` via `src/style.css`
- **Weights:** 400 (regular), 600 (semibold), 700 (bold), 800 (extrabold)
- Importada de Google Fonts (pre-cached por 1 ano em `runtimeCaching`)

## Testes com Playwright

### Configuração
- `playwright.config.js`: `webServer` roda `npm run build && npm run preview` na porta `4173`
- Dispositivo emulado: **Pixel 5** (viewport mobile 393×851px)
- `baseURL: 'http://localhost:4173/lista-compras/'`
- **Modo local:** `reuseExistingServer: true` (reutiliza servidor, mais rápido)
- **Modo CI:** `reuseExistingServer: false` (reconstrói a cada run, garante isolamento)

### Padrão data-testid (Naming Convention)
Kebab-case: `[verb-ou-noun]-[target][-id-se-dinâmico]`

| Pattern | Exemplo | Quando Usar |
|---------|---------|-------------|
| `toggle-*` | `toggle-mode` | Botão que alterna estado (edit ↔ execute) |
| `btn-*` | `btn-add-item`, `btn-confirm-price` | Botão com ação |
| `input-*` | `input-item-price` | Input field |
| `checkbox-*` | `checkbox-item` | Checkbox item |
| `*-{id}` | `accordion-1` | Elemento dinâmico com ID numérico |

### Cenários Testados
1. **Fluxo Edição → Execução:** Adicionar item, definir quantity/price, marcar como comprado, verificar totais
2. **Resiliência Offline:** Simular offline com DevTools, validar que SW serve do cache
3. **Persistência Atômica:** Fechar aba abruptamente, verificar data persiste no IndexedDB

### Executar Testes
```bash
npx playwright test          # Local: reutiliza servidor
CI=true npx playwright test  # CI: reconstrói a cada run
```

## Troubleshooting e Pitfalls Comuns

### ❌ PWA Não Instala no iOS
**Causa:** Falta `apple-touch-icon.png` em `public/`  
**Solução:** Adicionar `public/apple-touch-icon.png` (180×180 PNG)  
**Referência:** Seção "Assets Obrigatórios para PWA"

### ❌ Tailwind Não Funciona em Dev
**Causa:** `src/style.css` não tem `@import "tailwindcss"`  
**Solução:** Verificar que primeira linha de `src/style.css` é `@import "tailwindcss";`

### ❌ Teste Offline Falha com "Network Error"
**Causa:** Service Worker não registrou no navegador  
**Solução:**
1. Executar `npm run build && npm run preview` (não basta `npm run dev`)
2. DevTools → Application → Service Workers → Verificar "SmartCheck" ativo
3. Network tab → Offline → Recarregar → Deve funcionar

### ❌ liveQuery Parou de Atualizar
**Causa:** Subscription nunca foi desmontada (memory leak anterior)  
**Solução:** Verificar que `useTotals` tem `onUnmounted(() => subscription?.unsubscribe())`  
**Referência:** Seção "Padrão de Subscription com Dexie"

### ❌ Build Falha: "scope ou start_url não coincidem"
**Causa:** `vite.config.js` define `scope: '/lista-compras/'` mas `base` está diferente  
**Solução:**
```js
base: mode === 'production' ? '/lista-compras/' : '/',
// No manifest:
scope: '/lista-compras/',
start_url: '/lista-compras/',
```
Todos os três **devem** ser idênticos.

### ❌ Importação de Icon Falha ("undefined is not a constructor")
**Causa:** Importar como export default ou snake_case  
**Solução:** Importar PascalCase, direct import:
```js
import { ShoppingCart, Edit3 } from '@lucide/vue'  // ✓ Certo
```

### ❌ Toast/Modal Aparecem por Trás
**Causa:** z-index insuficiente ou componente não teleportado para `<body>`  
**Solução:** Verificar que `<Toast>` tem `z-[9999]` e `<ConfirmModal>` tem `z-[9998]`, e ambos estão em Teleport

## Deploy em GitHub Pages

### Pré-requisitos
1. Repositório GitHub com branch `main`
2. Arquivo `.github/workflows/deploy.yml` presente
3. **Settings → Pages → Source:** "Deploy from a branch" → Branch `gh-pages`
4. Workflow permissions: `contents: write` (para fazer push em gh-pages)

### Fluxo Automático (a cada push em `main`)
1. Checkout código
2. Setup Node.js 20
3. `npm ci` + `npm run lint`
4. `npm run build` (gera `dist/` com Service Worker)
5. `npx playwright test` (testa no preview)
6. Deploy `dist/` → `gh-pages` branch (automático)

### Configuração da Base
- **Dev:** `base: '/'` (localhost:5173)
- **Prod:** `base: '/lista-compras/'` (github.com/USER/lista-compras)

**⚠️ Se repositório for renomeado, atualizar `vite.config.js` `base` e redeploy.**

### URL Final
```
https://SEU_USERNAME.github.io/lista-compras/
```

## Convenções do repositório

- Componentes: PascalCase, `<script setup>`, sem TypeScript (JS puro).
- Eventos: kebab-case. Props: camelCase.
- Inputs numéricos: `type="number"` com `min` (quantidade `min="0"`, preço `min="0"`).
- Commits seguem [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
