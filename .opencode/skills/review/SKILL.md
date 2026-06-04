---
name: review
description: Revisor de código Vue 3, Composition API, Tailwind CSS, acessibilidade e boas práticas no projeto SmartCheck.
license: MIT
compatibility: opencode
---

## O que valida

- Vue 3: Composition API com `<script setup>`, `ref` vs `reactive`, `computed`, `watch`
- Tailwind CSS 4: classes utilitárias, responsividade, variáveis CSS da marca (`--color-brand: #008080`)
- Acessibilidade: atributos `aria`, foco, contraste, semântica HTML, navegação por teclado
- Nomenclatura: componentes PascalCase, composables `useXxx`, eventos kebab-case, props camelCase
- Tratamento de erros: `try/catch`, fallbacks, estados de loading/empty/error
- Componentes: single responsibility, props bem definidas, emits tipados

## Como usar

Invoque para revisar qualidade do código:

```
@review revise este componente
```
