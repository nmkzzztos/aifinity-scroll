import { describe, expect, it } from 'vitest'

import { renderMarkdown } from '@/utils/markdown'

describe('renderMarkdown', () => {
  it('renders normal inline dollar math', () => {
    const html = renderMarkdown('Formula $a^2 + b^2 = c^2$ works.')

    expect(html).toContain('katex')
    expect(html).toContain('a')
  })

  it('repairs raw latex commands that are missing dollar delimiters', () => {
    const html = renderMarkdown(
      "Если k > 0, направление \\mathbf{v}' совпадает с направлением \\mathbf{v}.",
    )

    expect(html).toContain('katex')
    expect(html).toContain('mathbf')
  })

  it('repairs mixed expressions inside list-like markdown text', () => {
    const html = renderMarkdown(
      "1. Записать компоненты исходного вектора \\mathbf{v} = (v_1, v_2, \\dots, v_n).",
    )

    expect(html).toContain('katex')
    expect(html).toContain('v_1')
  })

  it('turns literal escaped newlines back into real markdown blocks', () => {
    const html = renderMarkdown('# Title\\n\\n## Section\\n\\n- item one\\n- item two')

    expect(html).toContain('<h1>Title</h1>')
    expect(html).toContain('<h2>Section</h2>')
    expect(html).toContain('<li>item one</li>')
  })

  it('does not break latex commands that start with \\t like \\text{}', () => {
    const html = renderMarkdown('$\\text{Functional concentration} = \\beta_0 + \\beta_1$')

    expect(html).toContain('katex')
    expect(html).toContain('Functional')
    expect(html).not.toContain('ext{')
  })

  it('does not leak internal placeholder markers into rendered html', () => {
    const html = renderMarkdown('$H_0$ and $H_1$ are separate math fragments.')

    expect(html).not.toContain('PLACEHOLDER')
    expect(html).not.toContain('CODXMATHSEG')
  })

  it('promotes standalone latex lines into display math blocks', () => {
    const html = renderMarkdown(
      'Вектор записывается как\\n\\n\\mathbf{v} = (v_1, v_2, \\dots, v_n),\\qquad v_i \\in \\mathbb{R}.\\n\\nКаждый элемент $v_i$ называется компонентой.',
    )

    expect(html).toContain('katex-display')
    expect(html).toContain('Каждый элемент')
    expect(html).not.toContain('\\mathbf{v}')
  })

  it('wraps common inline raw latex expressions into math', () => {
    const html = renderMarkdown(
      '- \\det(A)\\neq 0 (матрица невырожденная).\\n- A должна быть квадратной (n\\times n).\\n- Записать расширенную матрицу [A\\mid I].',
    )

    expect(html).toContain('katex')
    expect(html).not.toContain('\\det(A)')
    expect(html).not.toContain('n\\times n')
    expect(html).not.toContain('[A\\mid I]')
  })

  it('wraps raw begin-end environments into display math', () => {
    const html = renderMarkdown(
      '\\begin{bmatrix}\\n2 & 1 \\\\\\n5 & 3\\n\\end{bmatrix}\\n\\rightarrow\\n\\begin{bmatrix}\\n1 & 0 \\\\\\n0 & 1\\n\\end{bmatrix}',
    )

    expect(html).toContain('katex-display')
    expect(html).not.toContain('\\begin{bmatrix}')
  })

  it('merges partially wrapped math fragments into one inline expression', () => {
    const html = renderMarkdown(
      '\\text{Функциональная концентрация белка} $= \\beta_0$ $+ \\beta_1 \\cdot$ G_{\\text{WT}}',
    )

    expect(html).toContain('katex')
    expect(html).toContain('Функциональная концентрация белка')
    expect(html).toContain('WT')
    expect(html).not.toContain('G_{')
  })

  it('wraps single-letter variables adjacent to latex operators like m \\times n', () => {
    const html = renderMarkdown('размера m \\times n — это отображение.')

    expect(html).toContain('katex')
    expect(html).not.toContain('\\times')
    expect(html).toContain('размера')
  })

  it('includes preceding single-letter variable in inline formula wrapping', () => {
    const html = renderMarkdown(
      'Результат: A \\mathbf{x} = \\mathbf{y}, где матрица задана.',
    )

    expect(html).toContain('katex')
    expect(html).not.toContain('\\mathbf{x}')
    expect(html).toContain('Результат')
  })

  it('does not treat mixed cyrillic-and-formula lines as standalone display math', () => {
    const html = renderMarkdown(
      'A \\mathbf{x} = \\mathbf{y} Здесь матрица $A$ определяет координаты.',
    )

    expect(html).not.toContain('katex-display')
    expect(html).toContain('katex')
    expect(html).toContain('Здесь')
  })
})
