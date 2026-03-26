<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const props = defineProps<{
  blockId: string
  label: string
  html: string
  selected: boolean
  interactive: boolean
  /** One continuous article: no card chrome, no visible section label */
  embedded?: boolean
}>()

const emit = defineEmits<{
  select: [blockId: string]
}>()

const tuneWrap = ref<HTMLElement | null>(null)

function onDocPointerDown(event: PointerEvent) {
  if (!props.selected || !tuneWrap.value) {
    return
  }

  if (tuneWrap.value.contains(event.target as Node)) {
    return
  }

  emit('select', props.blockId)
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointerDown, true)
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocPointerDown, true)
})
</script>

<template>
  <article
    class="article-block"
    :class="{
      'article-block--selected': selected,
      'article-block--interactive': interactive,
      'article-block--embedded': embedded,
    }"
  >
    <span class="visually-hidden">{{ label }}</span>

    <template v-if="embedded">
      <div v-if="interactive" ref="tuneWrap" class="article-block__tune article-block__tune--floating">
        <button
          class="article-block__button"
          type="button"
          :aria-expanded="selected"
          aria-haspopup="dialog"
          :aria-controls="`tune-panel-${blockId}`"
          @click="emit('select', blockId)"
        >
          {{ selected ? 'Close' : 'Tune' }}
        </button>

        <div
          v-if="selected"
          :id="`tune-panel-${blockId}`"
          class="article-block__dropdown"
          role="dialog"
          aria-label="Block tools"
          @click.stop
        >
          <slot name="tune" />
        </div>
      </div>

      <div
        class="markdown article-block__body"
        :class="{ 'article-block__body--with-tune': interactive }"
        v-html="html"
      />
    </template>

    <template v-else>
      <div class="article-block__topline">
        <span class="article-block__label">{{ label }}</span>
        <div v-if="interactive" ref="tuneWrap" class="article-block__tune">
          <button
            class="article-block__button"
            type="button"
            :aria-expanded="selected"
            aria-haspopup="dialog"
            :aria-controls="`tune-panel-${blockId}`"
            @click="emit('select', blockId)"
          >
            {{ selected ? 'Close' : 'Tune block' }}
          </button>

          <div
            v-if="selected"
            :id="`tune-panel-${blockId}`"
            class="article-block__dropdown"
            role="dialog"
            aria-label="Block tools"
            @click.stop
          >
            <slot name="tune" />
          </div>
        </div>
      </div>

      <div class="markdown article-block__body" v-html="html" />
    </template>
  </article>
</template>

<style scoped>
.article-block {
  position: relative;
  display: grid;
  gap: 0.95rem;
  border: 1px solid rgba(64, 78, 71, 0.12);
  border-radius: 1.4rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.68);
  min-width: 0;
  max-width: 100%;
  overflow: visible;
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease,
    background-color 180ms ease;
}

.article-block--embedded {
  gap: 0;
  border: none;
  border-radius: 0;
  padding: 0.65rem 0;
  background: transparent;
  box-shadow: none;
}

.article-block--embedded:not(:last-child) {
  padding-bottom: 0.5rem;
}

.article-block--embedded + .article-block--embedded {
  padding-top: 0.5rem;
}

.article-block--interactive:not(.article-block--embedded) {
  cursor: pointer;
}

.article-block--embedded.article-block--interactive {
  cursor: default;
}

.article-block--selected:not(.article-block--embedded) {
  border-color: rgba(31, 49, 40, 0.34);
  background: rgba(239, 242, 234, 0.95);
  box-shadow: 0 16px 28px rgba(18, 24, 21, 0.08);
  transform: translateY(-1px);
}

.article-block--embedded.article-block--selected {
  margin: 0 -0.35rem;
  padding-left: 0.35rem;
  padding-right: 0.35rem;
  border-radius: 0.65rem;
  background: rgba(239, 242, 234, 0.65);
  box-shadow: inset 0 0 0 1px rgba(31, 49, 40, 0.18);
}

.article-block__topline {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.8rem;
  min-width: 0;
}

.article-block__label {
  color: rgba(24, 32, 29, 0.5);
  font-size: 0.77rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  min-width: 0;
  overflow-wrap: anywhere;
}

.article-block__tune {
  position: relative;
  z-index: 40;
  flex-shrink: 0;
}

.article-block__tune--floating {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 40;
}

.article-block__body--with-tune {
  padding-right: 4.75rem;
}

.article-block__button {
  border: 0;
  border-radius: 999px;
  background: rgba(31, 49, 40, 0.08);
  color: #1f3128;
  padding: 0.45rem 0.75rem;
  font-size: 0.82rem;
  transition:
    opacity 160ms ease,
    background 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.article-block--embedded.article-block--interactive .article-block__button {
  box-shadow: 0 0 0 1px transparent;
}

@media (hover: hover) and (pointer: fine) {
  .article-block--embedded.article-block--interactive .article-block__button {
    opacity: 0;
  }

  .article-block--embedded.article-block--interactive:hover .article-block__button,
  .article-block--embedded.article-block--interactive:focus-within .article-block__button,
  .article-block--embedded.article-block--selected .article-block__button {
    opacity: 1;
  }

  .article-block--embedded.article-block--interactive:hover .article-block__button,
  .article-block--embedded.article-block--interactive:focus-within .article-block__button {
    background: rgba(31, 49, 40, 0.12);
    box-shadow: 0 0 0 1px rgba(31, 49, 40, 0.14);
  }
}

@media (hover: none) {
  .article-block--embedded.article-block--interactive .article-block__button {
    opacity: 1;
    background: rgba(31, 49, 40, 0.1);
    box-shadow: 0 0 0 1px rgba(31, 49, 40, 0.12);
  }
}

.article-block__dropdown {
  position: absolute;
  right: 0;
  bottom: calc(100% + 0.45rem);
  left: auto;
  width: min(17.5rem, calc(100vw - 2rem));
  max-width: none;
  box-sizing: border-box;
  max-height: min(55vh, 24rem);
  overflow-x: hidden;
  overflow-y: auto;
  padding: 0.55rem 0.65rem;
  border-radius: 0.9rem;
  border: 1px solid rgba(64, 78, 71, 0.14);
  background: rgba(255, 255, 255, 0.99);
  box-shadow:
    0 2px 4px rgba(18, 24, 21, 0.05),
    0 16px 36px rgba(18, 24, 21, 0.12);
  -webkit-overflow-scrolling: touch;
  animation: tune-dropdown-in 160ms ease;
}

.article-block__body {
  min-width: 0;
  overflow-x: hidden;
}

@keyframes tune-dropdown-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 420px) {
  .article-block__dropdown {
    right: 0;
    left: auto;
    width: min(17.5rem, calc(100vw - 1.5rem));
  }

  .article-block__body--with-tune {
    padding-right: 4.25rem;
  }
}
</style>
