import { Option, Result } from "@bloodyowl/boxed";
import {
  isPluralElement,
  isSelectElement,
  isStructurallySame,
  isTagElement,
  type MessageFormatElement,
  parse,
} from "@formatjs/icu-messageformat-parser";
import { match } from "ts-pattern";

/**
 * ICU message checks used by `validateTranslations.ts`
 * Kept apart from the script so they can be unit tested without running a CLI
 */

/**
 * Parse a message with the same ICU parser as @formatjs/intl uses at runtime
 */
const parseMessage = (message: string): Result<MessageFormatElement[], string> =>
  Result.fromExecution<MessageFormatElement[], unknown>(() => parse(message)).mapError(error =>
    error instanceof Error ? error.message : String(error),
  );

/**
 * List rich text tag names (<bold>…</bold>), including the ones nested in tags and plural / select branches
 * Sorted to compare them regardless of their position (word order changes between languages)
 */
const getTagNames = (elements: MessageFormatElement[]): string[] =>
  elements
    .flatMap(element =>
      match(element)
        .when(isTagElement, tag => [tag.value, ...getTagNames(tag.children)])
        .when(
          element => isPluralElement(element) || isSelectElement(element),
          ({ options }) => Object.values(options).flatMap(option => getTagNames(option.value)),
        )
        .otherwise(() => []),
    )
    .toSorted();

const isSameList = (a: string[], b: string[]): boolean =>
  a.length === b.length && a.every((item, index) => item === b[index]);

/**
 * Check that a translation has the same ICU arguments (names and types) and the same tags as the base message
 */
const compareMessages = (
  base: MessageFormatElement[],
  translation: MessageFormatElement[],
): Result<void, string> =>
  Result.fromExecution(() => isStructurallySame(base, translation))
    .mapError(() => "ICU arguments have conflicting types")
    .flatMap(result =>
      match(result)
        .with({ success: true }, () => Result.Ok(undefined))
        .otherwise(({ error }) => Result.Error(error?.message ?? "ICU arguments mismatch")),
    )
    .flatMap(() => {
      const expectedTags = getTagNames(base);
      const actualTags = getTagNames(translation);

      return isSameList(expectedTags, actualTags)
        ? Result.Ok(undefined)
        : Result.Error(
            `tags mismatch, expected [${expectedTags.join(", ")}], got [${actualTags.join(", ")}]`,
          );
    });

/**
 * Check a translation against its reference (en.json) message:
 * both must be valid ICU messages, with the same arguments ({name}, {count, plural, ...}) and the same tags
 * Returns the error, if any
 */
export const checkIcuMessage = (baseMessage: string, translation: string): Option<string> =>
  Result.allFromDict({
    base: parseMessage(baseMessage).mapError(error => `invalid ICU message in en.json (${error})`),
    translation: parseMessage(translation).mapError(error => `invalid ICU message (${error})`),
  })
    .flatMap(({ base, translation }) => compareMessages(base, translation))
    .match({
      Ok: () => Option.None(),
      Error: error => Option.Some(error),
    });
