# מדריך יצירת אפליקציית Meta עבור Small Stories

מדריך זה מיועד לחשבון המקצועי **`@smallstories170`** ולמערכת החיה בכתובת `https://instafunnel-lphz3bum.manus.space`. ההגדרה נעשית רק דרך **Meta for Developers** וה־Instagram API הרשמי. אין להדביק סיסמאות, App Secret או Access Token בצ׳אט, בקוד, בקובץ או ב־Git.

## לפני שמתחילים

ודא כי `@smallstories170` הוא חשבון **Creator** מקצועי וציבורי. Meta מציינת שחשבון Creator או Business הוא תנאי לגישה ל־Instagram API, ושחשבון שמוסיפים כחשבון בדיקה חייב להיות ציבורי. [1] [2]

הכן גישה לחשבון Facebook/Meta שלך. אין עלות ליצירת אפליקציית Meta, אך Meta עשויה לדרוש אימות עסקי ו־App Review לפני הפעלה חיה או שימוש בהרשאות מתקדמות. [2]

## יצירת האפליקציה

1. היכנס ל־[Meta for Developers Apps](https://developers.facebook.com/apps/) באמצעות **Continue with Facebook**.
2. לחץ **Create App**.
3. בשלב החיבור לעסק, בחר או צור את המסגרת העסקית שלך אם Meta מבקשת זאת. לחיבור ייצור Meta דורשת עסק שעבר Business Verification. [2]
4. במסך **Use case**, בחר **Other** ואז **Next**.
5. במסך **App type**, בחר **Business** ואז **Next**. Meta דורשת סוג אפליקציה Business כדי להוסיף את מוצר Instagram. [2]
6. מלא את פרטי האפליקציה כך:

| שדה ב־Meta | ערך מומלץ |
| --- | --- |
| App name | `Small Stories Instagram Funnel` |
| Contact email | כתובת אימייל שבשליטתך ושאפשר לקבל אליה הודעות מ־Meta |
| Business portfolio | בחר את העסק שלך אם כבר קיים; אחרת השאר לפי אפשרויות המסך |

לאחר מכן לחץ **Create app**.

## הוספת מוצר Instagram וחיבור החשבון

1. במסך האפליקציה, חפש את מוצר **Instagram** ולחץ **Set up**.
2. בחר את מסלול **Manage messaging and content on Instagram** או **API setup with Instagram login**. זהו המסלול הנכון למערכת שלנו, כי היא עובדת ישירות עם Instagram Creator/Business ואינה זקוקה לדף Facebook לשלב הבסיסי. [2]
3. פתח **Instagram → API setup with Instagram login** ולחץ **Add account**.
4. התחבר ל־`@smallstories170` ואשר את ההרשאות במסך של Instagram.
5. לאחר שהחשבון מופיע ברשימה, לחץ **Generate token** לידו. Meta מציינת שטוקן שנוצר מהדשבורד תקף בדרך כלל ל־60 יום; טוקן שמגיע מ־Business Login קצר־חיים בדרך כלל. [3]

> **עצור כאן.** אל תשלח את הטוקן אליי בצ׳אט ואל תעתיק אותו למסמך. בהמשך נכניס אותו ישירות באזור הסודות המאובטח של הפרויקט.

## הגדרת Webhook

במוצר Instagram פתח **Configure webhooks** והזֵן את הערכים הבאים:

| שדה ב־Meta | ערך להזנה |
| --- | --- |
| Callback URL | `https://instafunnel-lphz3bum.manus.space/api/meta/webhook` |
| Verify token | מחרוזת סודית חדשה שתשמור רק באזור הסודות של הפרויקט |

בחר לפחות את השדה **`messages`**. הוא דרוש לקבלת DM נכנס ולהפעלת מילות המפתח. Meta מאמתת את כתובת ה־Webhook באמצעות בקשת `GET` עם `hub.verify_token`; השרת כבר מחזיר את ה־challenge רק כאשר הערך מתאים. הודעות אירוע מגיעות בבקשת `POST` חתומה ב־`X-Hub-Signature-256`, והשרת כבר מאמת את חתימת HMAC־SHA256. [4]

לאחר מכן, מתוך החלק המתאים בממשק Meta, ודא שהחשבון המקצועי שלך מסומן לקבלת subscriptions. Meta דורשת גם הרשמה של החשבון עצמו ל־webhooks, מעבר לבחירת השדה בדשבורד. [4]

## סודות להזנה באזור המאובטח של האתר

אחרי שיצרת את האפליקציה והטוקן, נכניס את הערכים במסך **Settings → Secrets** של פרויקט האתר. הערכים עצמם אינם נכתבים בקוד ולא נשלחים בצ׳אט.

| שם הסוד | מאיפה מקבלים אותו |
| --- | --- |
| `META_APP_ID` | Meta App Dashboard → App settings → Basic |
| `META_APP_SECRET` | Meta App Dashboard → App settings → Basic |
| `META_VERIFY_TOKEN` | המחרוזת הסודית שבחרת בהגדרת ה־Webhook |
| `META_ACCESS_TOKEN` | Instagram → API setup with Instagram login → Generate token |
| `META_INSTAGRAM_ACCOUNT_ID` | מזהה `user_id` של `@smallstories170`, שמתקבל מבקשת `/me?fields=user_id,username` עם הטוקן [3] |
| `META_GRAPH_API_VERSION` | `v26.0` |
| `WHATSAPP_FUNNEL_WEBHOOK_URL` | כתובת ה־endpoint של ה־WhatsApp funnel הקיים שלך |

## הרשאות, מצב פיתוח והפעלה חיה

לבדיקה עם החשבון שלך, הוסף את `@smallstories170` לחשבונות הבדיקה של האפליקציה. לפני מעבר למצב **Live** או שימוש עם חשבונות מחוץ לתפקידי האפליקציה, יש להשלים Business Verification ו־App Review לפי דרישת Meta. ההרשאות הרלוונטיות למערכת הן:

| צורך במערכת | הרשאה רלוונטית |
| --- | --- |
| קריאת החשבון והמדיה | `instagram_business_basic` |
| קבלת DM ולכידת לידים | `instagram_business_manage_messages` |
| פרסום Reel ידני | `instagram_business_content_publish` |
| רענון מדדי Reach ומעורבות | `instagram_business_manage_insights` |
| ניהול תגובות, אם תפעיל אותו בעתיד | `instagram_business_manage_comments` |

Meta מפרטת את ההרשאות האלו בזרימת App Review של מוצר Instagram. [2]

## בדיקה ראשונה, בלי פרסום ציבורי

לאחר הגדרת הסודות נבצע רק בדיקות בטוחות: אימות ה־Webhook, שליחת DM ניסיוני עם מילת מפתח, ובדיקת ליד בדשבורד. פרסום Reel לא יתבצע בלי אישור מפורש ונפרד ממך.

## מה לעשות עכשיו

בצע רק את שלבי **יצירת האפליקציה** ו־**הוספת מוצר Instagram**. ברגע שאתה רואה את `@smallstories170` ברשימת החשבונות של האפליקציה, עצור וכתוב לי: **"האפליקציה נוצרה"**. אז אתן לך בדיוק את השלב הבא, בלי שתצטרך לחשוף שום סוד.

## מקורות

[1] [Instagram Help Center — Set up a professional account](https://help.instagram.com/502981923235522/)

[2] [Meta for Developers — Customize the Manage messaging and content on Instagram use case](https://developers.facebook.com/documentation/instagram-platform/create-an-instagram-app)

[3] [Meta for Developers — Instagram API with Instagram Login: Get Started](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/get-started)

[4] [Meta for Developers — Setup Webhooks Subscriptions](https://developers.facebook.com/documentation/instagram-platform/webhooks)
