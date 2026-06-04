<script setup>
import { ref } from 'vue'
import { Download, Upload, Share2, ShoppingCart, Edit3 } from '@lucide/vue'
import { useMode } from '../composables/useMode'
import { useDb } from '../composables/useDb'
import { useToast } from '../composables/useToast'
import { useConfirm } from '../composables/useConfirm'
import { formatShareText } from '../utils/format'

const { mode, toggleMode } = useMode()
const { exportToJSON, importFromJSON } = useDb()
const { success, error } = useToast()
const confirm = useConfirm()

const emit = defineEmits(['imported'])
const fileInput = ref(null)

async function shareList() {
  const data = await exportToJSON()
  const text = formatShareText(data.categories, data.items)
  if (navigator.share) {
    await navigator.share({ title: 'SmartCheck - Minha Lista', text })
  } else {
    await navigator.clipboard.writeText(text)
    success('Lista copiada para a área de transferência!')
  }
}

async function exportBackup() {
  const data = await exportToJSON()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `smartcheck-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function triggerImport() {
  fileInput.value.click()
}

async function handleImport(e) {
  const file = e.target.files[0]
  if (!file) return
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    if (!data.categories || !data.items) throw new Error('Formato inválido')
    if (!await confirm.show('Importar irá sobrescrever todos os dados atuais. Continuar?')) return
    await importFromJSON(data)
    emit('imported')
    success('Dados importados com sucesso!')
  } catch (err) {
    error('Erro ao importar: ' + err.message)
  }
  e.target.value = ''
}
</script>

<template>
  <header class="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
    <div class="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <img src="/favicon.svg" alt="SmartCheck" class="size-7" />
        <div class="flex flex-col leading-tight">
          <h1 class="text-base font-extrabold" style="color: var(--color-brand);">SmartCheck</h1>
          <span class="text-[10px] font-medium tracking-tight text-gray-400">Compras Inteligentes</span>
        </div>
      </div>

      <div class="flex items-center gap-1">
        <button
          data-testid="toggle-mode"
          @click="toggleMode"
          :style="mode === 'edit'
            ? { backgroundColor: 'var(--color-brand)', color: '#ffffff' }
            : { backgroundColor: '#FFD700', color: '#333333' }"
          class="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200"
          :aria-label="mode === 'edit' ? 'Alternar para modo execução' : 'Alternar para modo edição'"
        >
          <Edit3 v-if="mode === 'edit'" class="size-4" />
          <ShoppingCart v-else class="size-4" />
          {{ mode === 'edit' ? 'Edição' : 'Compras' }}
        </button>

        <button
          data-testid="share-btn"
          @click="shareList"
          class="p-2 rounded-lg transition-colors duration-150 hover:text-[var(--color-brand)]"
          style="color: #999;"
          aria-label="Compartilhar lista"
        >
          <Share2 class="size-5" />
        </button>

        <button
          data-testid="export-btn"
          @click="exportBackup"
          class="p-2 rounded-lg transition-colors duration-150 hover:text-[var(--color-brand)]"
          style="color: #999;"
          aria-label="Exportar backup"
          title="Exportar backup"
        >
          <Download class="size-5" />
        </button>

        <input
          ref="fileInput"
          type="file"
          accept=".json"
          class="hidden"
          @change="handleImport"
        />
        <button
          data-testid="import-btn"
          @click="triggerImport"
          class="p-2 rounded-lg transition-colors duration-150 hover:text-[var(--color-brand)]"
          style="color: #999;"
          aria-label="Importar backup"
          title="Importar backup"
        >
          <Upload class="size-5" />
        </button>
      </div>
    </div>
  </header>
</template>
