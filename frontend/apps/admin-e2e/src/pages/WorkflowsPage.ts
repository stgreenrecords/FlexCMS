import type { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class WorkflowsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/workflows');
    await this.waitForLoad();
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: /workflow/i });
  }

  get workflowList(): Locator {
    return this.page.locator('[data-testid="workflow-list"]');
  }

  get approveButton(): Locator {
    return this.page.locator('[data-testid="workflow-approve"]');
  }

  get rejectButton(): Locator {
    return this.page.locator('[data-testid="workflow-reject"]');
  }

  get commentInput(): Locator {
    return this.page.getByPlaceholder(/comment/i);
  }

  get emptyState(): Locator {
    return this.page.locator('[data-testid="workflow-empty-state"]');
  }

  async clickTab(tab: 'pending' | 'approved' | 'rejected'): Promise<void> {
    await this.page.locator('[data-testid="workflow-tab-' + tab + '"]').click();
  }

  async selectFirstTask(): Promise<void> {
    const firstItem = this.page.locator('[data-testid="workflow-item"]').first();
    await firstItem.click();
  }

  async addComment(text: string): Promise<void> {
    await this.commentInput.fill(text);
  }

  async approve(comment?: string): Promise<void> {
    if (comment) await this.addComment(comment);
    await this.approveButton.click();
  }

  async reject(comment?: string): Promise<void> {
    if (comment) await this.addComment(comment);
    await this.rejectButton.click();
  }
}

