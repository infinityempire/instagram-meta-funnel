import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db", () => ({
  insertWebhookEvent: vi.fn(),
  listActiveKeywords: vi.fn(),
  insertLead: vi.fn(),
  markWebhookEventProcessed: vi.fn(),
  markWebhookEventFailed: vi.fn(),
}));

vi.mock("./leadForwarding", () => ({ forwardLeadToFunnel: vi.fn() }));

import * as db from "../db";
import { forwardLeadToFunnel } from "./leadForwarding";
import { processWebhookPayload } from "./webhooks";

describe("webhook lead routing", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates and forwards one minimal lead for a matching DM keyword", async () => {
    vi.mocked(db.insertWebhookEvent).mockResolvedValue({ id: 44, duplicate: false });
    vi.mocked(db.listActiveKeywords).mockResolvedValue([{ keyword: "פרטים" }] as never);
    vi.mocked(db.insertLead).mockResolvedValue({ id: 88 } as never);
    const result = await processWebhookPayload(Buffer.from('{"object":"instagram"}'), {
      object: "instagram",
      entry: [{ messaging: [{ sender: { id: "scoped-user" }, timestamp: 1_700_000_000_000, message: { text: "אשמח לפרטים" } }] }],
    });
    expect(result).toEqual({ duplicate: false, leadsCreated: 1 });
    expect(db.insertLead).toHaveBeenCalledWith(expect.objectContaining({ webhookEventId: 44, instagramScopedUserId: "scoped-user", keyword: "פרטים" }));
    expect(forwardLeadToFunnel).toHaveBeenCalledWith(88);
    expect(db.markWebhookEventProcessed).toHaveBeenCalledWith(44);
  });

  it("does not parse, store, or forward a duplicate delivery", async () => {
    vi.mocked(db.insertWebhookEvent).mockResolvedValue({ id: 44, duplicate: true });
    const result = await processWebhookPayload(Buffer.from("duplicate"), { object: "instagram" });
    expect(result).toEqual({ duplicate: true, leadsCreated: 0 });
    expect(db.listActiveKeywords).not.toHaveBeenCalled();
    expect(db.insertLead).not.toHaveBeenCalled();
    expect(forwardLeadToFunnel).not.toHaveBeenCalled();
  });
});
