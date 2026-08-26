import * as db from "../server/db";

const ownerOpenId = process.env.OWNER_OPEN_ID;
if (!ownerOpenId) throw new Error("OWNER_OPEN_ID is required");

const uploaded = [
  { youtubeVideoId: "D0v0k88WUP0", sourceFilename: "P2_pitzi_flower_final.mp4", title: "פיצי הענן והפרח הצמא", storyWorld: "פיצי הענן" },
  { youtubeVideoId: "NqcUNh8SlIs", sourceFilename: "L1_luli_moon_synced.mp4", title: "לולי הארנבת והירח הקטן", storyWorld: "לולי הארנבת" },
  { youtubeVideoId: "cqsnDTa6vqs", sourceFilename: "L2_luli_bubble_precise_sync.mp4", title: "לולי הארנבת והבועה הקופצת", storyWorld: "לולי הארנבת" },
  { youtubeVideoId: "OAOAiCiLPvQ", sourceFilename: "T1_tommy_yellow_final.mp4", title: "טומי הרכבת מחפש צבע צהוב", storyWorld: "טומי הרכבת" },
  { youtubeVideoId: "N6g_8rBvk2k", sourceFilename: "T2_tommy_cloud_final.mp4", title: "טומי הרכבת והענן הממהר", storyWorld: "טומי הרכבת" },
];

for (const video of uploaded) {
  await db.upsertYouTubeVideo({
    ownerOpenId,
    ...video,
    visibility: "private",
    madeForKids: true,
    containsSyntheticMedia: true,
  });
}

console.log(JSON.stringify({ recorded: uploaded.length, visibility: "private" }));
process.exit(0);
