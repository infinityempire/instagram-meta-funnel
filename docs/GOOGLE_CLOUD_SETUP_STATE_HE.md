# מצב הגדרת Google Cloud — YouTube API

נפתח טופס יצירת פרויקט בשם `tal-derie-youtube-upload` בחשבון Google של הבעלים.

הפרויקט דורש שיוך לחשבון חיוב. הבעלים אישר במפורש שימוש בחשבון **My Billing Account 2**. אין להפעיל בפרויקט שירותי Cloud בתשלום מעבר ל־YouTube Data API v3, ואין להוסיף פרטי תשלום חדשים.

בעת בחירת החשבון נמצא שהרכיב הוא תפריט מותאם אישית ולא רכיב select רגיל. יש להמשיך באמצעות לחיצה מדויקת בממשק ולא לשנות את בחירת הבעלים.

לאחר לחיצה על יצירה, המסוף חזר לפרויקט הקיים `Gemini API` ללא הודעת הצלחה או מעבר לפרויקט החדש. יש לאמת אם `tal-derie-youtube-upload` נוצר ברשימת הפרויקטים לפני הפעלת כל API, ולא לגעת בפרויקט Gemini הקיים.

## מקורות ומגבלות שנבדקו

- [YouTube Data API quota calculator](https://developers.google.com/youtube/v3/determine_quota_cost): ברירת המחדל היא 100 קריאות `videos.insert` ביום, 100 קריאות `search.list` ביום, ו־10,000 יחידות ביום לשאר נקודות הקצה.
- [YouTube quota and compliance audits](https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits): הגדלת מכסה מחייבת ביקורת תאימות.
- [Google Cloud budgets and alerts](https://docs.cloud.google.com/billing/docs/how-to/budgets): תקציב מסוג alerts-only שולח התראות אך אינו יוצר חסימת חיוב אוטומטית.

אין להפעיל Compute Engine, Cloud Run, Cloud Storage, BigQuery, Vertex AI או שירותים בתשלום אחרים בפרויקט זה ללא אישור מפורש חדש מבעל החשבון.
