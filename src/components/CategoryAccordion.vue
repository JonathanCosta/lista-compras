<script setup>
import { computed } from 'vue'
import { ChevronDown } from '@lucide/vue'
import ItemRow from './ItemRow.vue'

const props = defineProps({
  category: { type: Object, required: true },
  items: { type: Array, default: () => [] },
  isOpen: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle', 'updated'])

const sortedItems = computed(() => {
  return [...props.items].sort((a, b) => {
    if (a.isChecked !== b.isChecked) return a.isChecked - b.isChecked
    return a.name.localeCompare(b.name)
  })
})

const checkedCount = computed(() => props.items.filter(i => i.isChecked).length)
</script>

<template>
  <div class="rounded-lg shadow-sm border border-[#e5e7eb] overflow-hidden transition-all duration-200 bg-white">
    <button
      :data-testid="'accordion-' + category.id"
      :aria-expanded="isOpen"
      :aria-controls="'accordion-panel-' + category.id"
      class="w-full px-4 py-3 flex items-center justify-between transition-colors duration-150 bg-[#f9fafb] hover:bg-[#f0fdfa]"
      @click="emit('toggle', category.id)"
    >
      <div class="flex items-center gap-2">
        <span
          class="font-bold"
          style="color: var(--color-text);"
        >{{ category.name }}</span>
        <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#e5e7eb] text-[#6b7280]">
          {{ checkedCount }}/{{ items.length }}
        </span>
      </div>
      <ChevronDown
        class="size-4 transition-transform duration-200 text-[#9ca3af]"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <Transition
      @enter="(el) => { el.style.maxHeight = el.scrollHeight + 'px'; el.style.opacity = '1' }"
      @leave="(el) => { el.style.maxHeight = '0'; el.style.opacity = '0' }"
    >
      <div
        v-if="isOpen"
        :id="'accordion-panel-' + category.id"
        role="region"
        class="transition-all duration-200 ease-in-out overflow-hidden"
      >
        <div
          v-if="items.length === 0"
          data-testid="empty-category"
          class="px-4 py-3 text-sm text-center"
          style="color: #9ca3af;"
        >
          Nenhum item nesta categoria
        </div>
        <div
          v-else
          class="divide-y"
          style="border-color: #f3f4f6;"
        >
          <ItemRow
            v-for="item in sortedItems"
            :key="item.id"
            :item="item"
            @updated="emit('updated')"
          />
        </div>
      </div>
    </Transition>
  </div>
</template>
