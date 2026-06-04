import { ref } from 'vue'

const mode = ref('edit')

export function useMode() {
  function toggleMode() {
    mode.value = mode.value === 'edit' ? 'execute' : 'edit'
  }

  return { mode, toggleMode }
}
