import { getYouTubeAccessToken } from "../server/youtube/uploader";

const ownerOpenId = process.env.OWNER_OPEN_ID;
if (!ownerOpenId) throw new Error("OWNER_OPEN_ID is required");
const ids = ["D0v0k88WUP0", "NqcUNh8SlIs", "cqsnDTa6vqs", "OAOAiCiLPvQ", "N6g_8rBvk2k"];
const token = await getYouTubeAccessToken(ownerOpenId);
const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=status&id=${ids.join(",")}`, { headers: { authorization: `Bearer ${token}` } });
if (!response.ok) throw new Error(`YouTube status verification failed: HTTP ${response.status}`);
const body = await response.json() as { items: Array<{ id: string; status: { containsSyntheticMedia?: boolean; madeForKids?: boolean; privacyStatus?: string } }> };
console.log(JSON.stringify(body.items.map(item => ({ id: item.id, ...item.status }))));
