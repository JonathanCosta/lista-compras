<script setup>
import { useTotals } from '../composables/useTotals'
import { formatCurrency } from '../utils/format'

const { totalPrevisto, totalNoCarrinho } = useTotals()
</script>

<template>
  <footer class="sticky bottom-0 z-50 border-t shadow-lg" style="background-color: #ffffff; border-color: #e5e7eb;">
    <div class="max-w-lg mx-auto px-4 py-3 flex justify-between items-center">
      <div class="text-sm">
        <span class="text-gray-500">Previsto: </span>
        <span data-testid="total-previsto" class="font-bold" style="color: var(--color-text);">{{ formatCurrency(totalPrevisto) }}</span>
      </div>
      <div class="text-sm flex items-center gap-2">
        <span class="w-2 h-2 rounded-full" style="background-color: var(--color-brand);"></span>
        <span class="text-gray-500">No carrinho: </span>
        <span data-testid="total-carrinho" class="font-bold" style="color: var(--color-brand);">{{ formatCurrency(totalNoCarrinho) }}</span>
      </div>
    </div>
  </footer>
</template>
