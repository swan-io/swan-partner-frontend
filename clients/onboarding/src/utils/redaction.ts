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

// Mask a uuid so telemetry can correlate a funnel without holding the raw id.
// Anything that isn't a uuid is masked whole: that reasoning only holds here,
export const maskUuid = (value: string) =>
  UUID.test(value) ? `********-****-****-****-${value.slice(-12)}` : "*".repeat(value.length);
