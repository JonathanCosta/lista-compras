<script setup>
import { useMode } from './composables/useMode'
import NavBar from './components/NavBar.vue'
import FooterTotals from './components/FooterTotals.vue'
import EditMode from './components/EditMode.vue'
import ExecutionMode from './components/ExecutionMode.vue'
import Toast from './components/Toast.vue'
import ConfirmModal from './components/ConfirmModal.vue'

const { mode } = useMode()
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background-color: var(--color-bg);">
    <NavBar />
    <main class="flex-1">
      <EditMode v-if="mode === 'edit'" />
      <ExecutionMode v-else />
    </main>
    <FooterTotals />
    <Toast />
    <ConfirmModal />
  </div>
</template>
