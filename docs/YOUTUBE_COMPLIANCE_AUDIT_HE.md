# חבילת הכנה לביקורת תאימות — YouTube API

## מצב

פרויקט `tal-derie-youtube-upload` משתמש ב־YouTube Data API לצורך העלאות של סרטוני ילדים מקוריים. כל העלאה מוגדרת תחילה כפרטית. פרויקטי API שלא עברו ביקורת מוגבלים להעלאות פרטיות; לאחר ביקורת תאימות ניתן לבקש להסיר מגבלה זו.[1][2]

## אופן השימוש במוצר

האפליקציה מזהה את עצמה כ־**Small Stories Hebrew YouTube Uploader**. היא משתמשת ב־OAuth רשמי, שומרת רק refresh token מוצפן בצד השרת, מאפשרת ניתוק והרשאה מחדש, ואינה מבקשת או שומרת סיסמאות או קודי אימות. המשתמש מאשר במפורש כל פרסום לציבור; ברירת המחדל היא Private.

## בקרות תאימות

| דרישה | יישום |
|---|---|
| שקיפות ושליטת משתמש | סטטוס חיבור, אפשרות ניתוק, והפרדה בין העלאה פרטית לפרסום פומבי |
| צמצום הרשאות | העלאה, קריאת סטטוס, Analytics ונתוני הכנסה רק לצורך התכונות הקיימות |
| אבטחת נתונים | refresh token מוצפן; לוגים לא כוללים סודות |
| תוכן ילדים | `Made for Kids=true`; הצהרת AI כאשר התוכן נוצר או שונה ב־AI |
| מניעת פרסום לא מורשה | בקרת איכות לפני אישור פרסום; ללא פרסום ציבורי אוטומטי |

## פעולה נדרשת

יש להגיש את הטופס הרשמי: https://support.google.com/youtube/contact/yt_api_form. צוות YouTube API Services יוצר קשר לאחר ההגשה.[1]

## מקורות

[1] https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits

[2] https://developers.google.com/youtube/v3/docs/videos

[3] https://developers.google.com/youtube/terms/developer-policies
