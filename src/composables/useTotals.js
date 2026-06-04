import { liveQuery } from 'dexie'
import { ref, onMounted, onUnmounted } from 'vue'
import db from '../database/db'

export function useTotals() {
  const totalPrevisto = ref(0)
  const totalNoCarrinho = ref(0)

  let subscription

  onMounted(() => {
    const observable = liveQuery(() => db.items.toArray())
    subscription = observable.subscribe({
      next: (items) => {
        totalPrevisto.value = items.reduce(
          (acc, i) => acc + (i.price || 0) * (i.quantity || 0), 0
        )
        totalNoCarrinho.value = items
          .filter(i => i.isChecked)
          .reduce((acc, i) => acc + (i.price || 0) * (i.quantity || 0), 0)
      },
      error: (err) => console.error('liveQuery error:', err),
    })
  })

  onUnmounted(() => {
    if (subscription) subscription.unsubscribe()
  })

  return { totalPrevisto, totalNoCarrinho }
}
