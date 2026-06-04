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

## Arquitetura

- `App.vue` alterna `EditMode` / `ExecutionMode` via `useMode()`. `NavBar`, `FooterTotals`, `Toast`, `ConfirmModal` estão sempre montados.
- Composables com estado **singleton** (module-level): `useMode`, `useToast`, `useConfirm`. `useDb` retorna funções, não estado.
- DB acessado **apenas** via `useDb` composable — nunca chamar `db.*` diretamente fora de `useDb` ou `db.js`.
- Pacote de ícones: `@lucide/vue` — importar componentes PascalCase.

## Dexie.js / IndexedDB

- **Nome do banco**: `new Dexie('SmartCheck')` — exato, sem versão no nome.
- **Schema**:
  - `categories`: `++id, name, order, isEditable`
  - `items`: `++id, categoryId, name, quantity, price, isChecked`
- **Seed**: `db.on('ready')` — se `categories.count() === 0`, `bulkAdd` 6 categorias padrão com `isEditable: false`.
- **Sanitização obrigatória** em toda escrita: `name` → `sanitizeString()`, `quantity` → `sanitizeQuantity()`, `price` → `sanitizePrice()`. Raw input nunca vai para o DB.
- **Transações explícitas** (`db.transaction('rw', ...)`) apenas em `deleteCategory` (deleta items + categoria) e `importFromJSON` (clear + bulkAdd ambos). Operações single-table não usam `db.transaction`.
- **`useTotals`** usa `liveQuery(() => db.items.toArray())` com subscribe — **sempre** dar unsubscribe no `onUnmounted`.

## PWA / vite-plugin-pwa

- `registerType: 'autoUpdate'` — SW atualiza silenciosamente. Mudar para `'prompt'` se quiser UX de "atualização disponível".
- **`base` condicional**: `base: mode === 'production' ? '/lista-compras/' : '/'`. Hardcodar quebra dev server ou deploy.
- `scope` e `start_url` no manifest **devem** casar com `base` — ambos `/lista-compras/`. Discrepância impede instalação do PWA.
- **Ordem do `runtimeCaching` importa**: Google Fonts (`CacheFirst` 1 ano) **antes** do catch-all `StaleWhileRevalidate`.
- `globPatterns` lista extensões explicitamente — incluir novos tipos de asset (`.svg`, `.woff2`, `.webp`) aqui.
- **Deploy**: `peaceiris/actions-gh-pages@v4` publica `./dist`. Precisa de `contents: write` e `npm run build` executado antes.

## Toast / ConfirmModal

- `<Toast>` usa `TransitionGroup name="toast"` com transições CSS (não `@keyframes`). **Requer** `.toast-leave-active { position: absolute; }` para FLIP funcionar.
- `useConfirm` é **singleton** com `resolver` module-level — suporta apenas **um** diálogo por vez. O segundo `show()` silencia o primeiro.
- Ambos teleportados para `<body>`. O scoped CSS do componente funciona mesmo com Teleport.

## CSS

- Tailwind 4 via `@import "tailwindcss"` em `src/style.css` — **não** há `tailwind.config.js`.
- Variáveis CSS da marca: `--color-brand: #008080`, `--color-gold: #FFD700`, `--color-text: #333333`, `--color-deep: #003366`, `--color-bg: #f3f4f5`.
- Fonte: Montserrat (definida no `body` via CSS).

## Testes

- `playwright.config.js`: `webServer` roda `npm run build && npm run preview` na porta `4173`.
- Dispositivo emulado: **Pixel 5** (viewport mobile).
- `baseURL: 'http://localhost:4173/lista-compras/'`.
- Cenários: fluxo edição→execução com totais, resiliência offline, persistência atômica.

## Convenções do repositório

- Componentes: PascalCase, `<script setup>`, sem TypeScript (JS puro).
- Eventos: kebab-case. Props: camelCase.
- Inputs numéricos: `type="number"` com `min` (quantidade `min="0"`, preço `min="0"`).
- Commits seguem [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
