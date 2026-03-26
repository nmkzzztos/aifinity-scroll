import { expect, test } from '@playwright/test'

test('onboarding generates directions and enters the feed', async ({ page }) => {
  await page.route('https://openrouter.ai/api/v1/chat/completions', async (route) => {
    const request = route.request()
    const payload = request.postDataJSON() as { messages: Array<{ content: string }> }
    const prompt = payload.messages[1]?.content ?? ''

    const content = prompt.includes('study directions')
      ? JSON.stringify({
          suggestions: [
            {
              title: 'Machine Learning Systems',
              subtitle: 'Infra and training loops',
              whyNow: 'Teams want faster iteration.',
              subtopics: ['serving', 'evals'],
            },
          ],
        })
        : JSON.stringify({
          items: [
            {
              title: 'Serving stacks are becoming evaluators',
              tldr: 'Inference systems now produce feedback signals.',
              howItWorks: ['Collect traces', 'Turn traces into evaluations'],
              whyItMatters: 'It closes the loop between deployment and training.',
              summary: 'Inference layers now expose their own learning signals.',
              body: 'A short teaser body.',
              subtopics: ['serving'],
              estimatedReadMinutes: 3,
              tone: 'Fresh',
            },
          ],
        })

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        choices: [{ message: { content } }],
      }),
    })
  })

  await page.goto('/onboarding')
  await page.getByPlaceholder('sk-or-v1-...').fill('demo-key')
  await page.getByPlaceholder('Post-training LLM methods, sparse experts, evaluation...').fill('ML systems')
  await page.getByRole('button', { name: 'Suggest directions' }).click()
  await page.getByRole('button', { name: 'Enter feed' }).click()

  await expect(page).toHaveURL(/\/feed$/)
  await expect(page.getByText('Your evolving AI study feed.')).toBeVisible()
})
