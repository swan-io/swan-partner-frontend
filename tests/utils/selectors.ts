import { Locator, Page } from "@playwright/test";
import { Merge } from "type-fest";

type Parent = Page | Locator;

type GetByRoleOptions = Parameters<Page["getByRole"]>[1];
type GetByTextOptions = { exact?: boolean };
type ClickOptions = Merge<Parameters<Locator["click"]>[0], GetByTextOptions>;
type WaitForOptions = Merge<Parameters<Locator["waitFor"]>[0], GetByTextOptions>;

// Selectors

export const getButtonByName = (
  parent: Parent,
  name: string | RegExp,
  options?: Omit<GetByRoleOptions, "name">,
) => parent.getByRole("button", { exact: true, ...options, name });

export const getByText = (parent: Parent, text: string | RegExp, options: GetByTextOptions = {}) =>
  parent.getByText(text, { exact: typeof text === "string", ...options });

// Actions

export const clickOnButton = (parent: Parent, name: string | RegExp, options?: ClickOptions) =>
  getButtonByName(parent, name).click(options);

export const clickOnText = (
  parent: Parent,
  text: string | RegExp,
  { exact, ...options }: ClickOptions = { exact: true },
) => getByText(parent, text, { exact }).click(options);

export const waitForText = (
  parent: Parent,
  text: string | RegExp,
  { exact, ...options }: WaitForOptions = { exact: true },
) => getByText(parent, text, { exact }).waitFor(options);
