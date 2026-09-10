import { Option } from "@swan-io/boxed";
import { expect, test, vi } from "vitest";
import { hashIdentifier, sanitizePathname, sanitizeProperties, sanitizeUrl } from "../redaction";

const ONBOARDING_ID = "3f2b8c1a-4d5e-4f60-9a7b-1c2d3e4f5a6b";
const COLLECTION_ID = "9E4B7C2D-1A3F-4B5C-8D6E-7F809A1B2C3D";
const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

test("sanitizePathname replaces identifier segments", () => {
  expect(sanitizePathname(`/onboardings/${ONBOARDING_ID}/documents`)).toBe(
    "/onboardings/<id>/documents",
  );
  expect(sanitizePathname(`/supporting-document-collection/${COLLECTION_ID}/success`)).toBe(
    "/supporting-document-collection/<id>/success",
  );
  expect(sanitizePathname(`/projects/${ONBOARDING_ID}/onboardings/${ONBOARDING_ID}`)).toBe(
    "/projects/<id>/onboardings/<id>",
  );
});

test("sanitizePathname replaces opaque tokens", () => {
  expect(sanitizePathname("/invitation/aGVsbG8tdGhlcmUtZnJpZW5kMTIz")).toBe("/invitation/<id>");
});

test("sanitizePathname keeps route segments", () => {
  expect(sanitizePathname("/power-of-attorney-template/en-1.pdf")).toBe(
    "/power-of-attorney-template/en-1.pdf",
  );
  expect(sanitizePathname("/")).toBe("/");
});

test("sanitizeUrl strips identifiers, query strings and fragments", () => {
  expect(sanitizeUrl(`https://onboarding.swan.io/onboardings/${ONBOARDING_ID}/email`)).toBe(
    "https://onboarding.swan.io/onboardings/<id>/email",
  );
  expect(
    sanitizeUrl(`https://onboarding.swan.io/onboardings/${ONBOARDING_ID}?consent_challenge=abc`),
  ).toBe("https://onboarding.swan.io/onboardings/<id>");
  expect(sanitizeUrl("https://onboarding.swan.io/x#login_challenge=abc")).toBe(
    "https://onboarding.swan.io/x",
  );
  expect(sanitizeUrl("not a url")).toBe("<invalid-url>");
});

test("sanitizeProperties scrubs every url-shaped value", () => {
  const properties = {
    $current_url: `https://onboarding.swan.io/onboardings/${ONBOARDING_ID}`,
    $initial_current_url: `https://onboarding.swan.io/onboardings/${ONBOARDING_ID}`,
    $referrer: `https://onboarding.swan.io/onboardings/${ONBOARDING_ID}/email`,
    $pathname: `/onboardings/${ONBOARDING_ID}`,
    $initial_pathname: `/onboardings/${ONBOARDING_ID}`,
    $host: "onboarding.swan.io",
    application: "onboarding",
  };

  expect(sanitizeProperties(properties)).toStrictEqual({
    $current_url: "https://onboarding.swan.io/onboardings/<id>",
    $initial_current_url: "https://onboarding.swan.io/onboardings/<id>",
    $referrer: "https://onboarding.swan.io/onboardings/<id>/email",
    $pathname: "/onboardings/<id>",
    $initial_pathname: "/onboardings/<id>",
    $host: "onboarding.swan.io",
    application: "onboarding",
  });
});

test("sanitizeProperties leaves non-string values untouched", () => {
  expect(sanitizeProperties({ count: 1, flag: true, missing: null })).toStrictEqual({
    count: 1,
    flag: true,
    missing: null,
  });
});

test("hashIdentifier is deterministically", async () => {
  await expect(hashIdentifier(ONBOARDING_ID)).resolves.toStrictEqual(
    Option.Some("cdabd615e370b6e48383f8ccd98cd937"),
  );
  await expect(hashIdentifier(COLLECTION_ID)).resolves.toStrictEqual(
    Option.Some("0e3e467ab57494e38822e1860ad5370a"),
  );
});

test("hashIdentifier yields None rather than the raw identifier when crypto is unavailable", async () => {
  vi.stubGlobal("crypto", {});

  try {
    await expect(hashIdentifier(ONBOARDING_ID)).resolves.toStrictEqual(Option.None());
  } finally {
    vi.unstubAllGlobals();
  }
});
