import { getYouTubeAccessToken } from "../server/youtube/uploader";

const ownerOpenId = process.env.OWNER_OPEN_ID;
if (!ownerOpenId) throw new Error("OWNER_OPEN_ID is required");
const approved = ["D0v0k88WUP0", "NqcUNh8SlIs", "OAOAiCiLPvQ", "N6g_8rBvk2k"];
const token = await getYouTubeAccessToken(ownerOpenId);
const published: string[] = [];
for (const id of approved) {
  const response = await fetch("https://www.googleapis.com/youtube/v3/videos?part=status", {
    method: "PUT",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ id, status: { privacyStatus: "public", selfDeclaredMadeForKids: true, containsSyntheticMedia: true } }),
  });
  if (!response.ok) throw new Error(`Public release failed for ${id}: HTTP ${response.status}`);
  published.push(id);
}
console.log(JSON.stringify({ published, retainedPrivate: "cqsnDTa6vqs" }));
process.exit(0);
