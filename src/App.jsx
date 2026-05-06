import React, { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'limited_tournament_tracker_records_v1';

const EVENT_TEMPLATES = {
  '1200限時錦標賽': { buyIn: 1000, serviceFee: 200 },
  '3400限時錦標賽': { buyIn: 3000, serviceFee: 400 },
  '6600限時錦標賽': { buyIn: 6000, serviceFee: 600 },
  '11000限時錦標賽': { buyIn: 10000, serviceFee: 1000 },
  '22000限時錦標賽': { buyIn: 20000, serviceFee: 2000 },
  '33000限時錦標賽': { buyIn: 30000, serviceFee: 3000 },
  '53000限時錦標賽': { buyIn: 50000, serviceFee: 3000 },
};

const EVENT_OPTIONS = [...Object.keys(EVENT_TEMPLATES), '自訂名稱'];

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function startOfCurrentWeekString() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  return monday.toISOString().slice(0, 10);
}

function startOfCurrentMonthString() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function daysAgoString(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

const defaultForm = {
  date: todayString(),
  venue: '北屯店',
  eventName: '1200限時錦標賽',
  customEventName: '',
  buyIn: 1000,
  serviceFee: 200,
  reentryCount: 0,
  reentryBuyInTotal: 0,
  reentryServiceFeeTotal: 0,
  prize: 0,
  notes: '',
};

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `record_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function getDisplayEventName(record) {
  if (record.eventName === '自訂名稱') {
    return String(record.customEventName || '自訂名稱').trim() || '自訂名稱';
  }
  return String(record.eventName || '未命名賽事').trim() || '未命名賽事';
}

function money(n) {
  const value = toNumber(n);
  return value.toLocaleString('zh-TW', { maximumFractionDigits: 0 });
}

function percent(n) {
  if (!Number.isFinite(n)) return '0.0%';
  return `${n.toFixed(1)}%`;
}

function dateLabel(dateString) {
  if (!dateString) return '';
  const parts = String(dateString).split('-');
  if (parts.length !== 3) return dateString;
  return `${Number(parts[1])}/${Number(parts[2])}`;
}

function calcRecord(record) {
  const buyIn = Math.max(0, toNumber(record.buyIn));
  const serviceFee = Math.max(0, toNumber(record.serviceFee));
  const reentryCount = Math.max(0, Math.floor(toNumber(record.reentryCount)));
  const reentryBuyInTotal = Math.max(0, toNumber(record.reentryBuyInTotal));
  const reentryServiceFeeTotal = Math.max(0, toNumber(record.reentryServiceFeeTotal));
  const prize = Math.max(0, toNumber(record.prize));
  const displayEventName = getDisplayEventName(record);

  const entries = 1 + reentryCount;
  const totalBuyIn = buyIn + reentryBuyInTotal;
  const totalServiceFee = serviceFee + reentryServiceFeeTotal;
  const totalCost = totalBuyIn + totalServiceFee;
  const netProfit = prize - totalCost;
  const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

  return {
    ...record,
    buyIn,
    serviceFee,
    reentryCount,
    reentryBuyInTotal,
    reentryServiceFeeTotal,
    entries,
    prize,
    displayEventName,
    totalBuyIn,
    totalServiceFee,
    totalCost,
    netProfit,
    roi,
  };
}

function sumRecords(records) {
  const calculated = records.map(calcRecord);
  const totalGames = calculated.length;
  const totalEntries = calculated.reduce((sum, r) => sum + r.entries, 0);
  const totalReentries = calculated.reduce((sum, r) => sum + r.reentryCount, 0);
  const totalBuyIn = calculated.reduce((sum, r) => sum + r.totalBuyIn, 0);
  const totalServiceFee = calculated.reduce((sum, r) => sum + r.totalServiceFee, 0);
  const totalCost = calculated.reduce((sum, r) => sum + r.totalCost, 0);
  const totalPrize = calculated.reduce((sum, r) => sum + r.prize, 0);
  const netProfit = calculated.reduce((sum, r) => sum + r.netProfit, 0);
  const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
  const avgProfit = totalGames > 0 ? netProfit / totalGames : 0;

  return { totalGames, totalEntries, totalReentries, totalBuyIn, totalServiceFee, totalCost, totalPrize, netProfit, roi, avgProfit };
}

function groupBy(records, getKey) {
  const groups = new Map();
  records.forEach((record) => {
    const label = getKey(record) || '未分類';
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(record);
  });

  return Array.from(groups.entries())
    .map(([label, items]) => ({ label, ...sumRecords(items) }))
    .sort((a, b) => b.netProfit - a.netProfit);
}

function filterRecordsByDate(records, startDate, endDate) {
  return records.filter((record) => {
    if (!record.date) return false;
    if (startDate && record.date < startDate) return false;
    if (endDate && record.date > endDate) return false;
    return true;
  });
}

function makeDailyProfitData(records) {
  const daily = new Map();
  records.forEach((record) => {
    const current = daily.get(record.date) || 0;
    daily.set(record.date, current + record.netProfit);
  });

  return Array.from(daily.entries())
    .map(([date, netProfit]) => ({ date, label: dateLabel(date), netProfit }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function makeCumulativeProfitData(records) {
  let running = 0;
  return records
    .slice()
    .sort((a, b) => {
      const dateCompare = String(a.date || '').localeCompare(String(b.date || ''));
      if (dateCompare !== 0) return dateCompare;
      return String(a.createdAt || '').localeCompare(String(b.createdAt || ''));
    })
    .map((record, index) => {
      running += record.netProfit;
      return { index: index + 1, date: record.date, label: dateLabel(record.date), netProfit: record.netProfit, cumulativeProfit: running };
    });
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) throw new Error(`${label}: expected ${expected}, got ${actual}`);
}

function runCalculationTests() {
  const oneEntry = calcRecord({ eventName: '1200限時錦標賽', buyIn: 1000, serviceFee: 200, reentryCount: 0, reentryBuyInTotal: 0, reentryServiceFeeTotal: 0, prize: 0 });
  assertEqual(oneEntry.totalCost, 1200, '單次總投入');
  assertEqual(oneEntry.netProfit, -1200, '未得獎淨利');
  assertEqual(Number(oneEntry.roi.toFixed(1)), -100.0, '未得獎 ROI');

  const discountedReentry = calcRecord({ eventName: '3400限時錦標賽', buyIn: 3000, serviceFee: 400, reentryCount: 1, reentryBuyInTotal: 3000, reentryServiceFeeTotal: 200, prize: 10000 });
  assertEqual(discountedReentry.entries, 2, '重買後 entries');
  assertEqual(discountedReentry.totalCost, 6600, '重買服務費折扣後總投入');
  assertEqual(discountedReentry.netProfit, 3400, '重買服務費折扣後淨利');

  const daily = makeDailyProfitData([
    { date: '2026-05-01', netProfit: 100 },
    { date: '2026-05-01', netProfit: -30 },
    { date: '2026-05-02', netProfit: 200 },
  ]);
  assertEqual(daily.length, 2, '每日盈虧合併同日期');
  assertEqual(daily[0].netProfit, 70, '每日盈虧加總');
  return true;
}

if (typeof window !== 'undefined') {
  try { runCalculationTests(); } catch (error) { console.error('Calculation self-test failed:', error); }
}

function CardBox({ children, className = '' }) {
  return <section className={`card ${className}`}>{children}</section>;
}

function StatCard({ title, value, sub }) {
  return (
    <CardBox>
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value}</div>
      {sub ? <div className="stat-sub">{sub}</div> : null}
    </CardBox>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder, min }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} min={min} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Select({ label, value, onChange, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>{children}</select>
    </label>
  );
}

function TabButton({ active, onClick, children }) {
  return <button type="button" onClick={onClick} className={`tab-btn ${active ? 'active' : ''}`}>{children}</button>;
}

function RangeButton({ active, onClick, children }) {
  return <button type="button" onClick={onClick} className={`range-btn ${active ? 'active' : ''}`}>{children}</button>;
}

function GroupTable({ rows }) {
  if (!rows.length) return <div className="empty-box">這個時間區間還沒有資料。</div>;

  return (
    <div className="group-table">
      <div className="group-row header"><span>分類</span><span>場次</span><span>淨利</span><span>ROI</span></div>
      {rows.map((row) => (
        <div key={row.label} className="group-row">
          <span className="group-label">{row.label}</span>
          <span>{row.totalGames}</span>
          <span className={row.netProfit >= 0 ? 'positive' : 'negative'}>{row.netProfit >= 0 ? '+' : '-'}{money(Math.abs(row.netProfit))}</span>
          <span>{percent(row.roi)}</span>
        </div>
      ))}
    </div>
  );
}

function EmptyChart({ message }) {
  return <div className="chart-empty">{message}</div>;
}

function CumulativeProfitChart({ data }) {
  if (!data.length) return <EmptyChart message="這個時間區間還沒有紀錄，無法產生累積淨利圖。" />;

  const width = 760;
  const height = 260;
  const padding = 36;
  const values = data.map((item) => item.cumulativeProfit);
  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(0, ...values);
  const range = maxValue - minValue || 1;
  const xStep = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;
  const y = (value) => height - padding - ((value - minValue) / range) * (height - padding * 2);
  const x = (index) => data.length > 1 ? padding + xStep * index : width / 2;
  const zeroY = y(0);
  const points = data.map((item, index) => `${x(index)},${y(item.cumulativeProfit)}`).join(' ');
  const last = data[data.length - 1];

  return (
    <div className="chart-scroll">
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg">
        <line x1={padding} x2={width - padding} y1={zeroY} y2={zeroY} className="axis-line" />
        <text x={padding} y={24} className="axis-text">最高 {money(maxValue)}</text>
        <text x={padding} y={height - 10} className="axis-text">最低 {money(minValue)}</text>
        {data.length === 1 ? <circle cx={x(0)} cy={y(data[0].cumulativeProfit)} r="5" className="line-dot" /> : <polyline fill="none" className="profit-line" points={points} />}
        {data.map((item, index) => (
          <g key={`${item.date}-${index}`}>
            <circle cx={x(index)} cy={y(item.cumulativeProfit)} r="3" className="line-dot" />
            {(index === 0 || index === data.length - 1 || data.length <= 8) ? <text x={x(index)} y={height - 16} textAnchor="middle" className="axis-text">{item.label}</text> : null}
          </g>
        ))}
        <text x={width - padding} y={24} textAnchor="end" className={last.cumulativeProfit >= 0 ? 'chart-total positive-fill' : 'chart-total negative-fill'}>
          目前 {last.cumulativeProfit >= 0 ? '+' : '-'}{money(Math.abs(last.cumulativeProfit))}
        </text>
      </svg>
    </div>
  );
}

function DailyProfitChart({ data }) {
  if (!data.length) return <EmptyChart message="這個時間區間還沒有紀錄，無法產生每日盈虧圖。" />;

  const width = 760;
  const height = 260;
  const padding = 36;
  const values = data.map((item) => item.netProfit);
  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(0, ...values);
  const range = maxValue - minValue || 1;
  const zeroY = height - padding - ((0 - minValue) / range) * (height - padding * 2);
  const barSpace = (width - padding * 2) / data.length;
  const barWidth = Math.max(8, Math.min(42, barSpace * 0.62));
  const y = (value) => height - padding - ((value - minValue) / range) * (height - padding * 2);

  return (
    <div className="chart-scroll">
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg">
        <line x1={padding} x2={width - padding} y1={zeroY} y2={zeroY} className="axis-line" />
        <text x={padding} y={24} className="axis-text">最高 {money(maxValue)}</text>
        <text x={padding} y={height - 10} className="axis-text">最低 {money(minValue)}</text>
        {data.map((item, index) => {
          const centerX = padding + barSpace * index + barSpace / 2;
          const valueY = y(item.netProfit);
          const rectY = item.netProfit >= 0 ? valueY : zeroY;
          const rectHeight = Math.max(2, Math.abs(zeroY - valueY));
          return (
            <g key={item.date}>
              <rect x={centerX - barWidth / 2} y={rectY} width={barWidth} height={rectHeight} rx="5" className={item.netProfit >= 0 ? 'bar-positive' : 'bar-negative'} />
              {(index === 0 || index === data.length - 1 || data.length <= 10) ? <text x={centerX} y={height - 16} textAnchor="middle" className="axis-text">{item.label}</text> : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function App() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [tab, setTab] = useState('add');
  const [rangePreset, setRangePreset] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setRecords(parsed);
      }
    } catch (error) {
      console.error('Failed to load saved records:', error);
    }
  }, []);

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); } catch (error) { console.error('Failed to save records:', error); }
  }, [records]);

  const calculatedForm = useMemo(() => calcRecord(form), [form]);
  const calculatedRecords = useMemo(() => records.map(calcRecord).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [records]);
  const filteredRecords = useMemo(() => filterRecordsByDate(calculatedRecords, startDate, endDate), [calculatedRecords, startDate, endDate]);
  const overall = useMemo(() => sumRecords(filteredRecords), [filteredRecords]);
  const byVenue = useMemo(() => groupBy(filteredRecords, (record) => record.venue), [filteredRecords]);
  const byEventName = useMemo(() => groupBy(filteredRecords, (record) => record.displayEventName), [filteredRecords]);
  const dailyProfitData = useMemo(() => makeDailyProfitData(filteredRecords), [filteredRecords]);
  const cumulativeProfitData = useMemo(() => makeCumulativeProfitData(filteredRecords), [filteredRecords]);

  function updateForm(key, value) { setForm((current) => ({ ...current, [key]: value })); }

  function changeEventName(value) {
    const template = EVENT_TEMPLATES[value];
    setForm((current) => ({
      ...current,
      eventName: value,
      customEventName: value === '自訂名稱' ? current.customEventName : '',
      buyIn: template ? template.buyIn : current.buyIn,
      serviceFee: template ? template.serviceFee : current.serviceFee,
      reentryBuyInTotal: 0,
      reentryServiceFeeTotal: 0,
      reentryCount: 0,
    }));
  }

  function changeReentryCount(value) {
    const reentryCount = Math.max(0, Math.floor(toNumber(value)));
    const suggestedBuyInTotal = Math.max(0, toNumber(form.buyIn)) * reentryCount;
    const suggestedServiceFeeTotal = Math.max(0, toNumber(form.serviceFee)) * reentryCount;
    setForm((current) => ({ ...current, reentryCount, reentryBuyInTotal: suggestedBuyInTotal, reentryServiceFeeTotal: suggestedServiceFeeTotal }));
  }

  function applyRangePreset(preset) {
    setRangePreset(preset);
    const today = todayString();
    if (preset === 'all') { setStartDate(''); setEndDate(''); }
    if (preset === 'week') { setStartDate(startOfCurrentWeekString()); setEndDate(today); }
    if (preset === 'month') { setStartDate(startOfCurrentMonthString()); setEndDate(today); }
    if (preset === '30days') { setStartDate(daysAgoString(29)); setEndDate(today); }
    if (preset === 'custom') { if (!startDate) setStartDate(today); if (!endDate) setEndDate(today); }
  }

  function addRecord() {
    const record = { ...form, id: makeId(), createdAt: new Date().toISOString() };
    setRecords((current) => [record, ...current]);
    setForm((current) => ({
      ...defaultForm,
      date: todayString(),
      venue: current.venue,
      eventName: current.eventName,
      customEventName: current.eventName === '自訂名稱' ? current.customEventName : '',
      buyIn: current.buyIn,
      serviceFee: current.serviceFee,
      reentryCount: 0,
      reentryBuyInTotal: 0,
      reentryServiceFeeTotal: 0,
    }));
    setTab('stats');
  }

  function removeRecord(id) { setRecords((current) => current.filter((record) => record.id !== id)); }

  function exportCsv() {
    const headers = ['日期', '場館', '賽事名稱', '買入金額', '買入服務費', '重買次數', '重買買入總額', '重買服務費總額', '總Entries', '總投入', '獎金', '淨利', 'ROI', '備註'];
    const rows = calculatedRecords.map((record) => [record.date, record.venue, record.displayEventName, record.buyIn, record.serviceFee, record.reentryCount, record.reentryBuyInTotal, record.reentryServiceFeeTotal, record.entries, record.totalCost, record.prize, record.netProfit, `${record.roi.toFixed(1)}%`, record.notes]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `限時錦標賽紀錄_${todayString()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function clearAll() {
    const confirmed = window.confirm('確定要清空所有紀錄嗎？這個動作無法復原。');
    if (confirmed) setRecords([]);
  }

  return (
    <div className="app-shell">
      <main className="container">
        <header className="hero">
          <div>
            <span className="badge">Limited Tournament Tracker</span>
            <h1>限時錦標賽記帳工具</h1>
            <p>選擇賽事會自動帶入預設金額，但買入、服務費與重買費用都可以手動修改。</p>
          </div>
          <div className="header-actions">
            <button className="btn secondary" onClick={exportCsv} disabled={records.length === 0}>⬇ 匯出 CSV</button>
            <button className="btn secondary" onClick={clearAll} disabled={records.length === 0}>↺ 清空</button>
          </div>
        </header>

        <nav className="tabs">
          <TabButton active={tab === 'add'} onClick={() => setTab('add')}>＋ 新增一場</TabButton>
          <TabButton active={tab === 'stats'} onClick={() => setTab('stats')}>▦ 統計</TabButton>
          <TabButton active={tab === 'records'} onClick={() => setTab('records')}>★ 紀錄</TabButton>
        </nav>

        {tab === 'add' && (
          <div className="two-column">
            <CardBox>
              <h2>新增賽事</h2>
              <div className="form-grid">
                <Input label="日期" type="date" value={form.date} onChange={(value) => updateForm('date', value)} />
                <Input label="場館" value={form.venue} onChange={(value) => updateForm('venue', value)} placeholder="例如：北屯店" />
                <Select label="限時錦標賽名稱" value={form.eventName} onChange={changeEventName}>{EVENT_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</Select>
                {form.eventName === '自訂名稱' ? <Input label="自訂賽事名稱" value={form.customEventName} onChange={(value) => updateForm('customEventName', value)} placeholder="例如：私人邀請限時賽" /> : <div className="hint-box">已自動帶入預設金額，可自行修改</div>}

                <div className="section-box wide">
                  <h3>買入</h3>
                  <div className="form-grid two">
                    <Input label="買入金額（不含服務費）" type="number" min="0" value={form.buyIn} onChange={(value) => updateForm('buyIn', value)} />
                    <Input label="買入服務費" type="number" min="0" value={form.serviceFee} onChange={(value) => updateForm('serviceFee', value)} />
                  </div>
                </div>

                <div className="section-box wide">
                  <div className="section-title">
                    <h3>重新買入</h3>
                    <p>重買費用不硬乘總額，下方兩欄可依折扣手動調整。</p>
                  </div>
                  <div className="form-grid three">
                    <Input label="重買次數" type="number" min="0" value={form.reentryCount} onChange={changeReentryCount} />
                    <Input label="重買買入總額" type="number" min="0" value={form.reentryBuyInTotal} onChange={(value) => updateForm('reentryBuyInTotal', value)} />
                    <Input label="重買服務費總額" type="number" min="0" value={form.reentryServiceFeeTotal} onChange={(value) => updateForm('reentryServiceFeeTotal', value)} />
                  </div>
                </div>

                <Input label="獎金 / Ticket 價值" type="number" min="0" value={form.prize} onChange={(value) => updateForm('prize', value)} />
                <div className="wide"><Input label="備註" value={form.notes} onChange={(value) => updateForm('notes', value)} placeholder="例如：重買服務費折扣、前三 deal、拿票券" /></div>
              </div>
              <button onClick={addRecord} className="btn primary full">＋ 儲存這一場</button>
            </CardBox>

            <aside className="stat-stack">
              <StatCard title="賽事分類" value={calculatedForm.displayEventName} sub="統計會依這個名稱分類" />
              <StatCard title="總 Entries" value={`${calculatedForm.entries} 次`} sub={`買入 1 次 + 重買 ${calculatedForm.reentryCount} 次`} />
              <StatCard title="總投入" value={`NT$ ${money(calculatedForm.totalCost)}`} sub={`買入 ${money(calculatedForm.totalBuyIn)} + 服務費 ${money(calculatedForm.totalServiceFee)}`} />
              <StatCard title="淨利" value={`${calculatedForm.netProfit >= 0 ? '+' : '-'}NT$ ${money(Math.abs(calculatedForm.netProfit))}`} sub={`獎金 NT$ ${money(calculatedForm.prize)} - 總投入`} />
              <StatCard title="ROI" value={percent(calculatedForm.roi)} sub="淨利 ÷ 總投入" />
            </aside>
          </div>
        )}

        {tab === 'stats' && (
          <div className="stack">
            <CardBox>
              <div className="range-head">
                <div><h2>時間區間</h2><p>所有統計與圖表都會依照這個區間更新。</p></div>
                <div className="range-buttons">
                  <RangeButton active={rangePreset === 'all'} onClick={() => applyRangePreset('all')}>全部</RangeButton>
                  <RangeButton active={rangePreset === 'week'} onClick={() => applyRangePreset('week')}>本週</RangeButton>
                  <RangeButton active={rangePreset === 'month'} onClick={() => applyRangePreset('month')}>本月</RangeButton>
                  <RangeButton active={rangePreset === '30days'} onClick={() => applyRangePreset('30days')}>近30天</RangeButton>
                  <RangeButton active={rangePreset === 'custom'} onClick={() => applyRangePreset('custom')}>自訂</RangeButton>
                </div>
              </div>
              <div className="form-grid two"><Input label="開始日期" type="date" value={startDate} onChange={(value) => { setRangePreset('custom'); setStartDate(value); }} /><Input label="結束日期" type="date" value={endDate} onChange={(value) => { setRangePreset('custom'); setEndDate(value); }} /></div>
            </CardBox>

            <div className="stats-grid">
              <StatCard title="總場次" value={`${overall.totalGames} 場`} sub={`總 Entries ${overall.totalEntries}｜重買 ${overall.totalReentries}`} />
              <StatCard title="總服務費" value={`NT$ ${money(overall.totalServiceFee)}`} sub={`總投入 NT$ ${money(overall.totalCost)}`} />
              <StatCard title="總獎金" value={`NT$ ${money(overall.totalPrize)}`} sub={`總買入 NT$ ${money(overall.totalBuyIn)}`} />
              <StatCard title="總淨利 / ROI" value={`${overall.netProfit >= 0 ? '+' : '-'}NT$ ${money(Math.abs(overall.netProfit))}`} sub={`ROI ${percent(overall.roi)}｜平均 ${money(overall.avgProfit)} / 場`} />
            </div>

            <div className="chart-grid">
              <CardBox><h2>累積淨利圖</h2><p className="card-subtitle">依賽事時間排序，顯示資金曲線。</p><CumulativeProfitChart data={cumulativeProfitData} /></CardBox>
              <CardBox><h2>每日盈虧圖</h2><p className="card-subtitle">同一天多場會合併成單日淨利。</p><DailyProfitChart data={dailyProfitData} /></CardBox>
            </div>

            <div className="chart-grid">
              <CardBox><h2>依賽事名稱統計</h2><GroupTable rows={byEventName} /></CardBox>
              <CardBox><h2>依場館統計</h2><GroupTable rows={byVenue} /></CardBox>
            </div>
          </div>
        )}

        {tab === 'records' && (
          <CardBox>
            <h2>賽事紀錄</h2>
            {calculatedRecords.length === 0 ? <div className="empty-box">還沒有紀錄。先新增一場。</div> : (
              <div className="record-list">
                {calculatedRecords.map((record) => (
                  <div key={record.id} className="record-card">
                    <div>
                      <strong>{record.date}｜{record.venue}｜{record.displayEventName}</strong>
                      <p>Entries {record.entries}｜重買 {record.reentryCount}｜總投入 NT$ {money(record.totalCost)}｜服務費 NT$ {money(record.totalServiceFee)}</p>
                      <small>買入 {money(record.buyIn)} + 買入服務費 {money(record.serviceFee)}｜重買買入 {money(record.reentryBuyInTotal)} + 重買服務費 {money(record.reentryServiceFeeTotal)}</small>
                      <p>獎金 NT$ {money(record.prize)}｜淨利 <span className={record.netProfit >= 0 ? 'positive' : 'negative'}>{record.netProfit >= 0 ? '+' : '-'}NT$ {money(Math.abs(record.netProfit))}</span>｜ROI {percent(record.roi)}</p>
                      {record.notes ? <p className="notes">{record.notes}</p> : null}
                    </div>
                    <button className="icon-btn" onClick={() => removeRecord(record.id)} aria-label="刪除紀錄">×</button>
                  </div>
                ))}
              </div>
            )}
          </CardBox>
        )}
      </main>
    </div>
  );
}
