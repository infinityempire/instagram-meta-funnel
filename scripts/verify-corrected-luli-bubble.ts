import { getUploadedVideoStatus } from "../server/youtube/uploader";

const ownerOpenId = process.env.OWNER_OPEN_ID;
if (!ownerOpenId) throw new Error("OWNER_OPEN_ID is required");
console.log(JSON.stringify(await getUploadedVideoStatus(ownerOpenId, "aPmgK2umLvE")));
