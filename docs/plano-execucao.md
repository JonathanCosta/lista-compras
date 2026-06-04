# Plano de Execução — SmartCheck PWA

Estratégia de desenvolvimento, PWA offline-first, segurança e CI/CD.

## 1. Consolidação do Blueprint Técnico

O sistema opera de forma estritamente descentralizada (Client-Side), utilizando a estratégia offline-first. O núcleo comportamental divide-se em dois estados de interface controlados por um estado global: **Modo Edição (Planejamento)** e **Modo Execução (Compras)**.

## Especificação da Stack Tecnológica

- **Build/Bundler:** Vite
- **Framework UI:** Vue 3 (Composition API)
- **Estilização:** Tailwind CSS
- **Persistência:** IndexedDB via Dexie.js
- **PWA:** vite-plugin-pwa com Service Workers

## 2. Segurança e Resiliência de Dados

Como o aplicativo não possui backend, a segurança concentra-se na integridade dos dados locais.

**Diretriz:** Uso de IndexedDB (via Dexie.js) é obrigatório — browsers modernos tratam IndexedDB como armazenamento persistente, reduzindo risco de expurgo.

### Mecanismos de Proteção

1. **Transações Atômicas:** Todas as mutações usam transações nativas do Dexie.js para evitar estados parciais.
2. **Sanitização:** Preços e quantidades passam por coerção e validação antes da persistência.
3. **Backup & Restore:** Exportação completa do banco para JSON, permitindo restauração em caso de perda.

## 3. Pipeline de CI/CD — GitHub Pages

Deploy automatizado via GitHub Actions. O Vite usa `base` condicional para produção:

```js
base: mode === 'production' ? '/lista-compras/' : '/',
```

**Workflow `.github/workflows/deploy.yml`:** Acionado em push na `main`, executa `npm ci` + `npm run build` + deploy para `gh-pages`.

## 4. Cronograma de Validação

| Fase | Implementação | Critério de Validação |
|------|--------------|----------------------|
| Persistência | Dexie.js, schemas, seed de categorias | DB instanciado com 6 categorias na primeira inicialização |
| Estado & UI | Modos Edição/Execução, accordions, totalizadores | Ao marcar item, ele desce, ganha estilo riscado e atualiza total |
| Offline PWA | Service Workers via vite-plugin-pwa | App carrega sem rede com dados intactos |
| Resiliência | Export/Import JSON e sanitização | Exportar, limpar DB, importar, validar恢复 |

## 5. Instruções de Codificação

1. Setup inicial Vite + Tailwind + Dexie + vite-plugin-pwa
2. Configurar `vite.config.js` com `base` condicional
3. Criar camada de banco com schema: `categories` (`++id, name, order, isEditable`) e `items` (`++id, categoryId, name, quantity, price, isChecked`)
4. Seed automático de categorias iniciais
5. Interface com dois modos (Edição/Execução) geridos por estado reativo
6. Mecanismos de segurança: transações, sanitização, export/import
7. Workflow de CI/CD para GitHub Pages
