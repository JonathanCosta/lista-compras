---
name: pwa
description: Valida configuração PWA, Service Worker, caching, manifest e deploy no projeto SmartCheck Vite + vite-plugin-pwa.
license: MIT
compatibility: opencode
---

## O que valida

- `registerType: 'autoUpdate'` — SW atualiza silenciosamente. Use `'prompt'` para UX de atualização disponível
- `base` condicional: `'/lista-compras/'` em produção, `'/'` em dev
- `scope` / `start_url` no manifest devem casar com `base` — ambos `/lista-compras/`
- Ordem do `runtimeCaching`: Google Fonts (`CacheFirst` 1 ano) antes do catch-all `StaleWhileRevalidate`
- `globPatterns` lista extensões — incluir novos tipos (`.svg`, `.woff2`, `.webp`) aqui
- Deploy: `peaceiris/actions-gh-pages@v4` publica `./dist`, requer `contents: write` e `build` antes

## Como usar

Invoque para revisar config PWA ou problemas offline:

```
@pwa revise a configuração do Service Worker e manifest
```
