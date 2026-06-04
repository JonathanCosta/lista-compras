<script setup>
import { ref, onMounted } from 'vue'
import { Trash2, Plus, Check, ShoppingBag } from '@lucide/vue'
import { useDb } from '../composables/useDb'
import { useToast } from '../composables/useToast'
import { useConfirm } from '../composables/useConfirm'
import { formatCurrency } from '../utils/format'

const { getCategories, getItemsByCategory, addItem, updateItem, deleteItem, addCategory, renameCategory, deleteCategory, uncheckAll, getAllItems } = useDb()
const { success } = useToast()
const confirm = useConfirm()

const loading = ref(true)
const categories = ref([])
const itemsByCategory = ref({})
const newItemNames = ref({})
const newCategoryName = ref('')
const editingCategory = ref(null)
const editingCategoryName = ref('')

async function loadData() {
  categories.value = await getCategories()
  const allItems = await getAllItems()
  itemsByCategory.value = {}
  for (const cat of categories.value) {
    itemsByCategory.value[cat.id] = allItems.filter(i => i.categoryId === cat.id)
  }
  loading.value = false
}

onMounted(loadData)

async function handleAddItem(categoryId) {
  const name = newItemNames.value[categoryId]
  if (!name?.trim()) return
  await addItem({
    categoryId,
    name: name.trim(),
    quantity: 1,
    price: 0,
  })
  newItemNames.value[categoryId] = ''
  await loadData()
  success('Item adicionado!')
}

async function handleUpdateItem(itemId, field, value) {
  await updateItem(itemId, { [field]: value })
  await loadData()
}

async function handleDeleteItem(id) {
  await deleteItem(id)
  await loadData()
  success('Item excluído!')
}

async function handleAddCategory() {
  if (!newCategoryName.value.trim()) return
  await addCategory(newCategoryName.value)
  newCategoryName.value = ''
  await loadData()
  success('Categoria adicionada!')
}

function startRename(cat) {
  editingCategory.value = cat.id
  editingCategoryName.value = cat.name
}

async function handleRename() {
  if (!editingCategoryName.value.trim()) return
  await renameCategory(editingCategory.value, editingCategoryName.value)
  editingCategory.value = null
  editingCategoryName.value = ''
  await loadData()
  success('Categoria renomeada!')
}

async function handleDeleteCategory(id) {
  if (!await confirm.show('Excluir esta categoria e todos os seus itens?')) return
  await deleteCategory(id)
  await loadData()
  success('Categoria excluída!')
}

async function handleUncheckAll() {
  if (!await confirm.show('Desmarcar todos os itens da lista?')) return
  await uncheckAll()
  await loadData()
  success('Todos os itens foram desmarcados!')
}
</script>

<template>
  <div v-if="loading" class="max-w-lg mx-auto px-4 pb-24 pt-4 text-center text-sm" style="color: #9ca3af;">
    Carregando...
  </div>
  <div v-else class="max-w-lg mx-auto px-4 pb-24 pt-4 space-y-6">
    <div class="flex items-center gap-2 mb-2">
      <span class="w-1 h-5 rounded-full" style="background-color: var(--color-gold);"></span>
      <span class="text-xs font-bold uppercase tracking-wider" style="color: var(--color-gold);">Modo Edição</span>
    </div>

    <div class="flex gap-2">
      <button
        data-testid="btn-uncheck-all"
        @click="handleUncheckAll"
        class="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 shadow-sm bg-[var(--color-brand)] text-white hover:bg-[#006666]"
      >
        <div class="flex items-center justify-center gap-2">
          <ShoppingBag class="size-4" />
          Desmarcar Todos
        </div>
      </button>
    </div>

    <div class="flex gap-2">
      <input
        data-testid="input-category-name"
        v-model="newCategoryName"
        placeholder="Nova categoria..."
        class="flex-1 px-3 py-2 border border-[#d1d5db] rounded-lg text-sm focus:outline-none focus:border-[var(--color-brand)]"
        @keyup.enter="handleAddCategory"
      />
      <button
        data-testid="btn-add-category"
        @click="handleAddCategory"
        class="px-3 py-2 rounded-lg text-white font-bold transition-all duration-200 bg-[var(--color-brand)] hover:bg-[#006666]"
        aria-label="Adicionar categoria"
      >
        <Plus class="size-5" />
      </button>
    </div>

    <div v-for="cat in categories" :key="cat.id" :data-testid="'category-' + cat.id" class="rounded-lg shadow-sm border border-[#e5e7eb] overflow-hidden bg-white">
      <div class="px-4 py-3 border-b border-[#e5e7eb] flex items-center justify-between bg-[#f9fafb]">
        <div class="flex items-center gap-2 flex-1">
          <template v-if="editingCategory === cat.id">
            <input
              data-testid="input-rename-category"
              v-model="editingCategoryName"
              class="flex-1 px-2 py-1 border border-[#d1d5db] rounded text-sm focus:outline-none focus:border-[var(--color-brand)]"
              @keyup.enter="handleRename"
              @keyup.escape="editingCategory = null"
              autofocus
            />
            <button data-testid="btn-confirm-rename" @click="handleRename" class="font-bold text-[var(--color-brand)]">
              <Check class="size-4" />
            </button>
          </template>
          <template v-else>
            <span class="font-bold" style="color: var(--color-text);">{{ cat.name }}</span>
            <button
              data-testid="btn-start-rename"
              @click="startRename(cat)"
              class="text-xs font-medium transition-colors text-[#9ca3af] hover:text-[var(--color-brand)]"
              aria-label="Renomear"
            >
              [renomear]
            </button>
          </template>
        </div>
        <button
          data-testid="btn-delete-category"
          @click="handleDeleteCategory(cat.id)"
          :disabled="!cat.isEditable"
          class="p-1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-[#9ca3af]"
          :class="{ 'hover:text-red-500': cat.isEditable }"
          aria-label="Excluir categoria"
        >
          <Trash2 class="size-4" />
        </button>
      </div>

      <div class="divide-y divide-[#f3f4f6]">
        <div
          v-for="item in (itemsByCategory[cat.id] || [])"
          :key="item.id"
          :data-testid="'item-row-' + item.id"
          class="px-4 py-2.5 flex items-center gap-3"
        >
          <input
            type="checkbox"
            :checked="!!item.isChecked"
            class="size-4 rounded cursor-pointer"
            style="accent-color: var(--color-brand);"
          />
          <span class="flex-1 text-sm" style="color: var(--color-text);">{{ item.name }}</span>
          <div class="flex items-center gap-1">
            <input
              data-testid="input-item-qty"
              type="number"
              :value="item.quantity"
              min="0"
              title="Quantidade"
              class="w-12 px-1 py-1 text-sm border border-[#e5e7eb] rounded text-center focus:outline-none transition-colors focus:border-[#FFD700]"
              @change="handleUpdateItem(item.id, 'quantity', ($event.target).value)"
            />
            <span class="text-xs font-bold text-[#9ca3af]">×</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="text-xs font-bold text-[#9ca3af]">R$</span>
            <input
              data-testid="input-item-price"
              type="number"
              :value="item.price"
              min="0"
              step="0.01"
              title="Preço"
              class="w-16 px-1 py-1 text-sm border border-[#e5e7eb] rounded text-right focus:outline-none transition-colors focus:border-[var(--color-brand)]"
              @change="handleUpdateItem(item.id, 'price', ($event.target).value)"
            />
          </div>
          <button
            data-testid="btn-delete-item"
            @click="handleDeleteItem(item.id)"
            class="p-1 transition-colors text-[#9ca3af] hover:text-red-500"
            aria-label="Excluir item"
          >
            <Trash2 class="size-4" />
          </button>
        </div>
      </div>

      <div class="px-4 py-2 border-t border-[#e5e7eb] bg-[#f9fafb]">
        <div class="flex gap-2">
          <input
            data-testid="input-item-name"
            v-model="newItemNames[cat.id]"
            :placeholder="'Adicionar em ' + cat.name + '...'"
            class="flex-1 px-2 py-1.5 text-sm border border-[#e5e7eb] rounded focus:outline-none focus:border-[var(--color-brand)]"
            @keyup.enter="handleAddItem(cat.id)"
          />
          <button
            data-testid="btn-add-item"
            @click="handleAddItem(cat.id)"
            class="px-2 py-1.5 rounded font-bold text-white transition-all text-sm bg-[var(--color-brand)] hover:bg-[#006666]"
            aria-label="Adicionar item"
          >
            <Plus class="size-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
