<script setup>
import { CircleCheck, CircleX } from '@lucide/vue'
import { useToast } from '../composables/useToast'

const { toasts } = useToast()
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-full max-w-xs pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium"
          :style="{
            backgroundColor: '#ffffff',
            borderColor: t.type === 'success' ? 'var(--color-brand)' : '#ef4444',
            borderLeftWidth: '4px',
            color: 'var(--color-text)',
          }"
        >
          <CircleCheck
            v-if="t.type === 'success'"
            class="size-5 shrink-0"
            style="color: var(--color-brand);"
          />
          <CircleX
            v-else
            class="size-5 shrink-0"
            style="color: #ef4444;"
          />
          <span>{{ t.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-move {
  transition: transform 0.3s ease;
}
.toast-enter-active {
  transition: all 0.3s ease-out;
}
.toast-leave-active {
  position: absolute;
  left: 1rem;
  right: 1rem;
  transition: all 0.2s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-1rem);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}
</style>
