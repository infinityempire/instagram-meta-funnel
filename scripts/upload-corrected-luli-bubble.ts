import { uploadPrivateYouTubeVideo } from "../server/youtube/uploader";
import { createPrivateKidsUploadMetadata } from "../server/youtube/uploadPolicy";

const ownerOpenId = process.env.OWNER_OPEN_ID;
if (!ownerOpenId) throw new Error("OWNER_OPEN_ID is required");

const result = await uploadPrivateYouTubeVideo({
  ownerOpenId,
  filePath: "/home/ubuntu/kids-stories-brand-project/experiments/L2_luli_bubble_continuity_fixed_v2.mp4",
  metadata: createPrivateKidsUploadMetadata({
    title: "לולי הארנבת והבועה הקופצת",
    description: "בועה שובבה קפצה ללולי מכל הכיוונים. מה קרה כשהיא נחתה על האף שלה? סיפור מקורי ועדין לילדים. #ילדים #עברית #סיפורקצר #Shorts",
    tags: ["סיפור לילדים", "ילדים", "עברית", "לולי הארנבת", "Shorts"],
  }),
});

console.log(JSON.stringify({ videoId: result.videoId, privacyStatus: result.privacyStatus }));
