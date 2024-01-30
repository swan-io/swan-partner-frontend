import { Option, Result } from "@swan-io/boxed";
import cliSpinners from "cli-spinners";
import fs from "fs/promises";
import OpenAI from "openai";
import ora from "ora";
import os from "os";
import path from "pathe";
import pc from "picocolors";
import prompts from "prompts";
import tiktoken from "tiktoken-node";
import { P, match } from "ts-pattern";
import type { Except } from "type-fest";

/**
 * This script is used to translate the app using OpenAI's GPT-3.5 API.
 * - First we list all the translations we want to run with tuples of [app, locale]
 * - For each tuple, we generate a prompt
 *   - this prompt contains as context some translated keys with the translation we use. (This explain to openai how we translated other keys and help it to generate consistent translations)
 *   - creating a context is just a list of message where we can say "When I ask you this, you should answer this"
 * - Once the prompt is generated, we compute a price approximation
 *   - first we count the number of tokens in the prompt (because proce is based on number of tokens) https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them
 *     (it uses tiktoken-node, after a few test results wasn't 100% accurate, but it's close enough for approximating the price)
 *   - then we apply openai api price per token and display a prompt to confirm if we want to call openai api
 * - If the user confirms, we call openai api and wait for the result with a spinner because it can take a while (~1 second per key to translate)
 * - Once we have the result, we parse it and edit the translation file
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (OPENAI_API_KEY == null) {
  throw new Error("OPENAI_API_KEY is not defined");
}

const MODEL = "gpt-3.5-turbo";
const MODEL_TOKEN_PRICE = 0.002; // $/1000 tokens https://openai.com/pricing
const tokenEncoder = tiktoken.encodingForModel(MODEL);

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

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
  fi: "Finnish",
};

type Locale = keyof typeof locales;

const baseLocale: Locale = "en";

const appTranslationsPaths = {
  banking: path.join(process.cwd(), "clients", "banking", "src", "locales"),
  onboarding: path.join(process.cwd(), "clients", "onboarding", "src", "locales"),
  payment: path.join(process.cwd(), "clients", "payment", "src", "locales"),
};

type AppName = keyof typeof appTranslationsPaths;

const printAppName = (appName: AppName): string => pc.magenta(appName);
const printLocale = (locale: Locale): string => pc.green(locales[locale]);
const printNbKeys = (nbKeys: number): string => pc.bold(nbKeys);
const printCost = (cost: number): string => pc.yellow(`${cost.toFixed(4)}$`);
const printDuration = (duration: number): string => pc.cyan(`${(duration / 1000).toFixed(2)}s`);

/**
 * Create a spinner with clock
 */
const startSpinner = (text: string) => {
  const spinner = ora({
    spinner: cliSpinners.circleHalves,
    text,
  });

  const startTimestamp = Date.now();
  let timeout: NodeJS.Timeout | undefined;

  const updateTime = () => {
    timeout = setTimeout(() => {
      const elapsed = Date.now() - startTimestamp;
      const seconds = elapsed / 1000;
      spinner.suffixText = ` ${seconds.toFixed(1)}s`;

      updateTime();
    }, 100);
  };

  updateTime();

  spinner.start();

  return () => {
    clearTimeout(timeout);
    spinner.stop();
  };
};

/**
 * List tuples of [app, locale] to run
 */
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

/**
 * Read JSON file from disk
 */
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

/**
 * Write JSON file to disk
 */
const writeLocaleFile = async (
  app: keyof typeof appTranslationsPaths,
  locale: Locale,
  json: Record<string, string>,
): Promise<Result<void, Error>> => {
  const localePath = path.join(appTranslationsPaths[app], `${locale}.json`);

  const sorted = Object.keys(json)
    .sort()
    .reduce<Record<string, string>>((acc, key) => ({ ...acc, [key]: json[key] as string }), {});

  try {
    await fs.writeFile(localePath, JSON.stringify(sorted, null, 2) + os.EOL, "utf-8");
    return Result.Ok(undefined);
  } catch (error) {
    console.error(error);
    return Result.Error(new Error(`Failed to write locale file for ${localePath}`));
  }
};

/**
 * Typeguard used to check if openai response is a Record<string, string>
 */
const isRecordOfString = (value: unknown): value is Record<string, string> => {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every(v => typeof v === "string")
  );
};

/**
 * Sort keys by alphabetical order to avoid unnecessary diff
 */
const sortRecord = <T extends Record<string, unknown>>(record: T): T => {
  const keys = Object.keys(record).sort();
  const sortedRecord: Record<string, unknown> = {};
  for (const key of keys) {
    sortedRecord[key] = record[key];
  }
  return sortedRecord as T;
};

/**
 * Remove keys from a Record
 */
const omit = <Key extends string, O extends Record<Key, string>>(
  values: O,
  keys: Key[],
): Except<O, Key> => {
  const entries = Object.entries(values).filter(([key]) => !keys.includes(key as Key));
  return Object.fromEntries(entries) as Except<O, Key>;
};

/**
 * Pick keys from a Record
 */
const pick = <Key extends string, O extends Record<Key, string>>(
  values: O,
  keys: Key[],
): Pick<O, Key> => {
  const entries = Object.entries(values).filter(([key]) => keys.includes(key as Key));
  return Object.fromEntries(entries) as Pick<O, Key>;
};

/**
 * Compute the price based on OpenAI pricing
 * https://openai.com/pricing
 */
const computePrice = (nbTokens: number): number => {
  return (nbTokens * MODEL_TOKEN_PRICE) / 1000;
};

/**
 * This counts the number of tokens into a string
 * Giving us the possibility to get a price approximation before calling OpenAI
 * The result isn't 100% accurate but it's good enough for approximating the price
 */
const countTokens = (text: string): number => {
  const tokenized = tokenEncoder.encode(text);
  return tokenized.length;
};

/**
 * This counts the number of tokens into a list of messages
 */
const countInputTokens = (input: OpenAI.Chat.ChatCompletionMessageParam[]): number => {
  return input.reduce(
    (acc, { content }) =>
      acc +
      countTokens(
        match(content)
          .with(P.string, text => text)
          .with(P.array(P._), array =>
            array.reduce((acc, item) => acc + (item.type === "text" ? " " + item.text : ""), ""),
          )
          .otherwise(() => ""),
      ),
    0,
  );
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
): Option<{
  messages: OpenAI.Chat.ChatCompletionMessageParam[];
  approximatedPrice: number;
  nbKeys: number;
}> => {
  const jsonToTranslate = getNewMessages(baseLocaleJson, targetLocaleJson);
  const nonTranslatedKeys = Object.keys(jsonToTranslate);
  const alreadyTranslatedJson = omit(baseLocaleJson, nonTranslatedKeys);
  const keysForContext = getKeysForContext(Object.keys(alreadyTranslatedJson));
  const baseLocaleForContext = pick(baseLocaleJson, keysForContext);
  const targetLocaleForContext = pick(targetLocaleJson, keysForContext);

  if (Object.keys(jsonToTranslate).length === 0) {
    return Option.None();
  }

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "You are a helpful assistant who translate JSON files for Bank as a Service applications. Translations use ICU message format syntax. The answer must contains only the translated JSON.",
    },
    {
      role: "user",
      content: `Can you translate this JSON file to ${locales[targetLocale]}?:\n ${JSON.stringify(
        baseLocaleForContext,
      )}`,
    },
    {
      role: "assistant",
      content: JSON.stringify(targetLocaleForContext),
    },
    {
      role: "user",
      content: `Can you translate this JSON file to ${locales[targetLocale]}?:\n ${JSON.stringify(
        jsonToTranslate,
      )}`,
    },
  ];

  const nbInputTokens = countInputTokens(messages);
  // we do the hypothesis that the output will be approximately the same size as the input
  const approximatedOutputTokens = countTokens(JSON.stringify(jsonToTranslate));
  const approximatedNbTokens = nbInputTokens + approximatedOutputTokens;
  const approximatedPrice = computePrice(approximatedNbTokens);

  return Option.Some({ messages, approximatedPrice, nbKeys: Object.keys(jsonToTranslate).length });
};

/**
 * Call OpenAI with a list of messages
 * And parse the result which should be a JSON
 */
const createChatCompletion = async (
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
): Promise<
  Result<
    { translatedMessages: Record<string, string>; cost: number; duration: number },
    OpenAIError
  >
> => {
  try {
    const start = Date.now();

    const data = await openai.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.5,
    });

    const nbTotalTokens = data.usage?.total_tokens ?? 0;
    const cost = computePrice(nbTotalTokens);

    const finishReason = data.choices[0]?.finish_reason ?? "unknown";

    if (finishReason !== "stop") {
      return Result.Error(new OpenAIError(`Chat completion failed, reason: ${finishReason}`, cost));
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

    const duration = Date.now() - start;

    return Result.Ok({ translatedMessages, cost, duration });
  } catch (error) {
    console.error(error);
    return Result.Error(new OpenAIError("Failed to create chat completion", 0));
  }
};

/**
 * Translate one app to one locale
 * - it creates the prompt with price approximation
 * - then it asks for confirmation to the user
 * - if user confirms, it calls OpenAI
 */
const translateApp = async (
  app: keyof typeof appTranslationsPaths,
  targetLocale: Locale,
): Promise<
  Result<
    { cost: Option<number>; duration: number; nbTranslatedKeys: number; cancelled?: boolean },
    Error | OpenAIError
  >
> => {
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
    return Result.Ok({ cost: Option.None(), duration: 0, nbTranslatedKeys: 0 });
  }

  const { messages, approximatedPrice, nbKeys } = promptOption.value;

  const response = await prompts({
    type: "confirm",
    name: "confirmed",
    message: `Translate ${nbKeys} keys of ${printAppName(app)} into ${printLocale(
      targetLocale,
    )}? This will cost ${printCost(approximatedPrice)}`,
  });

  const confirmed = response.confirmed === true;

  if (!confirmed) {
    return Result.Ok({ cost: Option.None(), cancelled: true, duration: 0, nbTranslatedKeys: 0 });
  }

  const stopSpinner = startSpinner(
    `Translating ${printAppName(app)} to ${printLocale(targetLocale)}`,
  );
  const chatCompletion = await createChatCompletion(messages);
  stopSpinner();

  if (chatCompletion.isError()) {
    return Result.Error(chatCompletion.getError());
  }

  const { translatedMessages, cost, duration } = chatCompletion.value;

  const updatedTargetJson = sortRecord({
    ...targetJson.value,
    ...translatedMessages,
  });

  const writeResult = await writeLocaleFile(app, targetLocale, updatedTargetJson);

  if (writeResult.isError()) {
    return Result.Error(new OpenAIError(writeResult.getError().message, cost));
  }

  return Result.Ok({
    cost: Option.Some(cost),
    duration,
    nbTranslatedKeys: Object.keys(translatedMessages).length,
  });
};

const main = async () => {
  const translationsToRun = getTranslationsToRun();

  for (const [app, targetLocale] of translationsToRun) {
    const result = await translateApp(app, targetLocale);

    result.match({
      Ok: ({ cost, duration, nbTranslatedKeys, cancelled }) => {
        if (cancelled === true) {
          console.log(
            `Cancelled translation of ${printAppName(app)} into ${printLocale(targetLocale)}`,
          );
          return;
        }
        cost.match({
          Some: cost =>
            console.log(
              `App ${printAppName(app)} translated ${printNbKeys(
                nbTranslatedKeys,
              )} keys to ${printLocale(targetLocale)}, duration: ${printDuration(
                duration,
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

void main();
