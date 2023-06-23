import { Locator, Page } from "@playwright/test";

type Parent = Page | Locator;

type GetByRoleOptions = Parameters<Page["getByRole"]>[1];
type GetByTextOptions = Parameters<Page["getByText"]>[1];
type ClickOptions = Parameters<Locator["click"]>[0];
type WaitForOptions = Parameters<Locator["waitFor"]>[0];

// Selectors

export const getButtonByName = (
  parent: Parent,
  name: string,
  options?: Omit<GetByRoleOptions, "name">,
) => parent.getByRole("button", { exact: true, ...options, name });

export const getByText = (parent: Parent, text: string, options?: GetByTextOptions) =>
  parent.getByText(text, { exact: true, ...options });

// Actions

export const clickOnButton = (parent: Parent, name: string, options?: ClickOptions) =>
  getButtonByName(parent, name).click(options);

export const clickOnText = (parent: Parent, text: string, options?: ClickOptions) =>
  getByText(parent, text).click(options);

export const waitForText = (parent: Parent, text: string, options?: WaitForOptions) =>
  getByText(parent, text).waitFor(options);

export const waitForTitle = (parent: Parent, text: string, options?: WaitForOptions) =>
  parent.getByRole("heading", { exact: true, name: text }).waitFor(options);
