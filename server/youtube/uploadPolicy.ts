export type PrivateUploadDraftInput = {
  title: string;
  description: string;
  tags?: string[];
  categoryId?: string;
};

export type PrivateUploadMetadata = {
  snippet: {
    title: string;
    description: string;
    tags?: string[];
    categoryId: string;
  };
  status: {
    privacyStatus: "private";
    selfDeclaredMadeForKids: true;
    containsSyntheticMedia: true;
    publicStatsViewable: false;
  };
};

function cleanText(value: string): string {
  return value.trim();
}

function cleanTags(tags: string[] | undefined): string[] | undefined {
  if (!tags) return undefined;
  const unique = Array.from(new Set(tags.map(cleanText).filter(Boolean)));
  return unique.length ? unique : undefined;
}

/**
 * Builds the only metadata form permitted by this project. It has no public
 * or unlisted option, so a later uploader cannot accidentally change visibility.
 */
export function createPrivateKidsUploadMetadata(input: PrivateUploadDraftInput): PrivateUploadMetadata {
  const title = cleanText(input.title);
  const description = cleanText(input.description);
  if (!title) throw new Error("A YouTube title is required");
  if (!description) throw new Error("A YouTube description is required");

  const tags = cleanTags(input.tags);
  return {
    snippet: {
      title,
      description,
      ...(tags ? { tags } : {}),
      categoryId: cleanText(input.categoryId ?? "22") || "22",
    },
    status: {
      privacyStatus: "private",
      selfDeclaredMadeForKids: true,
      containsSyntheticMedia: true,
      publicStatsViewable: false,
    },
  };
}
