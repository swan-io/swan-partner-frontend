import { Option } from "@swan-io/boxed";

/*
 * Redaction utilty for our logger
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OPAQUE_TOKEN = /^(?=.*[A-Z0-9])[A-Za-z0-9_-]{20,}$/;

const isIdentifier = (segment: string) => UUID.test(segment) || OPAQUE_TOKEN.test(segment);

export const sanitizePathname = (pathname: string) =>
  pathname
    .split("/")
    .map(segment => (isIdentifier(segment) ? "<id>" : segment))
    .join("/");

export const sanitizeUrl = (url: string) => {
  try {
    const { origin, pathname } = new URL(url);
    return `${origin}${sanitizePathname(pathname)}`;
  } catch {
    return "<invalid-url>";
  }
};

const isUrl = (value: string) => value.startsWith("https://") || value.startsWith("http://");

export const sanitizeProperties = <T>(properties: Record<string, T>): Record<string, T | string> =>
  Object.fromEntries(
    Object.entries(properties).map(([key, value]) => {
      if (typeof value !== "string") {
        return [key, value];
      }
      if (isUrl(value)) {
        return [key, sanitizeUrl(value)];
      }
      if (key.endsWith("pathname")) {
        return [key, sanitizePathname(value)];
      }
      return [key, value];
    }),
  );

// Hash id so telemetry can correlate a funnel without holding the raw id
export const hashIdentifier = (value: string): Promise<Option<string>> => {
  if (typeof crypto?.subtle?.digest !== "function") {
    return Promise.resolve(Option.None());
  }

  return crypto.subtle
    .digest("SHA-256", new TextEncoder().encode(value))
    .then(digest =>
      Option.Some(
        Array.from(new Uint8Array(digest).slice(0, 16))
          .map(byte => byte.toString(16).padStart(2, "0"))
          .join(""),
      ),
    )
    .catch(() => Option.None());
};
