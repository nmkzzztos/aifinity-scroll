declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

declare module 'markdown-it-katex' {
  import type MarkdownIt from 'markdown-it'

  const markdownItKatex: MarkdownIt.PluginSimple
  export default markdownItKatex
}
