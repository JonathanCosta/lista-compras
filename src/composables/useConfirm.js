import { ref } from 'vue'

const dialog = ref({ visible: false, message: '' })
let resolver = null

export function useConfirm() {
  async function show(message) {
    if (resolver) return false
    dialog.value = { visible: true, message }
    return new Promise(resolve => {
      resolver = resolve
    })
  }

  function confirm() {
    if (!resolver) return
    resolver(true)
    cleanup()
  }

  function cancel() {
    if (!resolver) return
    resolver(false)
    cleanup()
  }

  function cleanup() {
    dialog.value = { visible: false, message: '' }
    resolver = null
  }

  return { dialog, show, confirm, cancel }
}
