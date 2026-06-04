<script setup>
import { ref, onMounted } from 'vue'
import { useDb } from '../composables/useDb'
import CategoryAccordion from './CategoryAccordion.vue'
import QuickAdd from './QuickAdd.vue'

const { getCategories, getItemsByCategory } = useDb()

const loading = ref(true)
const categories = ref([])
const itemsByCategory = ref({})
const openCategoryId = ref(null)

async function loadData() {
  loading.value = true
  categories.value = await getCategories()
  for (const cat of categories.value) {
    itemsByCategory.value[cat.id] = await getItemsByCategory(cat.id)
  }
  loading.value = false
}

onMounted(loadData)

function toggleCategory(id) {
  openCategoryId.value = openCategoryId.value === id ? null : id
}
</script>

<template>
  <div v-if="loading" class="max-w-lg mx-auto px-4 pb-24 pt-4 text-center text-sm" style="color: #9ca3af;">
    Carregando...
  </div>
  <div v-else class="max-w-lg mx-auto px-4 pb-24 pt-4 space-y-3">
    <div class="flex items-center gap-2 mb-4">
      <span class="w-1 h-5 rounded-full" style="background-color: var(--color-brand);"></span>
      <span class="text-xs font-bold uppercase tracking-wider" style="color: var(--color-brand);">Modo Compras</span>
    </div>

    <QuickAdd @added="loadData" />

    <CategoryAccordion
      v-for="cat in categories"
      :key="cat.id"
      :category="cat"
      :items="itemsByCategory[cat.id] || []"
      :is-open="openCategoryId === cat.id"
      @toggle="toggleCategory"
      @updated="loadData"
    />
  </div>
</template>
