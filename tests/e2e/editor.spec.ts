import { test, expect } from '@playwright/test'

test('CodeEditor supports languages, Markdown preview and React controlled changes', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/#components/editor')
  await expect(page.locator('.catalog-card.selected')).toContainText('CodeEditor')
  await expect(page.locator('.yc-code-editor--split')).toBeVisible()
  await expect(page.locator('.yc-code-editor__markdown')).toContainText('Thoughtfully written')
  await page.screenshot({ path: 'test-results/editor-desktop.png', fullPage: true, animations: 'disabled' })

  const editor = page.locator('.cm-content')
  await editor.click()
  await page.keyboard.press('Control+A')
  await page.keyboard.type('# Safe preview\n\n<script>alert(1)</script>')
  await expect(page.locator('.yc-code-editor__markdown')).toContainText('<script>alert(1)</script>')
  await expect(page.locator('.yc-code-editor__markdown script')).toHaveCount(0)

  await page.getByLabel('编程语言').selectOption('python')
  await expect(page.locator('.yc-code-editor')).toHaveAttribute('data-language', 'python')
  await expect(editor).toContainText('def craft')
  await expect(page.getByLabel('展示模式')).toHaveCount(0)

  await page.getByLabel('显示行号').uncheck()
  await expect(page.locator('.cm-gutters')).toHaveCSS('display', 'none')
  await page.getByLabel('编辑器只读').check()
  await expect(editor).toHaveAttribute('contenteditable', 'false')

  await page.locator('.lab-tabs .framework-switch').getByRole('button', { name: 'React' }).click()
  await expect(page.locator('[data-yancraft-react="CodeEditor"]')).toBeVisible()
  await page.getByLabel('编辑器只读').uncheck()
  await page.getByLabel('编程语言').selectOption('typescript')
  await page.locator('[data-yancraft-react="CodeEditor"] .cm-content').click()
  await page.keyboard.press('Control+End')
  await page.keyboard.type('\nconst fromReact = true')
  await expect(page.getByRole('status')).toContainText('个字符')

  await page.getByRole('tab', { name: '使用代码' }).click()
  await expect(page.locator('.code-panel')).toContainText("@yancraft/react")
  await page.getByRole('tab', { name: 'API 文档' }).click()
  await expect(page.locator('.api-panel')).toContainText('EditorLanguage')
  expect(errors).toEqual([])
})
