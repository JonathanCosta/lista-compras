<script setup>
import { ref, onMounted } from 'vue'
import { Plus } from '@lucide/vue'
import { useDb } from '../composables/useDb'
import { useToast } from '../composables/useToast'

const { getCategories, addItem } = useDb()
const { success } = useToast()

const categories = ref([])
const name = ref('')
const categoryId = ref(null)

const emit = defineEmits(['added'])

onMounted(async () => {
  categories.value = await getCategories()
  if (categories.value.length > 0) {
    categoryId.value = categories.value[0].id
  }
})

async function handleAdd() {
  if (!name.value.trim() || !categoryId.value) return
  await addItem({ categoryId: categoryId.value, name: name.value, quantity: 1, price: 0 })
  name.value = ''
  emit('added')
  success('Item adicionado!')
}
</script>

<template>
  <div class="flex gap-2">
    <input
      v-model="name"
      data-testid="input-quick-add"
      placeholder="Adicionar item..."
      class="flex-1 px-3 py-2 border border-[#d1d5db] rounded-lg text-sm focus:outline-none transition-colors focus:border-[var(--color-brand)]"
      @keyup.enter="handleAdd"
    >
    <select
      v-model="categoryId"
      data-testid="select-quick-category"
      class="px-2 py-2 border border-[#d1d5db] rounded-lg text-sm focus:outline-none transition-colors bg-white focus:border-[var(--color-brand)]"
    >
      <option
        v-for="cat in categories"
        :key="cat.id"
        :value="cat.id"
      >
        {{ cat.name }}
      </option>
    </select>
    <button
      data-testid="btn-quick-add"
      class="px-3 py-2 rounded-lg text-white font-bold transition-all duration-200 bg-[var(--color-brand)] hover:bg-[var(--color-text)]"
      aria-label="Adicionar item"
      @click="handleAdd"
    >
      <Plus class="size-5" />
    </button>
  </div>
</template>
