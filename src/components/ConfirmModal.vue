<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useConfirm } from '../composables/useConfirm'

const { dialog, confirm, cancel } = useConfirm()

function onKeydown(e) {
  if (e.key === 'Escape') cancel()
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  cancel()
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="dialog.visible"
      class="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      style="background-color: rgba(0, 0, 0, 0.4);"
      @click.self="cancel"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-message"
        class="w-full max-w-sm rounded-xl shadow-2xl border-t-4 overflow-hidden"
        style="background-color: #ffffff; border-top-color: var(--color-brand);"
      >
        <div class="px-5 pt-5 pb-2">
          <p
            id="confirm-message"
            class="text-sm leading-relaxed"
            style="color: var(--color-text);"
          >
            {{ dialog.message }}
          </p>
        </div>
        <div class="flex gap-3 px-5 pb-5 pt-3">
          <button
            autofocus
            class="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 border border-[#d1d5db] text-[#6b7280] bg-[#f9fafb] hover:bg-[#f3f4f6]"
            @click="cancel"
          >
            Cancelar
          </button>
          <button
            class="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 text-white bg-[var(--color-brand)] hover:bg-[var(--color-text)]"
            @click="confirm"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
