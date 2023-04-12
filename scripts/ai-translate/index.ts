import { Option, Result } from "@swan-io/boxed";
import chalk from "chalk";
import fs from "fs/promises";
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
import path from "path";
import prompts from "prompts";
import tiktoken from "tiktoken-node";
import type { Except } from "type-fest";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (OPENAI_API_KEY == null) {
  throw new Error("OPENAI_API_KEY is not defined");
}

const MODEL = "gpt-3.5-turbo";
const MODEL_TOKEN_PRICE = 0.002; // $/1000 tokens https://openai.com/pricing
const tokenEncoder = tiktoken.encodingForModel(MODEL);
const openai = new OpenAIApi(
  new Configuration({
    apiKey: OPENAI_API_KEY,
  }),
);

class OpenAIError extends Error {
  cost: number;

  constructor(message: string, cost: number) {
    super(message);
    this.cost = cost;
  }
}

const locales = {
  en: "English",
  fr: "French",
  de: "German",
  es: "Spanish",
  it: "Italian",
  pt: "Portuguese",
  nl: "Dutch",
};

type Locale = keyof typeof locales;

const baseLocale: Locale = "en";

const appTranslationsPaths = {
  banking: path.join(process.cwd(), "clients", "banking", "src", "locales"),
  onboarding: path.join(process.cwd(), "clients", "onboarding", "src", "locales"),
};

type AppName = keyof typeof appTranslationsPaths;

const printAppName = (appName: AppName): string => chalk.magenta(appName);

const printLocale = (locale: Locale): string => chalk.green(locales[locale]);

const printCost = (cost: number): string => chalk.yellow(`${cost.toFixed(4)}$`);

const getTranslationsToRun = (): [AppName, Locale][] => {
  const appNames = Object.keys(appTranslationsPaths) as AppName[];
  const localesKeys = Object.keys(locales).filter(locale => locale !== baseLocale) as Locale[];

  const translationsToRun: [AppName, Locale][] = [];

  for (const appName of appNames) {
    for (const locale of localesKeys) {
      translationsToRun.push([appName, locale]);
    }
  }

  return translationsToRun;
};

const readLocaleFile = async (
  app: AppName,
  locale: Locale,
): Promise<Result<Record<string, string>, Error>> => {
  const localePath = path.join(appTranslationsPaths[app], `${locale}.json`);

  try {
    const fileContent = await fs.readFile(localePath, "utf-8");
    const parsed: unknown = JSON.parse(fileContent);
    // @ts-expect-error our JSON files are always Record<string, string>
    return Result.Ok(parsed);
  } catch (error) {
    console.error(error);
    return Result.Error(new Error(`Failed to read locale file ${localePath}`));
  }
};

const writeLocaleFile = async (
  app: keyof typeof appTranslationsPaths,
  locale: Locale,
  content: Record<string, string>,
): Promise<Result<void, Error>> => {
  const localePath = path.join(appTranslationsPaths[app], `${locale}.json`);

  try {
    await fs.writeFile(localePath, JSON.stringify(content, null, 2), "utf-8");
    return Result.Ok(undefined);
  } catch (error) {
    console.error(error);
    return Result.Error(new Error(`Failed to write locale file for ${localePath}`));
  }
};

const isRecordOfString = (value: unknown): value is Record<string, string> => {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every(v => typeof v === "string")
  );
};

const sortRecord = <T extends Record<string, unknown>>(record: T): T => {
  const keys = Object.keys(record).sort();
  const sortedRecord: Record<string, unknown> = {};
  for (const key of keys) {
    sortedRecord[key] = record[key];
  }
  return sortedRecord as T;
};

const omit = <Key extends string, O extends Record<Key, string>>(
  values: O,
  keys: Key[],
): Except<O, Key> => {
  const entries = Object.entries(values).filter(([key]) => !keys.includes(key as Key));
  return Object.fromEntries(entries) as Except<O, Key>;
};

const pick = <Key extends string, O extends Record<Key, string>>(
  values: O,
  keys: Key[],
): Pick<O, Key> => {
  const entries = Object.entries(values).filter(([key]) => keys.includes(key as Key));
  return Object.fromEntries(entries) as Pick<O, Key>;
};

const computePrice = (nbTokens: number): number => {
  return (nbTokens * MODEL_TOKEN_PRICE) / 1000;
};

/**
 * This counts the number of tokens in a string
 * Giving us the possibility to get a price approximation before calling OpenAI
 */
const countTokens = (text: string) => {
  const tokenized = tokenEncoder.encode(text);
  //   tokenEncoder.free();
  return tokenized.length;
};

const countInputTokens = (input: ChatCompletionRequestMessage[]): number => {
  return input.reduce((acc, { content }) => acc + countTokens(content), 0);
};

const NB_MAX_KEYS_FOR_CONTEXT = 30;
/**
 * To limit context size we send to openai
 * We only keep a percentage of the keys
 * Instead of slice, we get keys distributed in the object
 */
const getKeysForContext = (keys: string[]): string[] => {
  if (keys.length <= NB_MAX_KEYS_FOR_CONTEXT) {
    return keys;
  }

  const keysModulo = Math.ceil(keys.length / NB_MAX_KEYS_FOR_CONTEXT);
  const keysToKeep = keys.filter((_, index) => index % keysModulo === 0);

  return keysToKeep;
};

/**
 * This gets new messages to translate
 */
const getNewMessages = (
  baseLocaleKeys: Record<string, string>,
  targetLocaleKeys: Record<string, string>,
): Record<string, string> => {
  const alreadyTranslatedKeys = Object.keys(baseLocaleKeys).filter(
    key => targetLocaleKeys[key] != null,
  );

  return omit(baseLocaleKeys, alreadyTranslatedKeys);
};

/**
 * This create prompt with context to tell OpenAI how we translated the keys
 */
const getChatPrompt = (
  baseLocaleJson: Record<string, string>,
  targetLocaleJson: Record<string, string>,
  targetLocale: Locale,
): Option<{ messages: ChatCompletionRequestMessage[]; approximatedPrice: number }> => {
  const jsonToTranslate = getNewMessages(baseLocaleJson, targetLocaleJson);
  const nonTranslatedKeys = Object.keys(jsonToTranslate);
  const alreadyTranslatedJson = omit(baseLocaleJson, nonTranslatedKeys);
  const keysForContext = getKeysForContext(Object.keys(alreadyTranslatedJson));
  const baseLocaleForContext = pick(baseLocaleJson, keysForContext);
  const targetLocaleForContext = pick(targetLocaleJson, keysForContext);

  if (Object.keys(jsonToTranslate).length === 0) {
    return Option.None();
  }

  const messages: ChatCompletionRequestMessage[] = [
    {
      role: "system",
      content:
        "You are a helpfull assistant who translate JSON files for a Bank as a Service applications. Translations use ICU message format syntax. The answer must contains only the translated JSON.",
    },
    {
      role: "user",
      content: `Can you translate this JSON file to ${locales[targetLocale]}?:\n ${JSON.stringify(
        baseLocaleForContext,
        null,
        2,
      )}`,
    },
    {
      role: "assistant",
      content: JSON.stringify(targetLocaleForContext, null, 2),
    },
    {
      role: "user",
      content: `Can you translate this JSON file to ${locales[targetLocale]}?:\n ${JSON.stringify(
        jsonToTranslate,
        null,
        2,
      )}`,
    },
  ];

  const nbInputTokens = countInputTokens(messages);
  // we do the hypothesis that the output will be approximately the same size as the input
  const approximatedOutputTokens = countTokens(JSON.stringify(jsonToTranslate, null, 2));
  const approximatedNbTokens = nbInputTokens + approximatedOutputTokens;
  const approximatedPrice = computePrice(approximatedNbTokens);

  return Option.Some({ messages, approximatedPrice });
};

const createChatCompletion = async (
  messages: ChatCompletionRequestMessage[],
): Promise<Result<{ translatedMessages: Record<string, string>; cost: number }, OpenAIError>> => {
  try {
    const { data } = await openai.createChatCompletion({
      model: MODEL,
      messages,
      temperature: 0.5,
    });

    const nbTotalTokens = data.usage?.total_tokens ?? 0;
    const cost = computePrice(nbTotalTokens);

    const finishReason = data.choices[0]?.finish_reason ?? "unknown";

    if (finishReason !== "stop") {
      return Result.Error(
        new OpenAIError(`Failed to complete chat completion, reason: ${finishReason}`, cost),
      );
    }

    const content = data.choices[0]?.message?.content;

    if (content == null) {
      return Result.Error(
        new OpenAIError("Failed to complete chat completion, content is null", cost),
      );
    }

    const translatedMessages: unknown = JSON.parse(content);

    if (!isRecordOfString(translatedMessages)) {
      return Result.Error(
        new OpenAIError(
          "Failed to complete chat completion, content is not a Record<string, string>",
          cost,
        ),
      );
    }

    return Result.Ok({ translatedMessages, cost });
  } catch (error) {
    console.error(error);
    return Result.Error(new OpenAIError("Failed to create chat completion", 0));
  }
};

const translateApp = async (
  app: keyof typeof appTranslationsPaths,
  targetLocale: Locale,
): Promise<Result<{ cost: Option<number>; cancelled?: boolean }, Error | OpenAIError>> => {
  const baseJson = await readLocaleFile(app, baseLocale);
  const targetJson = await readLocaleFile(app, targetLocale);

  if (baseJson.isError()) {
    return Result.Error(baseJson.getError());
  }
  if (targetJson.isError()) {
    return Result.Error(targetJson.getError());
  }

  const promptOption = getChatPrompt(baseJson.value, targetJson.value, targetLocale);

  if (promptOption.isNone()) {
    return Result.Ok({ cost: Option.None() });
  }

  const { messages, approximatedPrice } = promptOption.value;

  const response = await prompts({
    type: "confirm",
    name: "confirmed",
    message: `Translate ${printAppName(app)} to ${printLocale(
      targetLocale,
    )}? This will cost ${printCost(approximatedPrice)}`,
  });

  const confirmed = response.confirmed === true;

  if (!confirmed) {
    return Result.Ok({ cost: Option.None(), cancelled: true });
  }

  const chatCompletion = await createChatCompletion(messages);

  if (chatCompletion.isError()) {
    return Result.Error(chatCompletion.getError());
  }

  const { translatedMessages, cost } = chatCompletion.value;

  const updatedTargetJson = sortRecord({
    ...targetJson.value,
    ...translatedMessages,
  });

  const writeResult = await writeLocaleFile(app, targetLocale, updatedTargetJson);

  if (writeResult.isError()) {
    return Result.Error(new OpenAIError(writeResult.getError().message, cost));
  }

  return Result.Ok({ cost: Option.Some(cost) });
};

const main = async () => {
  const translationsToRun = getTranslationsToRun();

  for (const [app, targetLocale] of translationsToRun) {
    const result = await translateApp(app, targetLocale);

    result.match({
      Ok: ({ cost, cancelled }) => {
        if (cancelled === true) {
          console.log(
            `Cancelled translation of ${printAppName(app)} to ${printLocale(targetLocale)}`,
          );
          return;
        }
        cost.match({
          Some: cost =>
            console.log(
              `App ${printAppName(app)} translated to ${printLocale(
                targetLocale,
              )}, cost: ${printCost(cost)}`,
            ),
          None: () =>
            console.log(
              `App ${printAppName(app)} doesn't need to be translated to ${printLocale(
                targetLocale,
              )}`,
            ),
        });
      },
      Error: error => {
        if (error instanceof OpenAIError) {
          console.error(
            `Failed to translate ${printAppName(app)} to ${printLocale(targetLocale)}: ${
              error.message
            }, cost: ${printCost(error.cost)}`,
          );
        } else {
          console.error(
            `Failed to translate ${printAppName(app)} to ${printLocale(targetLocale)}: ${
              error.message
            }`,
          );
        }
      },
    });
  }
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
