# הכנת בעל החשבון לחיבור הרשמי ל-Meta

מסמך זה מיועד לבעל חשבון המותג `smallstories170`. הוא מכין את החיבורים הרשמיים לפני שמחברים את פלטפורמת **Instagram Meta Funnel** ל-Instagram. ההגדרות נעשות בחשבונות Meta ו-Instagram של הבעלים בלבד; אין לבצע אוטומציית דפדפן, עקיפת אימות או שיתוף סיסמאות.

## מסלול האינטגרציה שנבחר

הפרויקט משתמש ב-**Business Login for Instagram** וב-Instagram API with Instagram Login. זהו המסלול המתאים לחשבון מותג יחיד שמנוהל בידי בעליו, והוא תומך בפרסום תוכן, תגובות, הודעות, Webhooks ו-Insights בלי לחייב Facebook Page מקושר. [1]

| רכיב | מה צריך להכין | מי מבצע |
|---|---|---|
| חשבון Instagram | חשבון מקצועי מסוג Creator או Business, רצוי ציבורי לצורכי מותג | בעל החשבון באפליקציית Instagram |
| חשבון Meta for Developers | חשבון בעלים שמסוגל ליצור App חדש | בעל החשבון |
| אפליקציית Meta | App אחד ייעודי לפרויקט, עם מוצר Instagram API with Instagram Login | בעל החשבון |
| כתובת Webhook | כתובת HTTPS של הפלטפורמה, שתסתיים ב-`/api/meta/webhook` | הפלטפורמה אחרי פריסה |
| הסכמה והרשאות | בעל החשבון נותן הרשאה רק לחשבון המותג שלו | בעל החשבון |

## שלבים באפליקציית Instagram

תחילה יש לפתוח את פרופיל `smallstories170`, להיכנס להגדרות החשבון ולהחליף לחשבון מקצועי אם הוא עדיין אישי. עבור מותג סיפורי ילדים, אפשר לבחור קטגוריה כגון **Digital creator**, **Education** או **Personal blog**, בהתאם למה שמופיע באפליקציה. יש להוסיף שם תצוגה ברור, ביוגרפיה וקישור לערוץ YouTube רק לאחר שהפרופיל מוכן.

לאחר מכן כדאי לאמת את כתובת המייל של החשבון ולהפעיל אימות דו-שלבי, אם האפשרות זמינה. אלה צעדי הגנה לחשבון, ולא פרטים שצריך למסור לפלטפורמה או להכניס למאגר הקוד.

## שלבים ב-Meta for Developers

יש להיכנס ל-[Meta for Developers](https://developers.facebook.com/), ליצור אפליקציה חדשה עבור המותג, ולהוסיף לה את מוצר Instagram במסלול **Instagram API with Instagram Login**. במסך ההגדרות של המוצר יש להגדיר את ה-redirect URI רק לאחר שהפלטפורמה נפרסת ומציגה כתובת HTTPS סופית. נתיב ה-OAuth שייושם בפלטפורמה הוא:

```text
https://<domain>/api/meta/oauth/callback
```

זהו נתיב OAuth נפרד מנתיב ה-Webhook. נתיב ה-Webhook נשאר `https://<domain>/api/meta/webhook`.

האפליקציה תתחיל בדרך כלל במצב פיתוח. במצב הזה החשבון של הבעלים יכול לשמש לבדיקה כאשר הוא נוסף כבעל תפקיד מתאים באפליקציה. אם בעתיד מחברים חשבונות שאינם מנוהלים בידי בעלי התפקידים באפליקציה, או משתמשים בגישה מתקדמת, Meta עשויה לדרוש Advanced Access, App Review ואימות עסקי. [1]

## הרשאות שצריך לבקש

הפלטפורמה תבקש רק את ההרשאות המינימליות הדרושות לפעולות שבעל החשבון מאשר. עבור מסלול Instagram Login, תכנן את ההרשאות הבאות:

| יכולת בפלטפורמה | הרשאת Meta מתאימה |
|---|---|
| זיהוי החשבון ונתונים בסיסיים | `instagram_business_basic` |
| פרסום Reels ופוסטים | `instagram_business_content_publish` |
| קריאה וניהול תגובות | `instagram_business_manage_comments` |
| קבלת וניהול הודעות Instagram | `instagram_business_manage_messages` |

ההרשאות הסופיות והפיצ'רים הזמינים תלויים בהגדרות האפליקציה ובגישה שמאושרת ב-Meta. יש לאמת אותם במסך המוצר לפני חיבור הייצור. [1]

## הגדרת Webhook לאחר פריסת הפלטפורמה

לאחר שהפלטפורמה נפרסת, בעל החשבון יגדיר ב-Meta App Dashboard כתובת Callback HTTPS בפורמט הבא:

```text
https://<domain>/api/meta/webhook
```

Meta תשלח בקשת אימות עם `hub.mode`, `hub.verify_token` ו-`hub.challenge`. השרת מחזיר את `hub.challenge` רק אם ה-verify token תואם. אירועי POST מגיעים עם חתימת `X-Hub-Signature-256`, והשרת מאמת אותה באמצעות App Secret. [2]

יש להירשם רק לשדות הנחוצים, כגון `messages`, `message_reactions`, `comments` ו-`mentions`, לפי השימוש שאושר בפועל. השרת שומר סיכום בטוח של האירוע ולא שומר טוקנים או תוכן פרטי מלא.

## כללי בטיחות

אין להעתיק למסמך, ל-GitHub, לצ'אט, לצילומי מסך או ללוגים את App Secret, access token, verify token, סיסמאות, קודי אימות או קישור פנימי של WhatsApp funnel. את הערכים מזינים רק דרך מנהל הסודות של הפרויקט לאחר שהקוד מוכן.

## מקורות

[1]: https://developers.facebook.com/documentation/instagram-platform/overview "Instagram Platform Overview — Meta for Developers"
[2]: https://developers.facebook.com/documentation/instagram-platform/webhooks "Setup Webhooks Subscriptions — Meta for Developers"
