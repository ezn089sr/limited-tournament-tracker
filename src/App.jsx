
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

const EVENT_TEMPLATES = {
  "1200限時錦標賽": { buyIn: 1000, serviceFee: 200 },
  "3400限時錦標賽": { buyIn: 3000, serviceFee: 400 },
  "6600限時錦標賽": { buyIn: 6000, serviceFee: 600 },
  "11000限時錦標賽": { buyIn: 10000, serviceFee: 1000 },
  "22000限時錦標賽": { buyIn: 20000, serviceFee: 2000 },
  "33000限時錦標賽": { buyIn: 30000, serviceFee: 3000 },
  "53000限時錦標賽": { buyIn: 50000, serviceFee: 3000 },
};
const EVENT_OPTIONS = [...Object.keys(EVENT_TEMPLATES), "自訂名稱"];

function todayString() { return new Date().toISOString().slice(0, 10); }
function startOfCurrentWeekString() { const now = new Date(); const day = now.getDay(); const diff = day === 0 ? 6 : day - 1; const monday = new Date(now); monday.setDate(now.getDate() - diff); return monday.toISOString().slice(0,10); }
function startOfCurrentMonthString() { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10); }
function daysAgoString(days) { const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString().slice(0,10); }
function toNumber(v, f = 0) { const n = Number(v); return Number.isFinite(n) ? n : f; }
function money(n) { return toNumber(n).toLocaleString("zh-TW", { maximumFractionDigits: 0 }); }
function signedMoney(n) { const v = toNumber(n); return `${v >= 0 ? "+" : "-"}${money(Math.abs(v))}`; }
function percent(n) { return Number.isFinite(n) ? `${n.toFixed(1)}%` : "0.0%"; }
function dateLabel(s) { const p = String(s || "").split("-"); return p.length === 3 ? `${Number(p[1])}/${Number(p[2])}` : s || ""; }
function getDisplayEventName(r) {
  return r.event_name === "自訂名稱"
    ? (String(r.custom_event_name || "自訂名稱").trim() || "自訂名稱")
    : (String(r.event_name || "未命名賽事").trim() || "未命名賽事");
}
function calcRecord(r) {
  const buyIn = Math.max(0, toNumber(r.buy_in));
  const serviceFee = Math.max(0, toNumber(r.service_fee));
  const reentryCount = Math.max(0, Math.floor(toNumber(r.reentry_count)));
  const reentryBuyInTotal = Math.max(0, toNumber(r.reentry_buyin_total));
  const reentryServiceFeeTotal = Math.max(0, toNumber(r.reentry_service_fee_total));
  const prize = Math.max(0, toNumber(r.prize));
  const entries = 1 + reentryCount;
  const totalBuyIn = buyIn + reentryBuyInTotal;
  const totalServiceFee = serviceFee + reentryServiceFeeTotal;
  const totalCost = totalBuyIn + totalServiceFee;
  const netProfit = prize - totalCost;
  const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
  return { ...r, buyIn, serviceFee, reentryCount, reentryBuyInTotal, reentryServiceFeeTotal, prize, entries, displayEventName: getDisplayEventName(r), totalBuyIn, totalServiceFee, totalCost, netProfit, roi };
}
function sumRecords(records) {
  const c = records.map(calcRecord);
  const totalGames = c.length;
  const totalEntries = c.reduce((s, r) => s + r.entries, 0);
  const totalReentries = c.reduce((s, r) => s + r.reentryCount, 0);
  const totalBuyIn = c.reduce((s, r) => s + r.totalBuyIn, 0);
  const totalServiceFee = c.reduce((s, r) => s + r.totalServiceFee, 0);
  const totalCost = c.reduce((s, r) => s + r.totalCost, 0);
  const totalPrize = c.reduce((s, r) => s + r.prize, 0);
  const netProfit = c.reduce((s, r) => s + r.netProfit, 0);
  const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
  const avgProfit = totalGames > 0 ? netProfit / totalGames : 0;
  return { totalGames, totalEntries, totalReentries, totalBuyIn, totalServiceFee, totalCost, totalPrize, netProfit, roi, avgProfit };
}
function groupBy(records, getKey) {
  const m = new Map();
  records.forEach((r) => { const k = getKey(r) || "未分類"; if (!m.has(k)) m.set(k, []); m.get(k).push(r); });
  return Array.from(m.entries()).map(([label, items]) => ({ label, ...sumRecords(items) })).sort((a, b) => b.netProfit - a.netProfit);
}
function filterRecordsByDate(records, startDate, endDate) {
  return records.filter((r) => r.date && (!startDate || r.date >= startDate) && (!endDate || r.date <= endDate));
}
function makeDailyProfitData(records) {
  const m = new Map();
  records.forEach((r) => m.set(r.date, (m.get(r.date) || 0) + r.netProfit));
  return Array.from(m.entries()).map(([date, netProfit]) => ({ date, label: dateLabel(date), netProfit })).sort((a, b) => a.date.localeCompare(b.date));
}
function makeCumulativeProfitData(records) {
  let running = 0;
  return records.slice().sort((a, b) => {
    const dc = String(a.date || "").localeCompare(String(b.date || ""));
    if (dc !== 0) return dc;
    return String(a.created_at || "").localeCompare(String(b.created_at || ""));
  }).map((r, i) => {
    running += r.netProfit;
    return { index: i + 1, date: r.date, label: dateLabel(r.date), cumulativeProfit: running };
  });
}
function downloadText(filename, text, type = "application/json;charset=utf-8") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = filename; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
}
const defaultForm = { date: todayString(), venue: "北屯店", eventName: "1200限時錦標賽", customEventName: "", buyIn: 1000, serviceFee: 200, reentryCount: 0, reentryBuyInTotal: 0, reentryServiceFeeTotal: 0, prize: 0, notes: "" };

function Input({ label, value, onChange, type = "text", placeholder, min }) {
  return <label className="field"><span>{label}</span><input type={type} min={min} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></label>;
}
function Select({ label, value, onChange, children }) {
  return <label className="field"><span>{label}</span><select value={value} onChange={(e) => onChange(e.target.value)}>{children}</select></label>;
}
function PillButton({ active, onClick, children }) {
  return <button type="button" className={`pill ${active ? "active" : ""}`} onClick={onClick}>{children}</button>;
}
function StatCard({ title, value, sub, accent }) {
  return <div className={`stat-card ${accent || ""}`}><div className="stat-title">{title}</div><div className="stat-value">{value}</div>{sub ? <div className="stat-sub">{sub}</div> : null}</div>;
}
function Toast({ message }) {
  if (!message) return null;
  return <div className="toast">{message}</div>;
}
function EmptyChart({ message }) {
  return <div className="chart-empty">{message}</div>;
}
function CumulativeProfitChart({ data }) {
  if (!data.length) return <EmptyChart message="這個區間還沒有紀錄。" />;
  const width = 680, height = 220, padding = 30;
  const values = data.map((i) => i.cumulativeProfit);
  const minValue = Math.min(0, ...values), maxValue = Math.max(0, ...values), range = maxValue - minValue || 1;
  const xStep = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;
  const y = (value) => height - padding - ((value - minValue) / range) * (height - padding * 2);
  const x = (index) => data.length > 1 ? padding + xStep * index : width / 2;
  const zeroY = y(0);
  const points = data.map((item, index) => `${x(index)},${y(item.cumulativeProfit)}`).join(" ");
  const last = data[data.length - 1];
  return <div className="chart-scroll"><svg viewBox={`0 0 ${width} ${height}`} className="chart-svg"><line x1={padding} x2={width - padding} y1={zeroY} y2={zeroY} className="axis" /><text x={padding} y={20} className="chart-label">最高 {money(maxValue)}</text><text x={padding} y={height - 8} className="chart-label">最低 {money(minValue)}</text>{data.length > 1 ? <polyline fill="none" className="line" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points} /> : null}{data.map((item, index) => <g key={`${item.date}-${index}`}><circle cx={x(index)} cy={y(item.cumulativeProfit)} r="3.5" className="dot" />{(index === 0 || index === data.length - 1 || data.length <= 6) ? <text x={x(index)} y={height - 12} textAnchor="middle" className="chart-label">{item.label}</text> : null}</g>)}<text x={width - padding} y={20} textAnchor="end" className={last.cumulativeProfit >= 0 ? "svg-profit" : "svg-loss"}>目前 {signedMoney(last.cumulativeProfit)}</text></svg></div>;
}
function DailyProfitChart({ data }) {
  if (!data.length) return <EmptyChart message="這個區間還沒有紀錄。" />;
  const width = 680, height = 220, padding = 30;
  const values = data.map((i) => i.netProfit);
  const minValue = Math.min(0, ...values), maxValue = Math.max(0, ...values), range = maxValue - minValue || 1;
  const zeroY = height - padding - ((0 - minValue) / range) * (height - padding * 2);
  const barSpace = (width - padding * 2) / data.length, barWidth = Math.max(8, Math.min(38, barSpace * 0.62));
  const y = (value) => height - padding - ((value - minValue) / range) * (height - padding * 2);
  return <div className="chart-scroll"><svg viewBox={`0 0 ${width} ${height}`} className="chart-svg"><line x1={padding} x2={width - padding} y1={zeroY} y2={zeroY} className="axis" /><text x={padding} y={20} className="chart-label">最高 {money(maxValue)}</text><text x={padding} y={height - 8} className="chart-label">最低 {money(minValue)}</text>{data.map((item, index) => { const centerX = padding + barSpace * index + barSpace / 2; const valueY = y(item.netProfit); const rectY = item.netProfit >= 0 ? valueY : zeroY; const rectHeight = Math.max(2, Math.abs(zeroY - valueY)); return <g key={item.date}><rect x={centerX - barWidth / 2} y={rectY} width={barWidth} height={rectHeight} rx="5" className={item.netProfit >= 0 ? "bar-profit" : "bar-loss"} />{(index === 0 || index === data.length - 1 || data.length <= 7) ? <text x={centerX} y={height - 12} textAnchor="middle" className="chart-label">{item.label}</text> : null}</g>; })}</svg></div>;
}
function GroupTable({ rows }) {
  if (!rows.length) return <div className="empty">這個區間還沒有資料。</div>;
  return <div className="group-list">{rows.map((row) => <div className="group-row" key={row.label}><div><div className="group-label">{row.label}</div><div className="group-meta">{row.totalGames} 場｜ROI {percent(row.roi)}</div></div><div className={row.netProfit >= 0 ? "profit" : "loss"}>{signedMoney(row.netProfit)}</div></div>)}</div>;
}

function LoginPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  async function signIn() {
    try {
      setSending(true);
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
      if (error) throw error;
      alert("登入連結已寄出，請到信箱點 magic link。");
    } catch (error) {
      alert(error.message || "寄送失敗");
    } finally {
      setSending(false);
    }
  }
  return <main className="login-wrap"><div className="login-glow" /><div className="login-card"><div className="app-kicker">Cloud Version</div><h1>限時錦標賽記帳</h1><p className="login-text">首次用 Email 登入一次即可，之後通常會自動保持登入。資料會儲存在雲端。</p><Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" /><button className="primary-button full" type="button" onClick={signIn} disabled={sending || !email}>{sending ? "寄送中..." : "寄送登入連結"}</button></div></main>;
}

function AddPage({ form, setForm, saveRecord, saving, monthSummary }) {
  const calculatedForm = useMemo(() => calcRecord({ event_name: form.eventName, custom_event_name: form.customEventName, buy_in: form.buyIn, service_fee: form.serviceFee, reentry_count: form.reentryCount, reentry_buyin_total: form.reentryBuyInTotal, reentry_service_fee_total: form.reentryServiceFeeTotal, prize: form.prize }), [form]);
  function updateForm(key, value) { setForm((current) => ({ ...current, [key]: value })); }
  function changeEventName(value) {
    const t = EVENT_TEMPLATES[value];
    setForm((current) => ({ ...current, eventName: value, customEventName: value === "自訂名稱" ? current.customEventName : "", buyIn: t ? t.buyIn : current.buyIn, serviceFee: t ? t.serviceFee : current.serviceFee, reentryCount: 0, reentryBuyInTotal: 0, reentryServiceFeeTotal: 0 }));
  }
  function changeReentryCount(value) {
    const reentryCount = Math.max(0, Math.floor(toNumber(value)));
    setForm((current) => ({ ...current, reentryCount, reentryBuyInTotal: Math.max(0, toNumber(current.buyIn)) * reentryCount, reentryServiceFeeTotal: Math.max(0, toNumber(current.serviceFee)) * reentryCount }));
  }
  return <main className="page"><section className="hero-panel"><div><div className="hero-kicker">新增紀錄</div><h2>今天這場如何？</h2><p>快速記下，累積成趨勢。</p></div><div className="hero-pills"><div className="hero-pill"><span>本月淨利</span><strong className={monthSummary.netProfit >= 0 ? "profit" : "loss"}>{signedMoney(monthSummary.netProfit)}</strong></div><div className="hero-pill"><span>本月場次</span><strong>{monthSummary.totalGames}</strong></div></div></section><div className="mobile-card section-card"><div className="card-top"><div className="card-heading">賽事</div><div className="section-badge">1</div></div><div className="form-grid"><Input label="日期" type="date" value={form.date} onChange={(v) => updateForm("date", v)} /><Select label="限時錦標賽名稱" value={form.eventName} onChange={changeEventName}>{EVENT_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</Select>{form.eventName === "自訂名稱" ? <Input label="自訂名稱" value={form.customEventName} onChange={(v) => updateForm("customEventName", v)} /> : null}</div></div><div className="mobile-card section-card"><div className="card-top"><div className="card-heading">買入</div><div className="section-badge">2</div></div><div className="form-grid two"><Input label="買入金額" type="number" min="0" value={form.buyIn} onChange={(v) => updateForm("buyIn", v)} /><Input label="買入服務費" type="number" min="0" value={form.serviceFee} onChange={(v) => updateForm("serviceFee", v)} /></div></div><div className="mobile-card section-card"><div className="card-top"><div className="card-heading">重新買入</div><div className="section-badge">3</div></div><div className="hint">先輸入重買次數，系統會帶入預估金額；若服務費有折扣，再手動改總額。</div><div className="form-grid"><Input label="重買次數" type="number" min="0" value={form.reentryCount} onChange={changeReentryCount} /><Input label="重買買入總額" type="number" min="0" value={form.reentryBuyInTotal} onChange={(v) => updateForm("reentryBuyInTotal", v)} /><Input label="重買服務費總額" type="number" min="0" value={form.reentryServiceFeeTotal} onChange={(v) => updateForm("reentryServiceFeeTotal", v)} /></div></div><div className="mobile-card section-card"><div className="card-top"><div className="card-heading">結果</div><div className="section-badge">4</div></div><div className="form-grid"><Input label="獎金 / Ticket 價值" type="number" min="0" value={form.prize} onChange={(v) => updateForm("prize", v)} /><Input label="備註" value={form.notes} onChange={(v) => updateForm("notes", v)} placeholder="例如：前 3 deal、重買服務費折扣" /></div></div><div className="sticky-preview"><div><div className="preview-main">{calculatedForm.netProfit >= 0 ? "盈利" : "虧損"} {signedMoney(calculatedForm.netProfit)}</div><div className="preview-sub">投入 {money(calculatedForm.totalCost)}｜ROI {percent(calculatedForm.roi)}</div></div><button className="primary-button save-button" type="button" onClick={saveRecord} disabled={saving}>{saving ? "儲存中..." : "儲存到雲端"}</button></div></main>;
}

function StatsPage({ records }) {
  const [rangePreset, setRangePreset] = useState("month");
  const [startDate, setStartDate] = useState(startOfCurrentMonthString());
  const [endDate, setEndDate] = useState(todayString());
  const filteredRecords = useMemo(() => filterRecordsByDate(records, startDate, endDate), [records, startDate, endDate]);
  const overall = useMemo(() => sumRecords(filteredRecords), [filteredRecords]);
    const byEventName = useMemo(() => groupBy(filteredRecords, (r) => r.displayEventName), [filteredRecords]);
  const dailyProfitData = useMemo(() => makeDailyProfitData(filteredRecords), [filteredRecords]);
  const cumulativeProfitData = useMemo(() => makeCumulativeProfitData(filteredRecords), [filteredRecords]);
  function applyRangePreset(preset) {
    setRangePreset(preset); const today = todayString();
    if (preset === "all") { setStartDate(""); setEndDate(""); }
    else if (preset === "week") { setStartDate(startOfCurrentWeekString()); setEndDate(today); }
    else if (preset === "month") { setStartDate(startOfCurrentMonthString()); setEndDate(today); }
    else if (preset === "30days") { setStartDate(daysAgoString(29)); setEndDate(today); }
    else { if (!startDate) setStartDate(today); if (!endDate) setEndDate(today); }
  }
  return <main className="page"><section className="hero-panel compact"><div><div className="hero-kicker">統計</div><h2>看趨勢，不只看單場</h2></div><div className="hero-pills mini"><div className="hero-pill"><span>區間淨利</span><strong className={overall.netProfit >= 0 ? "profit" : "loss"}>{signedMoney(overall.netProfit)}</strong></div></div></section><div className="range-row"><PillButton active={rangePreset === "all"} onClick={() => applyRangePreset("all")}>全部</PillButton><PillButton active={rangePreset === "week"} onClick={() => applyRangePreset("week")}>本週</PillButton><PillButton active={rangePreset === "month"} onClick={() => applyRangePreset("month")}>本月</PillButton><PillButton active={rangePreset === "30days"} onClick={() => applyRangePreset("30days")}>近30天</PillButton></div><div className="mobile-card"><div className="form-grid two"><Input label="開始日期" type="date" value={startDate} onChange={(v) => { setRangePreset("custom"); setStartDate(v); }} /><Input label="結束日期" type="date" value={endDate} onChange={(v) => { setRangePreset("custom"); setEndDate(v); }} /></div></div><div className="stats-grid"><StatCard title="淨利" value={signedMoney(overall.netProfit)} sub={`ROI ${percent(overall.roi)}`} accent="dark" /><StatCard title="總場次" value={`${overall.totalGames}`} sub={`Entries ${overall.totalEntries}`} /><StatCard title="服務費" value={money(overall.totalServiceFee)} /><StatCard title={<>總買入<span className="muted-inline">（含服務費）</span></>} value={money(overall.totalCost)} /><StatCard title="總獎金" value={money(overall.totalPrize)} /><StatCard title="平均每場" value={signedMoney(overall.avgProfit)} sub="平均淨利 / 場" /></div><div className="mobile-card chart-card"><div className="card-heading">累積淨利圖</div><CumulativeProfitChart data={cumulativeProfitData} /></div><div className="mobile-card chart-card"><div className="card-heading">每日盈虧圖</div><div className="hint">同一天多場會合併為單日淨利。</div><DailyProfitChart data={dailyProfitData} /></div><details className="mobile-card details-card" open><summary>依賽事名稱統計</summary><GroupTable rows={byEventName} /></details></main>;
}

function RecordsPage({ records, removeRecord }) {
  return <main className="page"><section className="hero-panel compact"><div><div className="hero-kicker">紀錄</div><h2>每一筆資料都很有價值</h2></div><div className="hero-pills mini"><div className="hero-pill"><span>總筆數</span><strong>{records.length}</strong></div></div></section>{records.length === 0 ? <div className="empty big">還沒有紀錄。先新增一場。</div> : <div className="record-list">{records.map((record) => <div className="record-card" key={record.id}><div className="record-top"><div><div className="record-title">{record.displayEventName}</div><div className="record-meta">{record.date}</div></div><button className="delete-button" type="button" onClick={() => removeRecord(record.id)}>刪除</button></div><div className="record-numbers"><div><span>投入</span><strong>{money(record.totalCost)}</strong></div><div><span>獎金</span><strong>{money(record.prize)}</strong></div><div><span>淨利</span><strong className={record.netProfit >= 0 ? "profit" : "loss"}>{signedMoney(record.netProfit)}</strong></div></div><div className="record-small">Entries {record.entries}｜重買 {record.reentryCount}｜服務費 {money(record.totalServiceFee)}｜ROI {percent(record.roi)}</div>{record.notes ? <div className="record-note">{record.notes}</div> : null}</div>)}</div>}</main>;
}

function DataPage({ records, signOut }) {
  function exportBackup() {
    downloadText(`限時錦標賽備份_${todayString()}.json`, JSON.stringify({ app: "limited-tournament-tracker-cloud", version: 2, exportedAt: new Date().toISOString(), records }, null, 2));
  }
  function exportCsv() {
    const headers = ["日期","賽事名稱","買入金額","買入服務費","重買次數","重買買入總額","重買服務費總額","總Entries","總買入","獎金","淨利","ROI","備註"];
    const rows = records.map((record) => [record.date,record.displayEventName,record.buyIn,record.serviceFee,record.reentryCount,record.reentryBuyInTotal,record.reentryServiceFeeTotal,record.entries,record.totalBuyIn,record.prize,record.netProfit,`${record.roi.toFixed(1)}%`,record.notes]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadText(`限時錦標賽紀錄_${todayString()}.csv`, "\ufeff" + csv, "text/csv;charset=utf-8");
  }
  return <main className="page"><section className="hero-panel compact"><div><div className="hero-kicker">資料</div><h2>你的資料現在已經在雲端</h2></div></section><div className="mobile-card warning-card"><div className="card-heading">建議保留額外備份</div><p>雖然這版已經使用 Supabase 雲端儲存，仍建議定期匯出 JSON 或 CSV，讓你更安心。</p></div><div className="mobile-card action-list"><button type="button" className="action-button" onClick={exportBackup}>備份 JSON</button><button type="button" className="action-button" onClick={exportCsv}>匯出 CSV</button><button type="button" className="danger-button" onClick={signOut}>登出</button></div></main>;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("add");
  const [toast, setToast] = useState("");
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session ?? null); setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setSession(session ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) { setRecords([]); return; }
    loadRecords();
  }, [session?.user?.id]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  async function loadRecords() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("tournament_records").select("*").order("date", { ascending: false }).order("created_at", { ascending: false });
      if (error) throw error;
      setRecords((data || []).map(calcRecord));
    } catch (error) {
      alert(error.message || "讀取失敗");
    } finally {
      setLoading(false);
    }
  }

  async function saveRecord() {
    try {
      setSaving(true);
      const payload = {
        user_id: session.user.id,
        date: form.date,
        venue: "",
        event_name: form.eventName,
        custom_event_name: form.eventName === "自訂名稱" ? form.customEventName : "",
        buy_in: toNumber(form.buyIn),
        service_fee: toNumber(form.serviceFee),
        reentry_count: toNumber(form.reentryCount),
        reentry_buyin_total: toNumber(form.reentryBuyInTotal),
        reentry_service_fee_total: toNumber(form.reentryServiceFeeTotal),
        prize: toNumber(form.prize),
        notes: form.notes || "",
      };
      const { error } = await supabase.from("tournament_records").insert(payload);
      if (error) throw error;
      setForm((current) => ({ ...defaultForm, date: todayString(), venue: current.venue, eventName: current.eventName, customEventName: current.eventName === "自訂名稱" ? current.customEventName : "", buyIn: current.buyIn, serviceFee: current.serviceFee }));
      await loadRecords();
      setToast("已儲存到雲端");
      setTab("stats");
    } catch (error) {
      alert(error.message || "儲存失敗");
    } finally {
      setSaving(false);
    }
  }

  async function removeRecord(id) {
    if (!window.confirm("確定刪除這筆紀錄？")) return;
    try {
      const { error } = await supabase.from("tournament_records").delete().eq("id", id);
      if (error) throw error;
      setRecords((current) => current.filter((record) => record.id !== id));
      setToast("已刪除紀錄");
    } catch (error) {
      alert(error.message || "刪除失敗");
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  const monthRecords = useMemo(() => filterRecordsByDate(records, startOfCurrentMonthString(), todayString()), [records]);
  const monthSummary = useMemo(() => sumRecords(monthRecords), [monthRecords]);

  if (loading && !session) return <div className="center-screen">載入中...</div>;
  if (!session) return <LoginPage />;

  return <div className="app-shell"><div className="bg-orb orb-a" /><div className="bg-orb orb-b" /><header className="app-header"><div><div className="app-kicker">Cloud Version</div><h1>限時錦標賽記帳</h1></div><div className={monthSummary.netProfit >= 0 ? "header-profit profit" : "header-profit loss"}>本月 {signedMoney(monthSummary.netProfit)}</div></header>{loading ? <div className="center-screen">同步資料中...</div> : null}{!loading && tab === "add" ? <AddPage form={form} setForm={setForm} saveRecord={saveRecord} saving={saving} monthSummary={monthSummary} /> : null}{!loading && tab === "stats" ? <StatsPage records={records} /> : null}{!loading && tab === "records" ? <RecordsPage records={records} removeRecord={removeRecord} /> : null}{!loading && tab === "data" ? <DataPage records={records} signOut={signOut} /> : null}<nav className="bottom-nav"><button className={tab === "add" ? "active" : ""} onClick={() => setTab("add")}>＋<span>新增</span></button><button className={tab === "stats" ? "active" : ""} onClick={() => setTab("stats")}>▦<span>統計</span></button><button className={tab === "records" ? "active" : ""} onClick={() => setTab("records")}>≡<span>紀錄</span></button><button className={tab === "data" ? "active" : ""} onClick={() => setTab("data")}>⇅<span>資料</span></button></nav><Toast message={toast} /></div>;
}
