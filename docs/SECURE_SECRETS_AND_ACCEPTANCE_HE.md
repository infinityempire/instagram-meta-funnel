# מפת סודות ותרחישי קבלה

מסמך זה מפריד בין הערכים שבעל החשבון צריך להשיג לבין הקוד. אין למלא ערכים אמיתיים במסמך זה.

## מפת הסודות

| משתנה סביבה | מקור רשמי | שימוש בשרת | אסור לחשוף |
|---|---|---|---|
| `META_APP_ID` | Meta App Dashboard | זיהוי האפליקציה ותהליך OAuth | לא להציג ללקוח ללא צורך |
| `META_APP_SECRET` | Meta App Dashboard | אימות HMAC של Webhook | לעולם לא בלוגים או Git |
| `META_VERIFY_TOKEN` | ערך אקראי שבעל החשבון יוצר | השוואת GET challenge | לעולם לא בצד לקוח |
| `META_ACCESS_TOKEN` | Business Login for Instagram לאחר הסכמה | קריאות Graph API | לעולם לא בלוגים או Git |
| `META_INSTAGRAM_ACCOUNT_ID` | תגובת Meta API לאחר החיבור | יעד לפרסום וקריאת Insights | לא רגיש כמו token, אך נשאר בשרת |
| `META_GRAPH_API_VERSION` | גרסה שנבחרה לפי תיעוד Meta | קביעת base URL | אפשר להציג סטטוס בלבד |
| `WHATSAPP_FUNNEL_WEBHOOK_URL` | מערכת ה-funnel הקיימת | העברת ליד מותאם | לא ב-Git או בצד לקוח |

בעל החשבון מכניס ערכים אלה רק דרך מסך ניהול הסודות של הפרויקט. הפלטפורמה תחזיר רק סטטוס מסוג "Configured" או "Missing" לכל רכיב, ללא הערך עצמו.

## תרחישי קבלה לפני חיבור ייצור

| תרחיש | פעולה | תוצאה צפויה |
|---|---|---|
| אימות Webhook | Meta שולחת GET challenge | השרת מחזיר `hub.challenge` רק עם verify token תקין |
| חתימה שגויה | שולחים POST עם HMAC לא תקין | תשובת 401, אירוע לא מעובד, ללא חשיפת גוף רגיש |
| הודעת DM עם מילה פעילה | שולחים הודעת בדיקה מחשבון tester | נוצר אירוע בטוח, ליד נשמר, ונשלח payload מצומצם ל-funnel |
| אירוע כפול | Meta שולחת אותו אירוע שוב | לא נוצר ליד כפול ולא מבוצעת שליחה כפולה |
| פרסום Reel | בעל החשבון מפעיל טופס עם URL ציבורי | container נוצר, סטטוס נשמר, publish רק בפעולה מפורשת |
| Reel שנוצר ב-AI | בעל החשבון מסמן AI | הבקשה כוללת `is_ai_generated=true` |
| תובנות | מפעילים רענון לתוכן מפורסם | נוצרת snapshot חדשה וגרף מציג רק נתונים אמיתיים |
| שגיאת Meta זמנית | ה-API מחזיר 429 או 5xx | מספר ניסיונות מוגבל, שגיאה בטוחה וסטטוס ברור בדשבורד |

## תנאי קבלה לאבטחה

כל הבדיקות חייבות לעבור בלי טוקנים או סודות בפלט מסוף, ב-HTTP responses, בדשבורד, בקבצי source control או בקבצי test snapshots. לוגים יתעדו רק מזהה פעולה, סוג אירוע, סטטוס, מספר ניסיון וסיכום שגיאה שעבר ניקוי.

## מקור

[1](https://developers.facebook.com/documentation/instagram-platform/webhooks) — Meta Webhooks דורשים אימות verify token ואימות חתימת `X-Hub-Signature-256`.

[2](https://developers.facebook.com/documentation/instagram-platform/content-publishing) — פרסום תוכן משתמש ב-media container, סטטוס פרסום ו-`media_publish`.
