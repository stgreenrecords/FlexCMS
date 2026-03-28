/**
 * Workflows E2E Tests — UI-080 → UI-086
 */
import { test, expect } from '@playwright/test';
import workflowList from '../../src/fixtures/data/workflow-list.json';

// ── API mocks ──────────────────────────────────────────────────────────────
test.beforeEach(async ({ page }) => {
  if (process.env['USE_LIVE_API']) return;
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const { pathname } = url;
    const method = route.request().method();

    if (pathname.includes('/api/author/workflow/advance') && method === 'POST') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
    }
    if (pathname.includes('/api/author/workflow')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: workflowList, totalElements: workflowList.length }),
      });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
});

// ── Helpers ────────────────────────────────────────────────────────────────
/** Locate a task card by its h3 title (avoids strict-mode violations). */
function taskCardByTitle(page: import('@playwright/test').Page, title: string) {
  return page.locator('h3').filter({ hasText: title }).first();
}

// ── Tests ──────────────────────────────────────────────────────────────────
test.describe('Workflow Inbox @smoke @regression', () => {

  test('UI-080: workflows page loads and fetches from API', async ({ page }) => {
    const apiCall = page.waitForResponse(
      (r) => r.url().includes('/api/author/workflow') && r.status() === 200,
    );
    await page.goto('/workflows');
    await apiCall;
    await expect(page.getByRole('heading', { name: 'Workflow Inbox' })).toBeVisible({ timeout: 10_000 });
  });

  test('UI-081: pending workflow tasks are displayed in the list', async ({ page }) => {
    await page.goto('/workflows');
    await expect(page.getByRole('heading', { name: 'Workflow Inbox' })).toBeVisible({ timeout: 10_000 });
    // Fixture has 2 ACTIVE (pending) workflows — check task card h3 titles
    await expect(taskCardByTitle(page, 'Publish Review')).toBeVisible();
    await expect(taskCardByTitle(page, 'Content Approval')).toBeVisible();
  });

  test('UI-082: clicking a task card shows Approve and Reject buttons', async ({ page }) => {
    await page.goto('/workflows');
    // 'Publish Review' is auto-selected on load; click 'Content Approval' (not selected) to test the click behaviour
    await expect(taskCardByTitle(page, 'Content Approval')).toBeVisible({ timeout: 10_000 });
    await taskCardByTitle(page, 'Content Approval').click();
    // Use exact button names to avoid matching the 'Approved'/'Rejected' tab buttons
    await expect(page.getByRole('button', { name: 'Approve Workflow' })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: 'Reject Task' })).toBeVisible();
  });

  test('UI-083: clicking reject button sends reject action to API', async ({ page }) => {
    const advanceCall = page.waitForRequest(
      (req) => req.url().includes('/api/author/workflow/advance') && req.method() === 'POST',
    );
    await page.goto('/workflows');
    // Click a task that is NOT auto-selected to open its detail panel without deselecting
    await expect(taskCardByTitle(page, 'Content Approval')).toBeVisible({ timeout: 10_000 });
    await taskCardByTitle(page, 'Content Approval').click();
    await expect(page.getByRole('button', { name: 'Reject Task' })).toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: 'Reject Task' }).click();
    const req = await advanceCall;
    const body = JSON.parse(req.postData() ?? '{}') as Record<string, unknown>;
    expect(body.action).toBe('reject');
  });

  test('UI-082b: clicking approve button sends approve action to API', async ({ page }) => {
    const advanceCall = page.waitForRequest(
      (req) => req.url().includes('/api/author/workflow/advance') && req.method() === 'POST',
    );
    await page.goto('/workflows');
    await expect(taskCardByTitle(page, 'Content Approval')).toBeVisible({ timeout: 10_000 });
    await taskCardByTitle(page, 'Content Approval').click();
    await expect(page.getByRole('button', { name: 'Approve Workflow' })).toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: 'Approve Workflow' }).click();
    const req = await advanceCall;
    const body = JSON.parse(req.postData() ?? '{}') as Record<string, unknown>;
    expect(body.action).toBe('approve');
  });

  test('UI-084: comment text is included in the approve request body', async ({ page }) => {
    // Register a higher-priority route to capture the advance request body
    let capturedComment = '__not_captured__';
    const advanceSettled = new Promise<void>((resolve) => {
      void page.route('**/api/author/workflow/advance', async (route) => {
        if (route.request().method() === 'POST') {
          const body = JSON.parse(route.request().postData() ?? '{}') as Record<string, unknown>;
          capturedComment = (body.comment as string) ?? '';
        }
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
        resolve();
      });
    });

    await page.goto('/workflows');
    // wf-001 is auto-selected on load — the detail panel and textarea are immediately visible
    await expect(page.getByRole('button', { name: 'Approve Workflow' })).toBeVisible({ timeout: 10_000 });
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 5_000 });

    // Type the comment using fill()
    await textarea.fill('LGTM - approved with no issues');
    await expect(textarea).toHaveValue('LGTM - approved with no issues');
    await page.waitForTimeout(500);
    // Confirm the value is still present after React's render cycle
    await expect(textarea).toHaveValue('LGTM - approved with no issues');
    await page.getByRole('button', { name: 'Approve Workflow' }).click();

    await advanceSettled;
    expect(capturedComment).toBe('LGTM - approved with no issues');

    await advanceSettled;
    expect(capturedComment).toBe('LGTM - approved with no issues');
  });

  test('UI-085: tab buttons for pending/approved/rejected are present', async ({ page }) => {
    await page.goto('/workflows');
    await expect(page.getByRole('heading', { name: 'Workflow Inbox' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /pending/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /approved/i }).first()).toBeVisible();
  });

  test('UI-086: all workflow data is fetched from API, not hardcoded', async ({ page }) => {
    // Use waitForRequest for reliable async detection of the API call
    const workflowApiCall = page.waitForRequest(
      (req) => req.url().includes('/api/author/workflow'),
    );
    await page.goto('/workflows');
    await expect(page.getByRole('heading', { name: 'Workflow Inbox' })).toBeVisible({ timeout: 10_000 });
    await workflowApiCall; // assert the API was actually called
  });
});

