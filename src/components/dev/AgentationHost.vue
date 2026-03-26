<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { createElement, type ComponentType } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Agentation, type AgentationProps } from 'agentation'

const host = ref<HTMLDivElement | null>(null)
let root: Root | null = null

const agentationProps: AgentationProps = {
  endpoint: 'http://localhost:4747',
  onSessionCreated: (sessionId: string) => {
    console.log('Session started:', sessionId)
  },
}

onMounted(() => {
  const el = host.value
  if (!el) return
  root = createRoot(el)
  root.render(
    createElement(Agentation as ComponentType<AgentationProps>, agentationProps)
  )
})

onUnmounted(() => {
  root?.unmount()
  root = null
})
</script>

<template>
  <div ref="host" class="agentation-host" aria-hidden="true" />
</template>
