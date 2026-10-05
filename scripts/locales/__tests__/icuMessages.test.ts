import { Option } from "@bloodyowl/boxed";
import { describe, expect, test } from "vitest";
import { checkIcuMessage } from "../icuMessages";

const isInvalid = (baseMessage: string, translation: string) =>
  checkIcuMessage(baseMessage, translation).isSome();

describe("checkIcuMessage", () => {
  test("accepts a valid translation", () => {
    expect(checkIcuMessage("Card", "Carte")).toEqual(Option.None());
  });

  describe("ICU arguments", () => {
    const base = "From {openingDate} to {closingDate}";

    test("accepts arguments in a different order", () => {
      expect(checkIcuMessage(base, "Bis {closingDate}, ab {openingDate}")).toEqual(Option.None());
    });

    test("rejects a renamed argument", () => {
      expect(isInvalid(base, "Du {dateOuverture} au {closingDate}")).toBe(true);
    });

    test("rejects a missing argument", () => {
      expect(isInvalid(base, "Jusqu'au {closingDate}")).toBe(true);
    });

    test("rejects an extra argument", () => {
      expect(isInvalid("Card", "Carte {name}")).toBe(true);
    });

    test("rejects an argument whose type changed", () => {
      expect(isInvalid("{count, plural, one {# item} other {# items}}", "{count} éléments")).toBe(
        true,
      );
    });

    test("rejects an invalid ICU message", () => {
      expect(checkIcuMessage(base, "Du {openingDate au {closingDate}").getOr("")).toMatch(
        /^invalid ICU message/,
      );
    });
  });

  describe("plural and select", () => {
    const plural = "{count, plural, one {# item} other {# items}}";

    test("accepts translated branches", () => {
      expect(
        checkIcuMessage(plural, "{count, plural, one {# élément} other {# éléments}}"),
      ).toEqual(Option.None());
    });

    test("doesn't read branch content as an argument", () => {
      expect(
        checkIcuMessage(plural, "{count, plural, one {un élément} other {# éléments}}"),
      ).toEqual(Option.None());
    });

    test("accepts extra plural categories needed by the target language", () => {
      expect(
        checkIcuMessage(
          plural,
          "{count, plural, one {# element} few {# elementy} many {# elementów} other {# elementu}}",
        ),
      ).toEqual(Option.None());
    });

    test("rejects a renamed plural argument", () => {
      expect(isInvalid(plural, "{nombre, plural, one {# élément} other {# éléments}}")).toBe(true);
    });

    test("rejects a missing argument nested in a branch", () => {
      expect(
        isInvalid(
          "{type, select, card {Card {name}} other {Other}}",
          "{type, select, card {Carte} other {Autre}}",
        ),
      ).toBe(true);
    });
  });

  describe("rich text tags", () => {
    const base = "From <span>{openingDate}</span> to <span>{closingDate}</span>";

    test("accepts the same tags", () => {
      expect(
        checkIcuMessage(base, "Du <span>{openingDate}</span> au <span>{closingDate}</span>"),
      ).toEqual(Option.None());
    });

    test("rejects a missing tag occurrence", () => {
      expect(checkIcuMessage(base, "Du <span>{openingDate}</span> au {closingDate}")).toEqual(
        Option.Some("tags mismatch, expected [span, span], got [span]"),
      );
    });

    test("rejects a renamed tag", () => {
      expect(isInvalid(base, "Du <bold>{openingDate}</bold> au <span>{closingDate}</span>")).toBe(
        true,
      );
    });

    test("rejects an unclosed tag", () => {
      expect(
        checkIcuMessage(base, "Du <span>{openingDate} au <span>{closingDate}</span>").getOr(""),
      ).toMatch(/^invalid ICU message/);
    });

    test("rejects a tag missing its opening bracket", () => {
      expect(
        checkIcuMessage("From <bold>{openingDate}</bold>", "Van bold>{openingDate}</bold>").getOr(
          "",
        ),
      ).toBe("invalid ICU message (UNMATCHED_CLOSING_TAG)");
    });

    test("checks tags nested in plural branches", () => {
      expect(
        checkIcuMessage(
          "{count, plural, one {<bold>#</bold> item} other {<bold>#</bold> items}}",
          "{count, plural, one {<bold>#</bold> élément} other {# éléments}}",
        ),
      ).toEqual(Option.Some("tags mismatch, expected [bold, bold], got [bold]"));
    });
  });

  test("reports an invalid base message", () => {
    expect(checkIcuMessage("From {openingDate", "Du {openingDate}").getOr("")).toMatch(
      /^invalid ICU message in en\.json/,
    );
  });
});
