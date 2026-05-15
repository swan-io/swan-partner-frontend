Automatically detect and remove obsolete (stale) feature flags identified by the TGGL API.

## Instructions

1. **Scan:** Run the command `pnpm detect-unused-feature-flag`.
2. **Analysis:** Analyze the script output. Each line follows the format: `- FILE:LINE | FLAG_NAME (default value: DEFAULT_VALUE)`.
3. **Refactoring:** For each entry found:
   - Open the specified file at the indicated line.
   - Locate the line related to `useFlag("FLAG_NAME")`.
   - **Replacement Rules:**
     - If the value is a **boolean**: Remove the `useFlag` instruction and any dead code branches (e.g., if `true`, keep the `if` block body and remove the `else` block).
     - Otherwise: Replace the flag call with its `DEFAULT_VALUE`.
   - **Cleanup:**
     - Remove any variables that are no longer used after the replacement.
     - Remove the `useFlag` import if it is no longer used in the file.
4. **Verification:** Run `pnpm typecheck`.
   - If TypeScript returns errors: Analyze them, fix the code, and repeat step 4 until no errors remain.
5. **Reporting:** Summarize the changes in a list. For each modified file, provide a confidence level (e.g., "✅ Safe" for simple booleans, "⚠️ Review needed" for complex logic).
