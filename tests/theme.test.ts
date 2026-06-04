import assert from "node:assert/strict";
import { test } from "node:test";

import { normalizeThemePreference, themePreferenceToAttribute } from "../src/lib/theme";

test("normalizes supported theme preferences", () => {
  assert.equal(normalizeThemePreference("LIGHT"), "LIGHT");
  assert.equal(normalizeThemePreference("DARK"), "DARK");
});

test("falls back to LIGHT for unsupported theme preferences", () => {
  assert.equal(normalizeThemePreference(undefined), "LIGHT");
  assert.equal(normalizeThemePreference(null), "LIGHT");
  assert.equal(normalizeThemePreference("SYSTEM"), "LIGHT");
});

test("maps theme preferences to data-theme attributes", () => {
  assert.equal(themePreferenceToAttribute("LIGHT"), "light");
  assert.equal(themePreferenceToAttribute("DARK"), "dark");
  assert.equal(themePreferenceToAttribute("SYSTEM"), "light");
});
