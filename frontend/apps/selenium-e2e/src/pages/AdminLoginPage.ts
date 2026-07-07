/**
 * FlexCMS Selenium E2E — Admin login page object.
 *
 * Example page object demonstrating the pattern the rebuild backlog
 * (`REB-13`, admin authoring/round-trip suites) should extend.
 */
import { By, type WebDriver } from 'selenium-webdriver';
import { loadEnv } from '../driver/env';
import { waitForClickable, waitForPageReady, waitForVisible } from '../driver/waits';

export class AdminLoginPage {
  private readonly env = loadEnv();

  constructor(private readonly driver: WebDriver) {}

  async open(): Promise<void> {
    await this.driver.get(`${this.env.adminUrl}/login`);
    await waitForPageReady(this.driver);
  }

  async isLoaded(): Promise<boolean> {
    const body = await waitForVisible(this.driver, By.css('body'));
    return body !== undefined;
  }

  async submitLogin(username: string, password: string): Promise<void> {
    const usernameField = await waitForVisible(this.driver, By.css('[data-testid="login-username"]'));
    const passwordField = await waitForVisible(this.driver, By.css('[data-testid="login-password"]'));
    await usernameField.sendKeys(username);
    await passwordField.sendKeys(password);
    const submit = await waitForClickable(this.driver, By.css('[data-testid="login-submit"]'));
    await submit.click();
  }
}

