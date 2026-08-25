# הערכת אוטומציית העלאה ל־YouTube

## מצב נוכחי

אין בפרויקט חיבור פעיל ל־YouTube Data API או פרויקט Google Cloud עם הרשאת העלאה. חיבור Google Workspace הקיים אינו מעניק הרשאת העלאה לערוץ YouTube.

## מה YouTube Data API מאפשר

אפשר להשתמש ב־`videos.insert` כדי להעלות סרטון, להגדיר כותרת, תיאור, תגיות, מועד פרסום, `selfDeclaredMadeForKids` והצהרת תוכן סינתטי. הפעולה מחייבת OAuth 2.0 של בעל הערוץ עם הרשאת `youtube.upload`; מפתח API בלבד אינו מספיק.

## מגבלות מהותיות

1. OAuth אינו עוקף אימות Google. בעל החשבון עדיין חייב לאשר את החיבור פעם אחת במסך Google הרשמי.
2. פרויקטי API חדשים שלא עברו ביקורת YouTube מעלים סרטונים כפרטיים בלבד. כדי לפרסם לציבור דרך API נדרשת ביקורת תאימות של YouTube.
3. המכסה הנוכחית של `videos.insert` היא עד 100 העלאות ביום בפרויקט כברירת מחדל. אין צורך במכסה גדולה לששת סרטוני הניסוי.

## חלופות

| מסלול | יתרון | מגבלה |
| --- | --- | --- |
| העלאה ידנית באפליקציית YouTube | מיידי, חינמי, ללא פרויקט API | בעל החשבון בוחר את הקובץ ולוחץ פרסום |
| אוטומציה דרך YouTube Data API | אפשר להכין ולהעלות טיוטות באמצעות קוד לאחר חיבור חד־פעמי | דורש Google Cloud, OAuth מאושר וביקורת API לפרסום ציבורי |

## מקורות רשמיים

- https://developers.google.com/youtube/v3/guides/authentication
- https://developers.google.com/youtube/v3/docs/videos/insert
- https://developers.google.com/youtube/v3/determine_quota_cost
- https://developers.google.com/youtube/registering_an_application
