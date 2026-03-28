/**
 * Drag-and-drop helpers for @dnd-kit/core + @dnd-kit/sortable.
 *
 * Standard Playwright `dragTo()` does not reliably activate @dnd-kit's
 * PointerSensor (which requires a minimum activation distance). This module
 * simulates real pointer events that @dnd-kit can detect.
 */
import type { Locator, Page } from '@playwright/test';

/**
 * Drag a source element to a target element using low-level mouse events.
 * Moves gradually to satisfy @dnd-kit's activation distance requirement.
 */
export async function dragAndDrop(
  page: Page,
  source: Locator,
  target: Locator,
  options: { steps?: number; delayMs?: number } = {},
): Promise<void> {
  const { steps = 15, delayMs = 30 } = options;

  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();

  if (!sourceBox || !targetBox) {
    throw new Error('dragAndDrop: source or target element not visible or has no bounding box');
  }

  const srcX = sourceBox.x + sourceBox.width / 2;
  const srcY = sourceBox.y + sourceBox.height / 2;
  const tgtX = targetBox.x + targetBox.width / 2;
  const tgtY = targetBox.y + targetBox.height / 2;

  // Move to source, press, then gradually move to target
  await page.mouse.move(srcX, srcY);
  await page.mouse.down();

  for (let i = 1; i <= steps; i++) {
    const x = srcX + (tgtX - srcX) * (i / steps);
    const y = srcY + (tgtY - srcY) * (i / steps);
    await page.mouse.move(x, y);
    if (delayMs > 0) await page.waitForTimeout(delayMs);
  }

  await page.mouse.up();
}

/**
 * Drag a source element by a pixel offset (for absolute positioning scenarios).
 */
export async function dragByOffset(
  page: Page,
  source: Locator,
  offsetX: number,
  offsetY: number,
  options: { steps?: number } = {},
): Promise<void> {
  const { steps = 10 } = options;
  const box = await source.boundingBox();
  if (!box) throw new Error('dragByOffset: source element not visible');

  const srcX = box.x + box.width / 2;
  const srcY = box.y + box.height / 2;

  await page.mouse.move(srcX, srcY);
  await page.mouse.down();

  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(
      srcX + (offsetX * i) / steps,
      srcY + (offsetY * i) / steps,
    );
    await page.waitForTimeout(30);
  }

  await page.mouse.up();
}

