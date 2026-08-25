# מצב מימוש OAuth ל־YouTube

עודכן ב־26 באוגוסט 2026.

## מה מוכן בפרויקט

נוספו נתיבי OAuth ייעודיים בצד השרת: התחלה ב־`/api/youtube/oauth/start`, חזרה ב־`/api/youtube/oauth/callback`, וניתוק מבוקר. בקשת ההרשאה מוגנת באמצעות `state` חתום, בעל תוקף של עשר דקות, ו־cookie מסוג HttpOnly קצר־חיים. אם Google תחזיר refresh token, השרת יצפין אותו ב־AES-256-GCM לפני שמירתו במסד הנתונים. הממשק מציג סטטוס בלבד, ולא מחזיר סודות או טוקנים.

כתובת ה־redirect הרשמית היא:

```
https://instafunnel-lphz3bum.manus.space/api/youtube/oauth/callback
```

החיבור מבקש רק את ההרשאה המינימלית `https://www.googleapis.com/auth/youtube.upload`. לא הוטמע עדיין מודול העלאה, ולא תתבצע העלאה — פרטית או פומבית — בלי אישור מפורש חדש של הבעלים.

## מה עדיין נדרש

יש ליצור לקוח OAuth מסוג **Web application** בפרויקט Google Cloud `tal-derie-youtube-upload`, בשם `Small Stories Hebrew YouTube Uploader`, עם כתובת ה־redirect לעיל. לאחר מכן יש להזין את Client ID ואת Client Secret רק באזור הסודות המאובטח של הפרויקט תחת `YOUTUBE_OAUTH_CLIENT_ID` ו־`YOUTUBE_OAUTH_CLIENT_SECRET`. אין להדביק ערכים אלו בצ׳אט, בקוד או ב־GitHub.

ב־Google Cloud זוהו החשבון הראשי `tal.derie.td@gmail.com` והפרויקט הנכון. עם זאת, ממשק הדפדפן המשותף חזר פעמיים ל־`about:blank` בעת מעבר למילוי השדות. לכן אין לראות בלקוח OAuth כנוצר לפני שמופיעה רשומה בדף Clients.

## אישור בעל הערוץ

אחרי יצירת הלקוח והזנת הסודות, בעל הערוץ יבצע פעם אחת אישור מול Google בדפדפן האישי שלו. אין להעביר סיסמה, קוד אימות או טוקן. Google מחזירה את קוד ההרשאה ישירות לנתיב ה־callback המאובטח, והשרת מטפל בו בלי להציג אותו למשתמש.

## נוהל בדיקת העלאה לאחר אישור OAuth

העלאה ראשונה תתבצע רק אחרי אישור מפורש חדש של בעל הערוץ, ובאמצעות קובץ שנבדק מראש. לפני הפעלה, המערכת תציג את הכותרת, התיאור והקובץ המיועדים. פעולת הבדיקה תגדיר תמיד `privacyStatus=private`, `selfDeclaredMadeForKids=true` ו־`containsSyntheticMedia=true` עבור סרטון הילדים שנוצר או שונה ב־AI. היא לא תבקש תזמון פרסום ולא תשלח הודעה למנויים.

אחרי שהשרת יחזיר מזהה סרטון, הבעלים יבדוק אותו באופן פרטי ב־YouTube Studio. רק אישור מפורש חדש, ובכפוף לביקורת התאימות של YouTube לפרויקט ה־API, יאפשר לשקול שינוי נראות לציבור. אין לעקוף שלב זה, ואין לשנות, למחוק או לפרסם סרטון ללא אישור.

## מקורות רשמיים

- [Google OAuth 2.0 ליישומי שרת](https://developers.google.com/identity/protocols/oauth2/web-server)
- [YouTube Data API: videos.insert](https://developers.google.com/youtube/v3/docs/videos/insert)
