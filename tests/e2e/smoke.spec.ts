import { test, expect } from '@playwright/test'

test.describe('BandiAI FVG — smoke', () => {
  test('homepage renders the hero and navigation', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /Te li troviamo noi/i })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Esplora i bandi' })).toBeVisible()
  })

  test('bandi list page loads', async ({ page }) => {
    await page.goto('/bandi')
    await expect(page.getByRole('heading', { name: 'Bandi' })).toBeVisible()
    await expect(page.getByPlaceholder(/Cerca per titolo/i)).toBeVisible()
  })

  test('health endpoint responds', async ({ request }) => {
    const res = await request.get('/api/health')
    expect([200, 503]).toContain(res.status())
    const body = await res.json()
    expect(body).toHaveProperty('checks')
  })

  test('theme toggle switches to dark mode', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Cambia tema' }).click()
    // next-themes applies the `dark` class on <html>
    await expect(page.locator('html')).toHaveClass(/dark/)
  })
})
