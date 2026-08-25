import { describe, expect, it } from "vitest";
import { createPrivateKidsUploadMetadata } from "./uploadPolicy";

describe("private YouTube upload policy", () => {
  it("always emits a private, made-for-kids, AI-disclosed video payload", () => {
    expect(createPrivateKidsUploadMetadata({
      title: "  לולי והירח הקטן  ",
      description: "  סיפור קצר לילדים.  ",
      tags: ["ילדים", "  סיפורים  ", "ילדים", ""],
    })).toEqual({
      snippet: {
        title: "לולי והירח הקטן",
        description: "סיפור קצר לילדים.",
        tags: ["ילדים", "סיפורים"],
        categoryId: "22",
      },
      status: {
        privacyStatus: "private",
        selfDeclaredMadeForKids: true,
        containsSyntheticMedia: true,
        publicStatsViewable: false,
      },
    });
  });

  it("refuses incomplete metadata instead of creating an unsafe draft", () => {
    expect(() => createPrivateKidsUploadMetadata({ title: "", description: "תיאור" })).toThrow("title");
    expect(() => createPrivateKidsUploadMetadata({ title: "כותרת", description: "" })).toThrow("description");
  });
});
