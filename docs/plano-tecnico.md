# Plano Técnico — SmartCheck PWA

## Stack Tecnológica

| Camada | Tecnologia | Função |
|--------|-----------|--------|
| Bundler | Vite | Build ultrarrápido para SPA/PWA |
| Framework UI | Vue 3 | Composition API, `<script setup>`, reatividade fina |
| Estilização | Tailwind CSS 4 | Utilitário mobile-first via `@tailwindcss/vite` |
| Persistência | Dexie.js | IndexedDB com transações atômicas |
| PWA | vite-plugin-pwa | Service Worker, manifest, precaching |
| Ícones | Lucide Vue | Ícones leves e consistentes |

## Estrutura de Diretórios

```
lista-compras/
├── index.html
├── vite.config.js
├── package.json
├── opencode.json
├── .gitignore
├── .github/workflows/deploy.yml
├── docs/
│   ├── plano-tecnico.md
│   └── plano-execucao.md
├── marca/
│   ├── brand-board.md
│   ├── identidade.md
│   └── icone.png
├── public/
│   ├── favicon.svg
│   ├── pwa-192x192.png
│   └── pwa-512x512.png
├── src/
│   ├── main.js
│   ├── App.vue
│   ├── style.css
│   ├── database/
│   │   └── db.js
│   ├── composables/
│   │   ├── useDb.js
│   │   ├── useMode.js
│   │   ├── useToast.js
│   │   ├── useConfirm.js
│   │   └── useTotals.js
│   ├── components/
│   │   ├── NavBar.vue
│   │   ├── FooterTotals.vue
│   │   ├── EditMode.vue
│   │   ├── ExecutionMode.vue
│   │   ├── CategoryAccordion.vue
│   │   ├── ItemRow.vue
│   │   ├── QuickAdd.vue
│   │   ├── Toast.vue
│   │   └── ConfirmModal.vue
│   └── utils/
│       ├── sanitize.js
│       └── format.js
└── tests/
    └── smartcheck.spec.js
```

## Fases de Implementação

Cada fase possui validação por um dos agentes configurados no opencode:
- **@review** — valida qualidade do código
- **@dexie** — valida queries, schemas, transações
- **@pwa** — valida manifest, service worker, caching

---

### Fase 1: Setup do Projeto

**Arquivos criados:**
- `package.json`
- `vite.config.js`
- `index.html`
- `src/main.js`
- `src/App.vue`
- `src/style.css`

**`vite.config.js`:**

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'SmartCheck - Compras Inteligentes',
        short_name: 'SmartCheck',
        description: 'PWA de lista de compras inteligente, reutilizável e offline-first',
        theme_color: '#008080',
        background_color: '#008080',
        display: 'standalone',
        scope: '/lista-compras/',
        start_url: '/lista-compras/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          { src: 'apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'apple-touch-icon' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https?:\/\/.*/,
            handler: 'StaleWhileRevalidate',
          },
        ],
      },
    }),
  ],
  base: mode === 'production' ? '/lista-compras/' : '/',
}))
```

---

### Fase 2: Camada de Persistência (Dexie.js)

**Arquivo:** `src/database/db.js`

**Schema do Banco:**

| Tabela | Schema | Índices |
|--------|--------|---------|
| `categories` | `++id, name, order, isEditable` | `id` (auto), `order` |
| `items` | `++id, categoryId, name, quantity, price, isChecked` | `id` (auto), `categoryId`, `isChecked` |

**Seed Automático:** Disparado em `db.on('ready')`. Se `categories.count()` for 0, insere: Sacolão, Carnes, Bebidas, Limpeza, Higiene, Diversos.

---

### Fase 3: Composables de Estado e Dados

**Arquivos criados:**
- `src/composables/useMode.js`
- `src/composables/useDb.js`
- `src/composables/useTotals.js`
- `src/composables/useToast.js`
- `src/composables/useConfirm.js`
- `src/utils/sanitize.js`
- `src/utils/format.js`

**Regras de sanitização (`src/utils/sanitize.js`):**

```js
export function sanitizePrice(value) {
  const num = parseFloat(value)
  return isNaN(num) || num < 0 ? 0 : Math.round(num * 100) / 100
}

export function sanitizeQuantity(value) {
  const num = parseInt(value, 10)
  return isNaN(num) || num < 0 ? 1 : num
}

export function sanitizeString(value) {
  return String(value).trim().slice(0, 100)
}
```

**Regras de formatação (`src/utils/format.js`):**

```js
export function formatCurrency(value) {
  const num = Number(value) || 0
  return `R$ ${num.toFixed(2)}`
}

export function formatShareText(categories, items) {
  let text = 'SmartCheck - Minha Lista de Compras\n\n'
  for (const cat of categories) {
    text += `${cat.name}\n`
    const catItems = items.filter(i => i.categoryId === cat.id)
    for (const item of catItems) {
      text += `- ${item.name} (${item.quantity}x)`
      if (item.price > 0) text += ` - ${formatCurrency(item.price)}`
      text += '\n'
    }
    text += '\n'
  }
  text += 'Criado com SmartCheck'
  return text
}
```

---

### Fase 4: Componentes de Layout

**Arquivos criados:**
- `src/components/NavBar.vue` — toggle modo, compartilhar, backup
- `src/components/FooterTotals.vue` — totalizador fixo inferior

**Toggle Mode:**
- Modo Edição: botão verde com ícone de lápis + "Edição"
- Modo Compras: botão amarelo com ícone de carrinho + "Compras"

**Compartilhar:** Web Share API com fallback para clipboard.

---

### Fase 5: EditMode — Gerenciamento da Lista

**Arquivo:** `src/components/EditMode.vue`

Funcionalidades:
- Lista plana de categorias com itens
- Adicionar, renomear, excluir categorias
- Adicionar, editar, excluir itens
- Inputs de quantidade (min 0) e preço
- Botão "Desmarcar Todos"

---

### Fase 6: ExecutionMode — Experiência de Compra

**Arquivos criados:**
- `src/components/ExecutionMode.vue`
- `src/components/CategoryAccordion.vue`
- `src/components/ItemRow.vue`
- `src/components/QuickAdd.vue`

**Ordenação dos itens:** não checados primeiro (por nome), depois checados.

**Accordion:** apenas 1 categoria aberta por vez (controlled pattern).

**ItemRow:** checkbox, nome com line-through se marcado, badge de quantidade, preço clicável para edição inline.

**QuickAdd:** input + select de categoria + botão "+", submit via Enter.

---

### Fase 7: PWA — Service Worker e Manifest

Configurado via `vite-plugin-pwa` com `registerType: 'autoUpdate'`.

**Verificações:**
- Manifest com theme_color, icons, display standalone
- Service Worker gerado automaticamente
- Assets estáticos precacheados
- App funcional offline

---

### Fase 8: Resiliência e Backup

**Exportação:** `JSON.stringify` do banco completo → download `.json`

**Importação:** upload de arquivo → validação de estrutura → `importFromJSON()`

**Confirmação antes de importar** (sobrescreve dados atuais).

---

### Fase 9: CI/CD — GitHub Actions

**Arquivo:** `.github/workflows/deploy.yml`

```yaml
name: Deploy GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## Resumo das Responsabilidades por Agente

| Agente | O que valida |
|--------|-------------|
| **@pwa** | Manifest, service worker, cache, offline, instalável |
| **@dexie** | Schema, transações, live queries, sanitização, export/import |
| **@review** | Qualidade código Vue 3, Composition API, acessibilidade |
