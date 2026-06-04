<script setup>
import { ref } from 'vue'
import { Check } from '@lucide/vue'
import { useDb } from '../composables/useDb'
import { useToast } from '../composables/useToast'
import { formatCurrency } from '../utils/format'

const props = defineProps({
  item: { type: Object, required: true },
})

const emit = defineEmits(['updated'])

const { toggleCheck, updatePrice } = useDb()
const { success } = useToast()

const editingPrice = ref(false)
const priceBuffer = ref(0)

async function handleCheck() {
  const wasChecked = props.item.isChecked
  await toggleCheck(props.item.id)
  emit('updated')
  success(wasChecked ? 'Item desmarcado!' : 'Item marcado!')
}

function startPriceEdit() {
  priceBuffer.value = props.item.price
  editingPrice.value = true
}

async function confirmPrice() {
  await updatePrice(props.item.id, priceBuffer.value)
  editingPrice.value = false
  emit('updated')
  success('Preço atualizado!')
}

function cancelPriceEdit() {
  editingPrice.value = false
}
</script>

<template>
  <div
    class="flex items-center gap-3 px-4 py-2.5 transition-all duration-200"
    :class="{ 'opacity-50': item.isChecked }"
  >
    <input
      data-testid="checkbox-item"
      type="checkbox"
      :checked="!!item.isChecked"
      @change="handleCheck"
      class="size-5 rounded cursor-pointer transition-transform duration-150 hover:scale-110"
      style="accent-color: var(--color-brand);"
    />

    <span
      data-testid="item-name"
      class="flex-1 text-sm font-medium"
      :class="{ 'line-through': item.isChecked }"
      :style="{ color: item.isChecked ? '#9ca3af' : 'var(--color-text)' }"
    >
      {{ item.name }}
    </span>

    <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#f3f4f6] text-[#6b7280]">
      {{ item.quantity }}x
    </span>

    <div class="relative">
      <template v-if="editingPrice">
        <div class="flex items-center gap-1">
          <span class="text-xs text-[#9ca3af]">R$</span>
          <input
            data-testid="input-item-price"
            v-model="priceBuffer"
            type="number"
            min="0"
            step="0.01"
            class="w-16 px-1 py-0.5 text-sm rounded text-right focus:outline-none border-2 transition-colors"
            style="border-color: var(--color-brand);"
            autofocus
            @keyup.enter="confirmPrice"
            @keyup.escape="cancelPriceEdit"
          />
          <button
            data-testid="btn-confirm-price"
            @click="confirmPrice"
            class="font-bold transition-colors text-[var(--color-brand)] hover:text-[#006666]"
          >
            <Check class="size-4" />
          </button>
        </div>
      </template>
      <template v-else>
        <button
          data-testid="price-display"
          @click="startPriceEdit"
          class="text-sm font-bold cursor-pointer transition-colors duration-150"
          :class="[
            { 'line-through': item.isChecked },
            !editingPrice ? 'hover:text-[var(--color-brand)]' : ''
          ]"
          :style="{ color: 'var(--color-text)' }"
        >
          {{ formatCurrency(item.price || 0) }}
        </button>
      </template>
    </div>
  </div>
</template>
