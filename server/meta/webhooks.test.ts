import { describe, expect, it } from "vitest";
import {
  computeSignature,
  extractMessagingEvents,
  handleWebhookVerify,
  matchKeyword,
  verifyWebhookSignature,
} from "./webhooks";

describe("Meta webhook safeguards", () => {
  it("accepts only a correct HMAC SHA-256 signature", () => {
    const body = Buffer.from('{"object":"instagram"}');
    const signature = computeSignature(body, "app-secret");
    expect(verifyWebhookSignature(body, signature, "app-secret")).toBe(true);
    expect(verifyWebhookSignature(body, signature, "different-secret")).toBe(false);
    expect(verifyWebhookSignature(body, undefined, "app-secret")).toBe(false);
  });

  it("returns the challenge only when the verify token matches", () => {
    expect(handleWebhookVerify({ mode: "subscribe", token: "valid-token", challenge: "challenge" }, "valid-token"))
      .toEqual({ status: 200, body: "challenge" });
    expect(handleWebhookVerify({ mode: "subscribe", token: "wrong-token", challenge: "challenge" }, "valid-token"))
      .toEqual({ status: 403, body: "Forbidden" });
  });

  it("extracts a text message and matches a configured keyword case-insensitively", () => {
    const events = extractMessagingEvents({
      object: "instagram",
      entry: [{ messaging: [{ sender: { id: "scoped-user" }, timestamp: 1_700_000_000_000, message: { text: "אשמח לקבל פרטים" } }] }],
    });
    expect(events).toHaveLength(1);
    expect(events[0]?.senderId).toBe("scoped-user");
    expect(matchKeyword(events[0]?.text ?? "", ["מחיר", "פרטים"])).toBe("פרטים");
  });
});
