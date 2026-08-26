# פרומפט ל־OpenHands: השלמת YouTube API Compliance Audit

פעל כסוכן תפעול זהיר. המטרה שלך היא **למלא ולהגיש רק אם ניתן באופן רשמי** את טופס ביקורת התאימות של YouTube Data API עבור כלי פנימי להעלאת סרטוני ילדים בעברית.

## גבולות מחייבים

- אל תבקש, תעתיק, תשמור או תציג סיסמה, קוד 2FA, קוד SMS, Client Secret, Refresh Token או פרטי כרטיס.
- אל תעקוף CAPTCHA, הגנת Google, בוחר קבצים, או כל מגבלת דפדפן באמצעות Selenium, Playwright, זיוף אירועי משתמש או פרצה אחרת.
- אם הדפדפן אינו מחובר, בקש מהבעלים להתחבר בעצמו בדפדפן. אל תבקש פרטי התחברות בצ׳אט.
- אל תגיש את הטופס אם לא קיימת הסכמה מפורשת של הבעלים במסך הפעיל. אם ההסכמה קיימת, שלח רק אחרי בדיקת כל השדות.
- אל תמציא עובדות, נתוני שימוש, כתובות או מדיניות שלא קיימים.

## הטופס

פתח את הטופס הרשמי:

`https://support.google.com/youtube/contact/yt_api_form?hl=en`

יש להשתמש בחשבון Google שמחזיק בפרויקט: `tal.derie.td@gmail.com`. אם נדרשת התחברות, הבעלים חייב לבצע אותה בעצמו.

## פרטי הפרויקט והלקוח

| שדה | ערך |
|---|---|
| Request type | **Complete a compliance audit to request for additional quota** |
| Google Cloud project ID | `tal-derie-youtube-upload` |
| Google Cloud project number | `855401426442` |
| API Client name | `Small Stories Hebrew Uploader` |
| OAuth consent configuration | `Small Stories Hebrew YouTube Uploader` |
| Client type | Web application |
| Authorized redirect URI | `https://instafunnel-lphz3bum.manus.space/api/youtube/oauth/callback` |
| Product homepage | `https://instafunnel-lphz3bum.manus.space/` |
| Privacy Policy | `https://instafunnel-lphz3bum.manus.space/privacy` |
| Terms of Service | `https://instafunnel-lphz3bum.manus.space/terms` |
| Country | Israel |
| Organization type | Individual / independent creator, if the form offers this option |

## תיאור מדויק של השירות והמודל העסקי

הדבק או התאם את התיאור הבא לשדות המתאימים:

> Small Stories Hebrew is an internal creator tool for a single owner. It uses the official YouTube Data API through OAuth to upload original Hebrew children’s short-form videos, keep uploads private by default, manage the owner’s own video metadata, and read the owner’s video performance data. It is not a public SaaS product, does not provide API access to third parties, does not sell YouTube data, and does not expose other creators’ account data.

הכלי מפיק ומנהל תוכן ילדים מקורי. סרטונים נשמרים פרטיים כברירת מחדל, ומסומנים `Made for Kids`. תוכן שנוצר או שונה ב־AI אמור להיות מסומן בהצהרת AI המתאימה. פרסום לציבור מבוצע רק תחת שליטה מפורשת של הבעלים ובהתאם למדיניות YouTube.

## השימושים וה־API

סמן רק שימושים שמתאימים בפועל:

- Creator tools / tools for a content creator.
- Internal tool for a single channel owner.
- Uploading and managing the owner’s own original videos.
- Reading the owner’s own video performance data for analytics.
- OAuth-based access with user consent.

אל תסמן שימושים של scraping, aggregation of third-party channels, resale of data, messaging, advertising automation או שימוש ציבורי שאינו קיים.

נקודות קצה רלוונטיות: `videos.insert` להעלאה פרטית, `videos.list` לאימות סטטוס, ו־YouTube Analytics reporting לקריאת מדדי ביצוע של הבעלים בלבד.

Scopes רלוונטיים: `youtube.upload`, `youtube.readonly`, `yt-analytics.readonly`, ו־`yt-analytics-monetary.readonly` במידת הצורך לקריאת נתוני הכנסה של הבעלים בלבד. הטוקנים נשמרים בצד שרת מוצפנים; אינם מוצגים ב־UI ואינם נרשמים בלוגים.

## תחזית שימוש שמרנית

בחר רק את רמת השימוש הנמוכה/שמרנית שהטופס מציע, למשל פחות מ־1,000 בקשות ביום לכל קטגוריה, אם זו אפשרות קיימת. אין לבקש נפח גבוה ללא צורך אמיתי. ההעלאה מיועדת לאצוות קטנות של סרטונים מקוריים ומעקב יומי מצומצם.

## ראיות לצירוף

צרף את אותו PDF לכל שלושת שדות הראיות אם הטופס דורש שלושה קבצים נפרדים:

`/home/ubuntu/instagram-meta-funnel/docs/audit/LEGAL_AND_OAUTH_EVIDENCE_EN.pdf`

שדות צפויים:

1. **Architecture diagram**
2. **User flow diagram**
3. **Supporting documents**

ה־PDF כולל ראיות של מדיניות פרטיות, תנאי שימוש, זרימת OAuth, חיבור YouTube וממשק הניהול. אם בוחר הקבצים של Google אינו זמין בסביבת הסוכן, אל תנסה לעקוף אותו. עצור ובקש מהבעלים לבחור את הקובץ פעם אחת בכל שדה דרך Chrome/Files במכשיר שלו.

## פרטי קשר והצהרות

הבעלים צריך למלא בעצמו כל פרט אישי/משפטי או הצהרה שמחייבים אישור אישי. אל תשמור פרטי קשר בקבצי הפרויקט. אפשר למלא נתונים טכניים מוכנים, אך עצור לפני כל הצהרה משפטית או לחיצה על Submit אם לא ניתנה הסכמה מפורשת במסך הפעיל.

## בדיקה לפני Submit

לפני שליחה ודא:

1. כל שדות החובה מסומנים כתקינים.
2. שלושת קבצי הראיות מציגים שם קובץ בפועל, ולא רק מסך טעינה.
3. כתובות Privacy Policy ו־Terms פתוחות לציבור.
4. אין הבטחה לפרסום ציבורי אוטומטי ואין שימוש בעקיפות.
5. כפתור Submit פעיל.

אחרי שליחה, תעד רק הודעת קבלה/מספר פנייה, ללא סודות או פרטים אישיים.
