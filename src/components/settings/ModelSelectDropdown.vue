<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useTemplateRef } from 'vue'

import type { OpenRouterModelPreset } from '@/types/models'

const props = defineProps<{
  modelValue: string
  presets: OpenRouterModelPreset[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const open = ref(false)
const root = useTemplateRef<HTMLElement>('root')

const selected = computed(
  () => props.presets.find((p) => p.id === props.modelValue) ?? props.presets[0],
)

function toggle() {
  open.value = !open.value
}

function choose(id: string) {
  emit('update:modelValue', id)
  open.value = false
}

function onDocPointerDown(event: PointerEvent) {
  const target = event.target as Node
  if (root.value?.contains(target)) {
    return
  }
  open.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    open.value = false
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointerDown)
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocPointerDown)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="root" class="model-dropdown" :class="{ 'model-dropdown--open': open }">
    <button
      type="button"
      class="input model-dropdown__trigger"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="toggle"
    >
      <img class="model-dropdown__icon" :src="selected.icon" alt="" width="22" height="22" />
      <span class="model-dropdown__text">
        <span class="model-dropdown__name">{{ selected.label }}</span>
        <span class="model-dropdown__id">{{ selected.id }}</span>
      </span>
      <span class="model-dropdown__caret" aria-hidden="true" />
    </button>

    <Transition name="model-dropdown">
      <ul v-show="open" class="model-dropdown__menu" role="listbox">
        <li v-for="preset in presets" :key="preset.id" role="presentation">
          <button
            type="button"
            class="model-dropdown__option"
            :class="{ 'model-dropdown__option--active': modelValue === preset.id }"
            role="option"
            :aria-selected="modelValue === preset.id"
            @click="choose(preset.id)"
          >
            <img class="model-dropdown__icon model-dropdown__icon--row" :src="preset.icon" alt="" width="26" height="26" />
            <span class="model-dropdown__text">
              <span class="model-dropdown__name">{{ preset.label }}</span>
              <span class="model-dropdown__id">{{ preset.id }}</span>
            </span>
          </button>
        </li>
      </ul>
    </Transition>
  </div>
</template>

<style scoped>
.model-dropdown {
  position: relative;
  width: 100%;
}

.model-dropdown__trigger {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding-right: 2.35rem;
  cursor: pointer;
  text-align: left;
}

.model-dropdown__text {
  display: grid;
  gap: 0.12rem;
  min-width: 0;
  flex: 1;
}

.model-dropdown__name {
  font-weight: 600;
  font-size: 0.92rem;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-dropdown__id {
  font-size: 0.68rem;
  color: var(--color-ink-faint);
  font-family: ui-monospace, 'Cascadia Code', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-dropdown__icon {
  display: block;
  flex-shrink: 0;
  border-radius: 0.45rem;
}

.model-dropdown__icon--row {
  border-radius: 0.5rem;
}

.model-dropdown__caret {
  position: absolute;
  right: 1rem;
  top: 50%;
  width: 0.45rem;
  height: 0.45rem;
  margin-top: -0.2rem;
  border-right: 1.5px solid var(--color-ink-muted);
  border-bottom: 1.5px solid var(--color-ink-muted);
  transform: rotate(45deg);
  opacity: 0.55;
  pointer-events: none;
}

.model-dropdown--open .model-dropdown__caret {
  margin-top: 0.05rem;
  transform: rotate(-135deg);
}

.model-dropdown__menu {
  position: absolute;
  z-index: 20;
  left: 0;
  right: 0;
  top: calc(100% + 0.35rem);
  margin: 0;
  padding: 0.35rem;
  list-style: none;
  border-radius: 1.1rem;
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.96);
  box-shadow:
    0 4px 24px rgba(13, 20, 17, 0.08),
    0 1px 2px rgba(13, 20, 17, 0.04);
  max-height: min(16.5rem, 52vh);
  overflow-y: auto;
}

.model-dropdown__option {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  padding: 0.55rem 0.65rem;
  border: 0;
  border-radius: 0.75rem;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s ease;
}

.model-dropdown__option:hover {
  background: rgba(31, 49, 40, 0.06);
}

.model-dropdown__option--active {
  background: rgba(31, 49, 40, 0.09);
}

.model-dropdown-enter-active,
.model-dropdown-leave-active {
  transition:
    opacity 0.14s ease,
    transform 0.14s ease;
}

.model-dropdown-enter-from,
.model-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem);
}
</style>
