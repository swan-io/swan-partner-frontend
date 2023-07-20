import { Locator, Page } from "@playwright/test";
import { Merge } from "type-fest";

type Parent = Page | Locator;

type GetByTextOptions = { exact?: boolean };
type GetByRoleOptions = Merge<Omit<Parameters<Page["getByRole"]>[1], "name">, GetByTextOptions>;
type ClickOptions = Merge<Parameters<Locator["click"]>[0], GetByTextOptions>;
type WaitForOptions = Merge<Parameters<Locator["waitFor"]>[0], GetByTextOptions>;

// Selectors

export const getButtonByName = (
  parent: Parent,
  name: string | RegExp,
  { exact = typeof name === "string", ...options }: GetByRoleOptions = {},
) => parent.getByRole("button", { exact, ...options, name });

export const getByText = (
  parent: Parent,
  text: string | RegExp,
  { exact = typeof text === "string", ...options }: GetByTextOptions = {},
) => parent.getByText(text, { exact, ...options });

// Actions

export const clickOnButton = (
  parent: Parent,
  name: string | RegExp,
  { exact, ...options }: ClickOptions = {},
) => getButtonByName(parent, name, { exact }).click(options);

export const clickOnText = (
  parent: Parent,
  text: string | RegExp,
  { exact, ...options }: ClickOptions = {},
) => getByText(parent, text, { exact }).click(options);

export const waitForText = (
  parent: Parent,
  text: string | RegExp,
  { exact, ...options }: WaitForOptions = {},
) => getByText(parent, text, { exact }).waitFor(options);
