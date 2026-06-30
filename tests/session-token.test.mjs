import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createSessionToken, parseSessionToken } from "../src/lib/auth/session-token.mjs";

describe("session token", () => {
  it("rejects plain user id cookies", () => {
    assert.equal(parseSessionToken("cm123", "secret"), null);
  });

  it("returns the user id from a signed session token", () => {
    const token = createSessionToken("cm123", "secret");

    assert.equal(parseSessionToken(token, "secret"), "cm123");
  });

  it("rejects tampered signed session tokens", () => {
    const token = createSessionToken("cm123", "secret");
    const tamperedToken = `${token.slice(0, -1)}x`;

    assert.equal(parseSessionToken(tamperedToken, "secret"), null);
  });
});
