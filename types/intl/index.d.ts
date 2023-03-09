// Add the DisplayNames related code from what will be in the next version of Typescript (under the es2020 lib).
// It's taken from this PR https://github.com/microsoft/TypeScript/pull/45647. It's merged but they didn't run `gulp LKG`.
declare namespace Intl {
  /**
   * [BCP 47 language tag](http://tools.ietf.org/html/rfc5646) definition.
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#locales_argument).
   */
  type BCP47LanguageTag = string;

  /**
   * The locale matching algorithm to use.
   *
   * [MDN](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_negotiation).
   */
  type RelativeTimeFormatLocaleMatcher = "lookup" | "best fit";

  /**
   * The length of the internationalized message.
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat/RelativeTimeFormat#Parameters).
   */
  type RelativeTimeFormatStyle = "long" | "short" | "narrow";

  interface DisplayNamesOptions {
    localeMatcher: RelativeTimeFormatLocaleMatcher;
    style: RelativeTimeFormatStyle;
    type: "language" | "region" | "script" | "currency";
    fallback: "code" | "none";
  }

  interface DisplayNames {
    /**
     * Receives a code and returns a string based on the locale and options provided when instantiating
     * [`Intl.DisplayNames()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DisplayNames)
     *
     * @param code The `code` to provide depends on the `type` passed to display name during creation:
     *  - If the type is `"region"`, code should be either an [ISO-3166 two letters region code](https://www.iso.org/iso-3166-country-codes.html),
     *    or a [three digits UN M49 Geographic Regions](https://unstats.un.org/unsd/methodology/m49/).
     *  - If the type is `"script"`, code should be an [ISO-15924 four letters script code](https://unicode.org/iso15924/iso15924-codes.html).
     *  - If the type is `"language"`, code should be a `languageCode` ["-" `scriptCode`] ["-" `regionCode` ] *("-" `variant` )
     *    subsequence of the unicode_language_id grammar in [UTS 35's Unicode Language and Locale Identifiers grammar](https://unicode.org/reports/tr35/#Unicode_language_identifier).
     *    `languageCode` is either a two letters ISO 639-1 language code or a three letters ISO 639-2 language code.
     *  - If the type is `"currency"`, code should be a [3-letter ISO 4217 currency code](https://www.iso.org/iso-4217-currency-codes.html).
     *
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DisplayNames/of).
     */
    of(code: string): string;
    /**
     * Returns a new object with properties reflecting the locale and style formatting options computed during the construction of the current
     * [`Intl/DisplayNames`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DisplayNames) object.
     *
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DisplayNames/resolvedOptions).
     */
    resolvedOptions(): DisplayNamesOptions;
  }

  /**
   * The [`Intl.DisplayNames()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DisplayNames)
   * object enables the consistent translation of language, region and script display names.
   *
   * [Compatibility](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DisplayNames#browser_compatibility).
   */
  const DisplayNames: {
    prototype: DisplayNames;

    /**
     * @param locales A string with a BCP 47 language tag, or an array of such strings.
     *   For the general form and interpretation of the `locales` argument, see the [Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#locale_identification_and_negotiation)
     *   page.
     *
     * @param options An object for setting up a display name.
     *
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DisplayNames/DisplayNames).
     */
    new (
      locales?: BCP47LanguageTag | BCP47LanguageTag[],
      options?: Partial<DisplayNamesOptions>,
    ): DisplayNames;

    /**
     * Returns an array containing those of the provided locales that are supported in display names without having to fall back to the runtime's default locale.
     *
     * @param locales A string with a BCP 47 language tag, or an array of such strings.
     *   For the general form and interpretation of the `locales` argument, see the [Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#locale_identification_and_negotiation)
     *   page.
     *
     * @param options An object with a locale matcher.
     *
     * @returns An array of strings representing a subset of the given locale tags that are supported in display names without having to fall back to the runtime's default locale.
     *
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DisplayNames/supportedLocalesOf).
     */
    supportedLocalesOf(
      locales: BCP47LanguageTag | BCP47LanguageTag[],
      options?: { localeMatcher: RelativeTimeFormatLocaleMatcher },
    ): BCP47LanguageTag[];
  };
}
