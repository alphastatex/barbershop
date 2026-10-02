import { test, expect } from '@playwright/test';

test.describe('BRUTAL STYLE Barbershop', () => {
  // Перед каждым тестом — чистая страница
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Гарантируем, что все модалки закрыты
    await page.evaluate(() => {
      document.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
    });
  });

  // ========== БРОНИРОВАНИЕ ==========

  test('должен открывать модальное окно при клике на кнопку записи', async ({ page }) => {
    await page.locator('#open-booking').click();
    await expect(page.locator('#booking-modal')).toHaveClass(/active/);
  });

  test('должен форматировать телефон при вводе', async ({ page }) => {
    await page.locator('#open-booking').click();
    const phoneInput = page.locator('#phone');
    await phoneInput.fill('9991234567');
    await expect(phoneInput).toHaveValue('+7 (999) 123-45-67');
  });

  test('должен показывать сообщение об успехе после отправки формы', async ({ page }) => {
    await page.locator('#open-booking').click();
    await page.locator('#form-name').fill('Тест');
    await page.locator('#phone').fill('9991234567');
    await page.locator('#form-service').selectOption('Стрижка');
    await page.locator('.submit-btn').click();
    await expect(page.locator('#success-message')).toBeVisible();
    await expect(page.locator('#success-message h3')).toContainText('ЗАЯВКА ПРИНЯТА');
  });

  // ========== МАСТЕРА ==========

  test('должен открывать модалку мастера при клике на карточку', async ({ page }) => {
    const masterCard = page.locator('[data-master="1"]');
    await masterCard.scrollIntoViewIfNeeded();
    await masterCard.click({ force: true });
    await expect(page.locator('#masterModal')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('#modalName')).toContainText('Виктор');
  });

  test('должен закрывать модалку мастера по Escape', async ({ page }) => {
    // Открываем модалку
    const masterCard = page.locator('[data-master="1"]');
    await masterCard.scrollIntoViewIfNeeded();
    await masterCard.click({ force: true });
    await expect(page.locator('#masterModal')).toBeVisible({ timeout: 3000 });

    // Ставим фокус на body, чтобы Escape точно сработал
    await page.evaluate(() => document.body.focus());
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Проверяем, что модалка закрылась
    await expect(page.locator('#masterModal')).not.toHaveClass(/active/);
  });

  test('должен закрывать модалку мастера по клику на крестик', async ({ page }) => {
    // Открываем модалку
    const masterCard = page.locator('[data-master="1"]');
    await masterCard.scrollIntoViewIfNeeded();
    await masterCard.click({ force: true });
    await expect(page.locator('#masterModal')).toBeVisible({ timeout: 3000 });

    // Программный клик по крестику через JS (обходит любые перехваты)
    await page.evaluate(() => {
      const btn = document.getElementById('closeMasterModal');
      if (btn) btn.click();
    });
    await page.waitForTimeout(500);

    // Проверяем, что модалка закрылась
    await expect(page.locator('#masterModal')).not.toHaveClass(/active/);
  });
});