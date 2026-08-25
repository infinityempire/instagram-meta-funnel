import { useState } from "react";
import { AlertCircle, CheckCircle2, Copy, Link2, RefreshCw, Send, Unplug } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

type Section = "overview" | "publish" | "leads" | "webhooks" | "media" | "keywords" | "settings";

const TITLES: Record<Section, [string, string]> = {
  overview: ["מרכז הבקרה", "מצב החיבור, לידים ותובנות מהחשבון המקצועי."],
  publish: ["פרסום Reel", "פרסום ידני בלבד דרך ה־Instagram Graph API הרשמי."],
  leads: ["לידים", "פניות שהותאמו למילות מפתח ונשלחו ל־WhatsApp funnel."],
  webhooks: ["Webhook", "יומן מסירות מאומתות מ־Meta."],
  media: ["מדיה ותובנות", "Reels שפורסמו ורענון ידני של מדדי ביצוע."],
  keywords: ["מילות מפתח", "כללים לאיתור הודעות DM רלוונטיות."],
  settings: ["הגדרות חיבור", "בדיקת מוכנות סודות השרת — ערכים אינם מוצגים כאן."],
};

function NumberCard({ label, value }: { label: string; value: number }) {
  return <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p></CardContent></Card>;
}

export default function MetaDashboard({ section }: { section: Section }) {
  const utils = trpc.useUtils();
  const status = trpc.meta.getConfigurationStatus.useQuery();
  const youtube = trpc.youtube.getConnectionStatus.useQuery();
  const summary = trpc.dashboard.getSummary.useQuery(undefined, { refetchInterval: 30_000 });
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [aiGenerated, setAiGenerated] = useState(true);
  const [keyword, setKeyword] = useState("");
  const publish = trpc.media.createReelAndPublish.useMutation({ onSuccess: () => void utils.media.list.invalidate() });
  const disconnectYouTube = trpc.youtube.disconnect.useMutation({ onSuccess: () => void utils.youtube.getConnectionStatus.invalidate() });
  const createKeyword = trpc.keywords.create.useMutation({ onSuccess: () => { setKeyword(""); void utils.keywords.list.invalidate(); } });
  const title = TITLES[section];
  const callbackUrl = window.location.hostname === "127.0.0.1"
    ? "https://<published-domain>/api/meta/webhook"
    : `${window.location.origin}/api/meta/webhook`;

  const configCard = status.data ? (
    <Card className={status.data.configured ? "border-emerald-500/40" : "border-amber-500/40"}>
      <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base">{status.data.configured ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertCircle className="h-5 w-5 text-amber-600" />}{status.data.configured ? "Meta מחובר" : "נדרשת הגדרת חיבור"}</CardTitle></CardHeader>
      <CardContent className="text-sm text-muted-foreground">{status.data.configured ? "סודות השרת זמינים. עדיין נדרש להשלים אימות Meta לפני פעולה אמיתית." : `חסרים: ${status.data.missing.join(", ")}`}</CardContent>
    </Card>
  ) : null;
  const youtubeCard = youtube.data ? (
    <Card className={youtube.data.connected ? "border-emerald-500/40" : youtube.data.configured ? "border-sky-500/40" : "border-amber-500/40"}>
      <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base">{youtube.data.connected ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Link2 className="h-5 w-5 text-sky-600" />}{youtube.data.connected ? "YouTube מחובר" : youtube.data.configured ? "YouTube מוכן לאישור" : "YouTube דורש הגדרה"}</CardTitle><CardDescription>{youtube.data.connected ? "החיבור נשמר בשרת בצורה מוצפנת. העלאות אוטומטיות עדיין אינן פעילות." : youtube.data.configured ? "השלב הבא יהיה אישור חד־פעמי שלך מול Google." : `חסרים בסודות השרת: ${youtube.data.missing.join(", ")}`}</CardDescription></CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">{youtube.data.connected ? <><span>מחובר מאז {youtube.data.connectedAt ? new Date(youtube.data.connectedAt).toLocaleDateString("he-IL") : ""}.</span><Button variant="outline" size="sm" disabled={disconnectYouTube.isPending} onClick={() => disconnectYouTube.mutate()}><Unplug className="mr-2 h-4 w-4" />נתק חיבור</Button></> : youtube.data.configured ? <Button asChild><a href="/api/youtube/oauth/start">אשר חיבור ל־YouTube</a></Button> : null}</CardContent>
    </Card>
  ) : null;

  let body: React.ReactNode;
  if (section === "overview") {
    body = <div className="space-y-6">{configCard}{youtubeCard}<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><NumberCard label="סה״כ לידים" value={summary.data?.totalLeads ?? 0} /><NumberCard label="לידים שנמסרו" value={summary.data?.deliveredLeads ?? 0} /><NumberCard label="לידים שנכשלו" value={summary.data?.failedLeads ?? 0} /><NumberCard label="מדיה שפורסמה" value={summary.data?.publishedCount ?? 0} /></div><Card><CardHeader><CardTitle className="text-base">Reach ומעורבות לאורך זמן</CardTitle><CardDescription>הגרף מתמלא רק אחרי רענון Insights ידני של מדיה שפורסמה.</CardDescription></CardHeader><CardContent>{summary.data?.insightTrend?.length ? <div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={summary.data.insightTrend.map(point => ({ ...point, date: new Date(point.capturedAt).toLocaleDateString("he-IL") }))}><defs><linearGradient id="reachFill" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.34}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="date" tickLine={false} axisLine={false}/><YAxis tickLine={false} axisLine={false}/><Tooltip/><Area type="monotone" dataKey="reach" name="Reach" stroke="hsl(var(--primary))" fill="url(#reachFill)" strokeWidth={2}/><Area type="monotone" dataKey="engagement" name="מעורבות" stroke="hsl(var(--chart-2))" fill="transparent" strokeWidth={2}/></AreaChart></ResponsiveContainer></div> : <div className="flex h-64 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">אין snapshots של Insights עדיין.</div>}</CardContent></Card><Card><CardHeader><CardTitle className="text-base">מסלול הפעלה</CardTitle><CardDescription>המערכת לא מפרסמת או שולחת הודעות מעצמה. כל פעולה חיצונית דורשת בחירה ידנית שלך.</CardDescription></CardHeader><CardContent className="grid gap-3 text-sm md:grid-cols-3"><div><b>1. חשבון מקצועי</b><p className="text-muted-foreground">העבר את Instagram ל־Creator או Business.</p></div><div><b>2. Meta App</b><p className="text-muted-foreground">צור App, הוסף Instagram Login והגדר webhook.</p></div><div><b>3. בדיקה מבוקרת</b><p className="text-muted-foreground">בדוק DM, ליד ו־Reel אחד לפני הפעלה.</p></div></CardContent></Card></div>;
  } else if (section === "publish") {
    body = <div className="space-y-5">{!status.data?.configured ? configCard : null}<Card><CardHeader><CardTitle>Reel חדש</CardTitle><CardDescription>הסרטון חייב להיות זמין בכתובת HTTPS ציבורית ש־Meta יכול לקרוא.</CardDescription></CardHeader><CardContent className="space-y-4"><Input value={url} onChange={event => setUrl(event.target.value)} placeholder="https://…/video.mp4" /><Textarea value={caption} onChange={event => setCaption(event.target.value)} placeholder="כיתוב ל־Reel (אופציונלי)" /><label className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm"><span><b>תוכן שנוצר ב־AI</b><br /><span className="text-muted-foreground">הצהרה שתועבר ל־Meta בעת הפרסום.</span></span><Switch checked={aiGenerated} onCheckedChange={setAiGenerated} /></label>{publish.error ? <p className="text-sm text-destructive">{publish.error.message}</p> : null}{publish.data ? <p className="text-sm text-emerald-700">{publish.data.message}</p> : null}<Button disabled={!status.data?.configured || publish.isPending || !url} onClick={() => publish.mutate({ sourceUrl: url, caption: caption || undefined, isAiGenerated: aiGenerated })}><Send className="mr-2 h-4 w-4" />פרסם ידנית</Button></CardContent></Card></div>;
  } else if (section === "keywords") {
    const keywords = trpc.keywords.list.useQuery();
    const toggle = trpc.keywords.setActive.useMutation({ onSuccess: () => void utils.keywords.list.invalidate() });
    const remove = trpc.keywords.remove.useMutation({ onSuccess: () => void utils.keywords.list.invalidate() });
    body = <div className="space-y-5"><Card><CardContent className="flex gap-2 p-4"><Input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="למשל: פרטים" /><Button disabled={!keyword.trim() || createKeyword.isPending} onClick={() => createKeyword.mutate({ keyword })}>הוסף</Button></CardContent></Card><Card><CardContent className="divide-y p-0">{keywords.data?.length ? keywords.data.map(rule => <div key={rule.id} className="flex items-center justify-between gap-3 p-4"><span className="font-medium">{rule.keyword}</span><div className="flex items-center gap-2"><Switch checked={rule.active} onCheckedChange={active => toggle.mutate({ id: rule.id, active })} /><Button variant="ghost" size="sm" onClick={() => remove.mutate({ id: rule.id })}>הסר</Button></div></div>) : <p className="p-4 text-sm text-muted-foreground">אין עדיין מילות מפתח.</p>}</CardContent></Card></div>;
  } else if (section === "leads") {
    const leads = trpc.leads.list.useQuery({ limit: 50, offset: 0 });
    body = <DataTable headers={["זמן", "מילת מפתח", "סטטוס", "ניסיונות"]} rows={leads.data?.items.map(lead => [new Date(lead.occurredAt).toLocaleString("he-IL"), lead.keyword, lead.deliveryStatus, String(lead.attempts)])} />;
  } else if (section === "webhooks") {
    const webhooks = trpc.webhooks.list.useQuery({ limit: 50, offset: 0 });
    body = <DataTable headers={["זמן", "אירוע", "חתימה", "סטטוס"]} rows={webhooks.data?.items.map(event => [new Date(event.receivedAt).toLocaleString("he-IL"), event.eventType, event.signatureValid ? "תקינה" : "לא תקינה", event.status])} />;
  } else if (section === "media") {
    const media = trpc.media.list.useQuery({ limit: 50, offset: 0 });
    const refresh = trpc.media.refreshInsights.useMutation({ onSuccess: () => void utils.media.list.invalidate() });
    body = <Card><CardContent className="divide-y p-0">{media.data?.items.length ? media.data.items.map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-medium">{item.status}</p><p className="max-w-md truncate text-xs text-muted-foreground">{item.sourceUrl}</p></div><Button variant="outline" size="sm" disabled={item.status !== "published" || refresh.isPending} onClick={() => refresh.mutate({ mediaId: item.id })}><RefreshCw className="mr-2 h-3.5 w-3.5" />רענן תובנות</Button></div>) : <p className="p-4 text-sm text-muted-foreground">אין מדיה עדיין.</p>}</CardContent></Card>;
  } else {
    body = <div className="space-y-5">{configCard}{youtubeCard}<Card><CardHeader><CardTitle>כתובת הוובהוק</CardTitle></CardHeader><CardContent className="flex items-center gap-2"><code className="min-w-0 flex-1 truncate rounded bg-muted p-3 text-xs">{callbackUrl}</code><Button variant="outline" size="icon" onClick={() => void navigator.clipboard.writeText(callbackUrl)}><Copy className="h-4 w-4" /></Button></CardContent></Card>{youtube.data ? <Card><CardHeader><CardTitle>כתובת החזרה של YouTube OAuth</CardTitle><CardDescription>צריך לרשום אותה בדיוק בהגדרת לקוח ה־OAuth ב־Google Cloud.</CardDescription></CardHeader><CardContent className="flex items-center gap-2"><code className="min-w-0 flex-1 truncate rounded bg-muted p-3 text-xs">{youtube.data.redirectUri}</code><Button variant="outline" size="icon" onClick={() => void navigator.clipboard.writeText(youtube.data.redirectUri)}><Copy className="h-4 w-4" /></Button></CardContent></Card> : null}<Card><CardContent className="p-5 text-sm text-muted-foreground">הזן את ערכי Meta ו־YouTube רק באזור הסודות של הפרויקט. הם אינם נשמרים בקוד, במסד הנתונים או בממשק.</CardContent></Card></div>;
  }
  return <div className="mx-auto max-w-6xl space-y-6"><header><h1 className="text-2xl font-semibold tracking-tight">{title[0]}</h1><p className="mt-1 text-sm text-muted-foreground">{title[1]}</p></header>{body}</div>;
}

function DataTable({ headers, rows }: { headers: string[]; rows?: string[][] }) {
  return <Card><CardContent className="overflow-x-auto p-0"><table className="w-full text-right text-sm"><thead className="border-b bg-muted/40 text-muted-foreground"><tr>{headers.map(header => <th key={header} className="p-3 font-medium">{header}</th>)}</tr></thead><tbody>{rows?.map((row, index) => <tr key={index} className="border-b last:border-0">{row.map((cell, cellIndex) => <td key={cellIndex} className="p-3">{cell}</td>)}</tr>) ?? <tr><td colSpan={headers.length} className="p-6 text-center text-muted-foreground">אין נתונים עדיין.</td></tr>}</tbody></table></CardContent></Card>;
}
