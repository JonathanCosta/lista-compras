---
name: dexie
description: Valida schemas do Dexie.js, transações, sanitização, seed e export/import JSON no projeto SmartCheck PWA.
license: MIT
compatibility: opencode
---

## O que valida

- Schema do banco: `categories` (`++id, name, order, isEditable`) e `items` (`++id, categoryId, name, quantity, price, isChecked`)
- Nome do banco: `new Dexie('SmartCheck')` — exato, sem versão no nome
- Seed automático: `db.on('ready')` insere 6 categorias com `isEditable: false` se vazio
- Sanitização obrigatória: `name` → `sanitizeString`, `quantity` → `sanitizeQuantity`, `price` → `sanitizePrice`
- Transações: `db.transaction('rw', ...)` apenas em `deleteCategory` e `importFromJSON` (operações multi-tabela)
- `useTotals` com `liveQuery`: deve dar `unsubscribe` no `onUnmounted`

## Como usar

Invoque durante alterações no banco:

```
@dexie valide o schema e transações desta alteração
```
