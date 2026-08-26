import { uploadPrivateYouTubeVideo } from "../server/youtube/uploader";
import { createPrivateKidsUploadMetadata } from "../server/youtube/uploadPolicy";

const root = "/home/ubuntu/kids-stories-brand-project/experiments";
const ownerOpenId = process.env.OWNER_OPEN_ID;
if (!ownerOpenId) throw new Error("OWNER_OPEN_ID is required");

const approvedBatch = [
  {
    file: "P2_pitzi_flower_final.mp4",
    title: "פיצי הענן והפרח הצמא",
    description: "פיצי הענן עוזר לפרח קטן וצמא. סיפור קצר, מקורי ועדין לילדים. #סיפורלילדים #ילדים #עברית #Shorts",
    tags: ["סיפור לילדים", "ילדים", "עברית", "פיצי הענן", "Shorts"],
  },
  {
    file: "L1_luli_moon_synced.mp4",
    title: "לולי הארנבת והירח הקטן",
    description: "לולי מצאה ירח קטן שהלך לאיבוד והחזירה אותו לשמיים. סיפור מקורי לילדים. #סיפורלילדים #ילדים #עברית #Shorts",
    tags: ["סיפור לילדים", "ילדים", "עברית", "לולי הארנבת", "Shorts"],
  },
  {
    file: "L2_luli_bubble_precise_sync.mp4",
    title: "לולי הארנבת והבועה הקופצת",
    description: "בועה שובבה קפצה ללולי מכל הכיוונים. מה קרה כשהיא נחתה על האף שלה? #ילדים #עברית #סיפורקצר #Shorts",
    tags: ["סיפור לילדים", "ילדים", "עברית", "לולי הארנבת", "Shorts"],
  },
  {
    file: "T1_tommy_yellow_final.mp4",
    title: "טומי הרכבת מחפש צבע צהוב",
    description: "איפה מסתתר הצבע הצהוב? מצאו אותו עם טומי הרכבת. משחק צבעים קצר לילדים. #ילדים #לומדיםצבעים #עברית #Shorts",
    tags: ["ילדים", "לומדים צבעים", "עברית", "טומי הרכבת", "Shorts"],
  },
  {
    file: "T2_tommy_cloud_final.mp4",
    title: "טומי הרכבת והענן הממהר",
    description: "טומי עוזר לענן קטן לעצור, לנשום לאט ולהמשיך בשמחה. #ילדים #עברית #סיפורקצר #Shorts",
    tags: ["ילדים", "סיפור לילדים", "עברית", "טומי הרכבת", "Shorts"],
  },
];

const results: Array<{ file: string; videoId: string }> = [];
for (const item of approvedBatch) {
  const result = await uploadPrivateYouTubeVideo({
    ownerOpenId,
    filePath: `${root}/${item.file}`,
    metadata: createPrivateKidsUploadMetadata({
      title: item.title,
      description: item.description,
      tags: item.tags,
    }),
  });
  results.push({ file: item.file, videoId: result.videoId });
}

console.log(JSON.stringify({ uploaded: results, privacyStatus: "private" }));
