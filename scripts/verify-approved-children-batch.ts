import { getUploadedVideoStatus } from "../server/youtube/uploader";

const ownerOpenId = process.env.OWNER_OPEN_ID;
if (!ownerOpenId) throw new Error("OWNER_OPEN_ID is required");

const uploaded = [
  { file: "P2_pitzi_flower_final.mp4", videoId: "D0v0k88WUP0" },
  { file: "L1_luli_moon_synced.mp4", videoId: "NqcUNh8SlIs" },
  { file: "L2_luli_bubble_precise_sync.mp4", videoId: "cqsnDTa6vqs" },
  { file: "T1_tommy_yellow_final.mp4", videoId: "OAOAiCiLPvQ" },
  { file: "T2_tommy_cloud_final.mp4", videoId: "N6g_8rBvk2k" },
];

const results = [];
for (const item of uploaded) {
  const status = await getUploadedVideoStatus(ownerOpenId, item.videoId);
  if (status.privacyStatus !== "private" || !status.madeForKids || !status.selfDeclaredMadeForKids) {
    throw new Error(`Video ${item.file} did not retain the required private Made for Kids status`);
  }
  results.push({ file: item.file, ...status });
}

console.log(JSON.stringify({ verified: results }));
process.exit(0);
