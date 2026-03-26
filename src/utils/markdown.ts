import DOMPurify from 'dompurify'
import katex from 'katex'
import MarkdownIt from 'markdown-it'

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
})

const MATH_PLACEHOLDER_PREFIX = '@@CODXMATHSEG@@'
const COMMAND_PLACEHOLDER_PREFIX = '@@CODXLATEXCMD@@'

function normalizeEscapedLineBreaks(value: string): string {
  const commands: string[] = []
  const protectedCommands = value.replace(/\\[a-zA-Z]+/g, (command) => {
    const placeholder = `${COMMAND_PLACEHOLDER_PREFIX}${commands.length}@@`
    commands.push(command)
    return placeholder
  })

  const normalized = protectedCommands.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n')

  return normalized.replace(new RegExp(`${COMMAND_PLACEHOLDER_PREFIX}(\\d+)@@`, 'g'), (_, index: string) => {
    return commands[Number(index)] ?? ''
  })
}

function protectMathSegments(value: string): { text: string; placeholders: string[] } {
  const placeholders: string[] = []
  const text = value.replace(/\$\$[\s\S]+?\$\$|\$[^$\n]+\$/g, (segment) => {
    const placeholder = `${MATH_PLACEHOLDER_PREFIX}${placeholders.length}@@`
    placeholders.push(segment)
    return placeholder
  })

  return { text, placeholders }
}

function restoreMathSegments(value: string, placeholders: string[]): string {
  return value.replace(new RegExp(`${MATH_PLACEHOLDER_PREFIX}(\\d+)@@`, 'g'), (_, index: string) => {
    return placeholders[Number(index)] ?? ''
  })
}

function isMathStartToken(token: string): boolean {
  return /\\[a-zA-Z]+|[_^]/.test(token)
}

function isMathContinuationToken(token: string): boolean {
  if (!token || /[А-Яа-яЁё]/.test(token)) {
    return false
  }

  if (/^@@CODX(?:MATHSEG|LATEXCMD)@@\d+@@$/.test(token)) {
    return false
  }

  return /^[A-Za-z0-9\\{}()[\]|,+\-*/=<>.:;^_&]+$/.test(token)
}

function trimTrailingPunctuation(candidate: string): { body: string; trailing: string } {
  const match = candidate.match(/^(.*?)([.,;:!?]+)?$/)

  return {
    body: match?.[1] ?? candidate,
    trailing: match?.[2] ?? '',
  }
}

function wrapInlineMathRuns(value: string): string {
  const lines = value.split('\n')

  return lines
    .map((line) => {
      const segments = line.split(/(\s+)/)
      const result: string[] = []

      for (let index = 0; index < segments.length; index += 1) {
        const segment = segments[index]

        if (!segment || /^\s+$/.test(segment) || !isMathStartToken(segment)) {
          result.push(segment)
          continue
        }

        let candidate = segment
        let cursor = index

        while (result.length >= 2) {
          const lastItem = result[result.length - 1]
          const secondLastItem = result[result.length - 2]
          if (lastItem && secondLastItem && /^\s+$/.test(lastItem) && /^[A-Za-z0-9]$/.test(secondLastItem)) {
            candidate = secondLastItem + lastItem + candidate
            result.pop()
            result.pop()
          } else {
            break
          }
        }

        while (cursor + 2 < segments.length) {
          const spacer = segments[cursor + 1]
          const next = segments[cursor + 2]

          if (!/^\s+$/.test(spacer) || !isMathContinuationToken(next)) {
            break
          }

          candidate += spacer + next
          cursor += 2
        }

        const { body, trailing } = trimTrailingPunctuation(candidate.trim())
        result.push(body ? `$${body}$${trailing}` : candidate)
        index = cursor
      }

      return result.join('')
    })
    .join('\n')
}

function mergeAdjacentInlineMath(value: string): string {
  let current = value
  let previous = ''

  while (current !== previous) {
    previous = current
    current = current.replace(/\$([^$\n]+)\$\s+\$([^$\n]+)\$/g, (_, left: string, right: string) => {
      return `$${left.trim()} ${right.trim()}$`
    })
  }

  return current
}

function looksLikeStandaloneFormula(line: string): boolean {
  const trimmed = line.trim()

  if (!trimmed || trimmed.startsWith('$$') || trimmed.startsWith('$')) {
    return false
  }

  if (/^(#{1,6}\s|[-*]\s|\d+\.\s|>\s)/.test(trimmed)) {
    return false
  }

  if (/[А-Яа-яЁё]/.test(trimmed)) {
    return false
  }

  return /\\(?:mathbf|mathbb|cdot|sqrt|sum|frac|alpha|beta|gamma|theta|in|forall|exists|neq|leq|geq|dots|qquad|times|div|pm|mp|to|rightarrow|leftarrow|mid|det|text|operatorname|int|lim|infty|partial|nabla|prod|vec|hat|bar|circ|approx|sim|equiv|log|ln|sin|cos|tan|\|)|[_^]|=/.test(
    trimmed,
  )
}

function normalizeDisplayMathBlocks(value: string): string {
  const lines = value.split('\n')
  const normalizedLines: string[] = []
  let formulaBuffer: string[] = []

  function flushFormulaBuffer() {
    if (!formulaBuffer.length) {
      return
    }

    normalizedLines.push('$$')
    normalizedLines.push(...formulaBuffer.map((line) => line.trim().replace(/^\$\$|\$\$$/g, '').trim()))
    normalizedLines.push('$$')
    formulaBuffer = []
  }

  for (const rawLine of lines) {
    const trimmed = rawLine.trim()

    if (!trimmed) {
      flushFormulaBuffer()
      normalizedLines.push(rawLine)
      continue
    }

    const isEnvironmentLine = /\\begin\{[^}]+\}|\\end\{[^}]+\}/.test(trimmed)
    const isContinuationLine =
      formulaBuffer.length > 0 &&
      !/^(#{1,6}\s|[-*]\s|\d+\.\s|>\s)/.test(trimmed) &&
      !/[А-Яа-яЁё]/.test(trimmed)

    if (isEnvironmentLine || looksLikeStandaloneFormula(trimmed) || isContinuationLine) {
      formulaBuffer.push(trimmed)
      continue
    }

    flushFormulaBuffer()
    normalizedLines.push(rawLine)
  }

  flushFormulaBuffer()
  return normalizedLines.join('\n')
}

function normalizeMathDelimiters(value: string): string {
  const normalizedBrackets = normalizeEscapedLineBreaks(value)
    .replace(/\\\[((?:.|\n)*?)\\\]/g, (_, formula: string) => `$$${formula.trim()}$$`)
    .replace(/\\\(((?:.|\n)*?)\\\)/g, (_, formula: string) => `$${formula.trim()}$`)
  const normalizedBlocks = normalizeDisplayMathBlocks(normalizedBrackets)

  const { text, placeholders } = protectMathSegments(normalizedBlocks)
  const wrapped = wrapInlineMathRuns(text)
  const restored = restoreMathSegments(wrapped, placeholders)

  return mergeAdjacentInlineMath(restored)
}

const KATEX_PLACEHOLDER = '@@KATEXRENDER@@'

export function renderMarkdown(value: string): string {
  const normalized = normalizeMathDelimiters(value)

  const mathSegments: Array<{ source: string; display: boolean }> = []

  const withPlaceholders = normalized
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, formula: string) => {
      const idx = mathSegments.length
      mathSegments.push({ source: formula.trim(), display: true })
      return `\n\n${KATEX_PLACEHOLDER}${idx}@@\n\n`
    })
    .replace(/\$([^$\n]+)\$/g, (_, formula: string) => {
      const idx = mathSegments.length
      mathSegments.push({ source: formula.trim(), display: false })
      return `${KATEX_PLACEHOLDER}${idx}@@`
    })

  let html = markdown.render(withPlaceholders)

  html = html.replace(
    new RegExp(`<p>${KATEX_PLACEHOLDER}(\\d+)@@<\\/p>`, 'g'),
    (_, idx: string) => {
      const seg = mathSegments[Number(idx)]
      if (!seg) return ''
      try {
        return katex.renderToString(seg.source, { displayMode: true, throwOnError: false })
      } catch {
        return seg.source
      }
    },
  )

  html = html.replace(new RegExp(`${KATEX_PLACEHOLDER}(\\d+)@@`, 'g'), (_, idx: string) => {
    const seg = mathSegments[Number(idx)]
    if (!seg) return ''
    try {
      return katex.renderToString(seg.source, { displayMode: seg.display, throwOnError: false })
    } catch {
      return seg.source
    }
  })

  return DOMPurify.sanitize(html)
}
