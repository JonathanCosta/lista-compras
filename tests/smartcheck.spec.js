import { test, expect } from '@playwright/test'

test.describe('SmartCheck - Lista de Compras PWA', () => {

  test('Cenário 1: Fluxo Edição → Execução com verificação de totais', async ({ page }) => {
    await page.goto('/')

    // 1. Seed inicial — verificar que "Sacolão" está visível
    await expect(page.locator('text=Sacolão').first()).toBeVisible()

    // 2. Adicionar item "Maçã" na primeira categoria (Sacolão)
    const itemNameInput = page.locator('[data-testid="input-item-name"]').first()
    await itemNameInput.fill('Maçã')
    await page.locator('[data-testid="btn-add-item"]').first().click()

    // 3. Aguardar o item aparecer na lista e definir quantidade e preço
    await expect(page.locator('[data-testid^="item-row-"]').first()).toBeVisible({ timeout: 3000 })

    const qtyInput = page.locator('[data-testid="input-item-qty"]').first()
    await qtyInput.evaluate(el => {
      el.value = '3'
      el.dispatchEvent(new Event('change', { bubbles: true }))
    })

    const priceInput = page.locator('[data-testid="input-item-price"]').first()
    await priceInput.evaluate(el => {
      el.value = '2.50'
      el.dispatchEvent(new Event('change', { bubbles: true }))
    })

    // 4. Verificar total previsto: 3 × 2,50 = R$ 7.50
    await expect(page.locator('[data-testid="total-previsto"]')).toHaveText('R$ 7.50')

    // 5. Alternar para modo Execução
    await page.locator('[data-testid="toggle-mode"]').click()

    // 6. Expandir accordion da categoria Sacolão (id=1)
    await page.locator('[data-testid="accordion-1"]').click()

    // 7. Marcar o checkbox do item
    await page.locator('[data-testid="checkbox-item"]').first().click()

    // 8. Verificar que o nome do item ganhou a classe line-through
    await expect(page.locator('[data-testid="item-name"]').first()).toHaveClass(/line-through/)

    // 9. Verificar total no carrinho atualizado
    await expect(page.locator('[data-testid="total-carrinho"]')).toHaveText('R$ 7.50')
  })

  test('Cenário 2: Resiliência Offline (PWA)', async ({ page, context }) => {
    await page.goto('/')

    // Alternar para modo execução (onde QuickAdd está disponível)
    await page.locator('[data-testid="toggle-mode"]').click()
    await expect(page.locator('[data-testid="input-quick-add"]')).toBeVisible()

    // Aguardar registro do Service Worker
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null)

    // Cortar conexão de rede
    await context.setOffline(true)

    // Recarregar a página — deve vir do cache do SW
    await page.reload()
    // Aguardar o app shell renderizar — prova que o SW serviu o conteúdo offline
    await expect(page.locator('text=SmartCheck').first()).toBeVisible({ timeout: 15000 })
    // Alternar para modo execução (não é persistido entre reloads)
    await page.locator('[data-testid="toggle-mode"]').click()
    await expect(page.locator('[data-testid="input-quick-add"]')).toBeVisible({ timeout: 5000 })

    // Adicionar item via QuickAdd (IndexedDB funciona offline)
    await page.locator('[data-testid="input-quick-add"]').fill('Leite Offline')
    await page.locator('[data-testid="select-quick-category"]').selectOption('1')
    await page.locator('[data-testid="btn-quick-add"]').click()

    // Expandir accordion e verificar o item
    await page.locator('[data-testid="accordion-1"]').click()
    await expect(page.locator('text=Leite Offline').first()).toBeVisible()
  })

  test('Cenário 3: Persistência Atômica no IndexedDB', async ({ page, context }) => {
    await page.goto('/')

    // Adicionar um item no modo Edição
    await page.locator('[data-testid="input-item-name"]').first().fill('Arroz Persistente')
    await page.locator('[data-testid="btn-add-item"]').first().click()

    // Confirmar que o item está visível
    await expect(page.locator('text=Arroz Persistente').first()).toBeVisible()

    // Fechar abruptamente a aba
    await page.close()

    // Abrir nova aba no mesmo contexto e navegar de volta
    const newPage = await context.newPage()
    await newPage.goto('/')

    // Verificar que o item ainda está na lista (Dexie/IndexedDB persistiu)
    await expect(newPage.locator('text=Arroz Persistente').first()).toBeVisible({ timeout: 5000 })

    await newPage.close()
  })
})
