# SmartCheck — Compras Inteligentes 🛒

**SmartCheck** é um PWA de lista de compras inteligente, reutilizável e **offline-first**. Sem cadastro, sem servidor, sem dependência de internet. Os dados ficam armazenados localmente no navegador via IndexedDB.

## Stack Tecnológica

| Camada | Tecnologia | Função |
|--------|-----------|--------|
| Build | Vite 6 | Build ultrarrápido para SPA/PWA |
| Framework | Vue 3 (Composition API) | Reatividade fina e componentes |
| Estilização | Tailwind CSS 4 | Utilitário mobile-first via `@tailwindcss/vite` |
| Persistência | Dexie.js 4 | IndexedDB com transações atômicas |
| PWA | vite-plugin-pwa | Service Worker, manifest, precaching |
| Ícones | Lucide Vue | Ícones leves e consistentes |
| Testes | Playwright | Testes end-to-end |
| CI/CD | GitHub Actions | Build + Deploy para GitHub Pages |

## Funcionalidades

- **Dois modos de uso**: alterna entre **Modo Edição** (planejamento) e **Modo Compras** (execução com accordions)
- **Gerenciamento de categorias**: adicionar, renomear e excluir (seed automático com 6 categorias iniciais)
- **Gerenciamento de itens**: adicionar, editar quantidade e preço, excluir
- **Modo Compras**: accordion com uma categoria por vez, itens não-checados primeiro, checkbox com line-through, preço editável inline, badge de quantidade
- **QuickAdd**: campo rápido para adicionar itens durante as compras
- **Totalizador no rodapé**: "Previsto" (total calculado) e "No carrinho" (soma dos marcados), atualizados em tempo real
- **Desmarcar Todos**: reseta todos os checkboxes com confirmação
- **Compartilhar lista**: Web Share API com fallback para cópia à área de transferência
- **Backup e Restore**: exportar/importar lista completa em JSON
- **Offline-first**: Service Worker com precaching e runtime caching
- **PWA instalável**: `display: standalone`, ícones, tema `#008080`
- **Quantidade zero**: itens com quantidade 0 ficam ocultos no modo compras

## Pré-requisitos

- **Node.js** >= 20
- **npm** >= 9

## Como Executar

```bash
# 1. Clone o repositório
git clone https://github.com/SEU_USUARIO/lista-compras.git
cd lista-compras

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento
npm run dev
# Abre em http://localhost:5173

# 4. Build de produção
npm run build
# Gera os arquivos em dist/

# 5. Preview do build
npm run preview
# Abre em http://localhost:4173/lista-compras/
```

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Gera build de produção em `dist/` |
| `npm run preview` | Servidor local para preview do build |
| `npx playwright test` | Executa testes E2E |

## 🗄️ Banco de Dados e Persistência

O SmartCheck utiliza **Dexie.js** — um *wrapper* sobre a **IndexedDB** do navegador — como motor de armazenamento local. A escolha foi motivada pelo **offline-first**: todas as operações são 100% locais, sem depender de servidor externo, com transações atômicas garantindo integridade mesmo em interrupções.

| Tabela | Índices | Descrição |
|--------|---------|-----------|
| `categories` | `++id`, `name`, `order`, `isEditable` | Categorias dos produtos |
| `items` | `++id`, `categoryId`, `name`, `quantity`, `price`, `isChecked` | Itens de compra |

Na **primeira execução**, o evento `db.on('ready')` insere automaticamente 6 categorias padrão: **Sacolão, Carnes, Bebidas, Limpeza, Higiene e Diversos**.

Toda a lógica de interação com o banco fica no *composable* [`useDb()`](src/composables/useDb.js), que expõe funções como `getCategories()`, `addItem()`, `toggleCheck()`, `deleteCategory()` (com transação para remover itens órfãos), `uncheckAll()`, além de **export/import** completo via `exportToJSON()` e `importFromJSON()`.

## 📱 Progressive Web App

O **SmartCheck** é um **PWA** — funciona como um aplicativo nativo, mas roda no navegador. Pode ser **instalado no celular ou desktop** com "Adicionar à tela inicial", sem precisar de lojas de aplicativos.

### Funcionalidades offline

Graças ao **Service Worker** gerado pelo `vite-plugin-pwa` com `registerType: 'autoUpdate'`:
- **Precaching**: todos os assets estáticos são pré-cacheados na instalação
- **Runtime caching**: Google Fonts com **CacheFirst** (1 ano), demais com **StaleWhileRevalidate**

### Web App Manifest

- `theme_color` / `background_color`: `#008080` (teal)
- `display`: `standalone` (janela própria, sem barra de endereço)
- Ícones: 192×192, 512×512 (`maskable`) e 180×180 (apple-touch-icon)

### Como instalar

1. Acesse o SmartCheck pelo navegador no celular
2. Toque no menu e selecione **"Adicionar à tela inicial"**
3. Confirme — o ícone aparecerá na sua tela inicial como um app nativo

## Estrutura do Projeto

```
lista-compras/
├── index.html
├── vite.config.js
├── package.json
├── playwright.config.js
├── .github/workflows/deploy.yml
├── public/                      # Favicons e ícones PWA
├── src/
│   ├── main.js
│   ├── App.vue
│   ├── style.css
│   ├── database/db.js           # Schema Dexie + seed
│   ├── composables/             # useDb, useMode, useToast, useConfirm, useTotals
│   ├── components/              # NavBar, EditMode, ExecutionMode, CategoryAccordion,
│   │                            # ItemRow, QuickAdd, FooterTotals, Toast, ConfirmModal
│   └── utils/                   # sanitize.js, format.js
├── tests/smartcheck.spec.js     # Testes E2E (3 cenários)
└── docs/
    ├── plano-tecnico.md
    └── plano-execucao.md
```

## Testes

```bash
# Executa os 3 cenários E2E no Playwright (Pixel 5 emulado)
npx playwright test
```

Cenários cobertos:
1. **Fluxo Edição → Execução** com verificação de totais
2. **Resiliência Offline** (PWA — Service Worker + IndexedDB)
3. **Persistência Atômica** (fechar/reabrir aba, dados intactos)

## CI/CD

O deploy para **GitHub Pages** é automatizado via GitHub Actions. Ao fazer push na branch `main`:
1. `npm ci` — instala dependências
2. `npm run build` — gera o build de produção
3. `peaceiris/actions-gh-pages` — publica `dist/` na branch `gh-pages`

O app fica disponível em `https://SEU_USUARIO.github.io/lista-compras/`.

## Licença

MIT
