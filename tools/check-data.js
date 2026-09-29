// 檢查 data.js 的行程資料,以及 index.html 裡跟行程有關的地方
// 用法:node tools/check-data.js   (有錯誤時結束代碼為 1)
//
// ❌ 錯誤:app 會顯示錯誤或行為不對,一定要修
// ⚠️ 提醒:可能是打錯,請確認
//
// 前一站的判斷方式與 app.js 的 buildPrevStopMap 相同:
// 當天依時間排序,第一站的前一站是飯店;dayStart 的地點是當天起點,沒有前一站
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

const { PLACES, TRIP_METADATA } = new Function(`${read("data.js")}; return { PLACES, TRIP_METADATA };`)();
const indexHtml = read("index.html");
const HOTEL_ID = (read("app.js").match(/const HOTEL_ID = "([^"]+)"/) || [])[1];

const CATEGORIES = ["food", "shopping", "sightseeing", "lodging", "transport"];
const TRANSIT_METHODS = ["walk", "subway", "train", "bus"];
// 可以排的天數 = index.html 的天數按鈕 (D1 ~ D6)
const DAYS = [...indexHtml.matchAll(/class="day-btn[^"]*" data-day="(\d+)"/g)].map((m) => Number(m[1]));
const LAST_DAY = Math.max(...DAYS);

const errors = [];
const warnings = [];
const label = (p) => `「${p.name || p.id}」`;

// 時間統一成 HH:MM,格式不對回傳 null (與 app.js 的 normalizeTime 相同,另外檢查時分範圍)
const normalizeTime = (time) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(time ?? "").trim());
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return null;
  return `${m[1].padStart(2, "0")}:${m[2]}`;
};
const toMinutes = (time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));

// from 寫的是簡稱 (例如「花山烏冬」),只要每個詞都出現在前一站的名稱或日文/英文名稱裡就算對
const fromMatches = (from, place) => {
  const haystack = `${place.name} ${place.englishName || ""}`.toLowerCase();
  return String(from || "").toLowerCase().split(/\s+/).filter(Boolean).every((word) => haystack.includes(word));
};

// ---------- TRIP_METADATA ----------
if (Number.isNaN(Date.parse(TRIP_METADATA.departureISO || ""))) {
  errors.push(`TRIP_METADATA.departureISO 不是有效的時間:${TRIP_METADATA.departureISO}`);
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(TRIP_METADATA.startDate || "")) {
  errors.push(`TRIP_METADATA.startDate 要寫成 YYYY-MM-DD:${TRIP_METADATA.startDate}`);
}
const budget = TRIP_METADATA.budget || {};
["targetTwd", "flightTwd", "jpyRate", "pocketJpy"].forEach((key) => {
  if (typeof budget[key] !== "number" || !(budget[key] > 0)) {
    errors.push(`TRIP_METADATA.budget.${key} 要是大於 0 的數字:${budget[key]}`);
  }
});
if (typeof TRIP_METADATA.accommodation?.perPersonJpy !== "number") {
  errors.push("TRIP_METADATA.accommodation.perPersonJpy 要是數字");
}

// ---------- 每個地點的欄位 ----------
const ids = new Set();
const names = new Set();
for (const p of PLACES) {
  if (!p.id) errors.push(`有地點沒有 id:${label(p)}`);
  else if (ids.has(p.id)) errors.push(`id 重複:${p.id}`);
  ids.add(p.id);

  if (!p.name) errors.push(`${p.id} 沒有名稱`);
  else if (names.has(p.name)) warnings.push(`名稱重複:${label(p)}`);
  names.add(p.name);

  if (!CATEGORIES.includes(p.category)) {
    errors.push(`${label(p)}的 category「${p.category}」不對,要是 ${CATEGORIES.join(" / ")}`);
  }
  // 座標大致要在日本範圍內 (經緯度打反或少一位數時會抓到)
  if (typeof p.lat !== "number" || typeof p.lng !== "number" ||
      p.lat < 20 || p.lat > 46 || p.lng < 122 || p.lng > 154) {
    errors.push(`${label(p)}的座標不在日本範圍內:${p.lat}, ${p.lng}`);
  }

  if (p.day !== null && !DAYS.includes(p.day)) {
    errors.push(`${label(p)}的 day 是 ${p.day},只能是 ${DAYS.join("、")} 或 null (候補)`);
  }
  if (p.day !== null && !normalizeTime(p.time)) {
    errors.push(`${label(p)}排在 Day ${p.day},但時間「${p.time}」不是 HH:MM`);
  }
  if (p.day === null && (p.time || p.transitInfo || p.dayStart)) {
    warnings.push(`${label(p)}是候補,time / transitInfo / dayStart 不會用到,可以設成 null`);
  }

  if (!p.gmaps || !/^https:\/\//.test(p.gmaps)) {
    warnings.push(`${label(p)}的 Google Maps 連結不是 https 網址:${p.gmaps}`);
  }
  if (!p.imageFolder) {
    warnings.push(`${label(p)}沒有設定 imageFolder`);
  } else if (!fs.existsSync(path.join(ROOT, "images", p.imageFolder))) {
    warnings.push(`${label(p)}的照片資料夾不存在:images/${p.imageFolder}`);
  }
}

// ---------- 行程順序與交通說明 ----------
const byId = Object.fromEntries(PLACES.map((p) => [p.id, p]));
if (!byId[HOTEL_ID]) errors.push(`找不到飯店 ${HOTEL_ID} (app.js 的 HOTEL_ID)`);

const scheduled = PLACES
  .filter((p) => p.day !== null && DAYS.includes(p.day) && normalizeTime(p.time))
  .sort((a, b) => a.day - b.day || normalizeTime(a.time).localeCompare(normalizeTime(b.time)));

const lastStopOfDay = {};
for (const p of scheduled) {
  const isFirstOfDay = !(p.day in lastStopOfDay);
  const prev = p.dayStart ? null : byId[lastStopOfDay[p.day] ?? HOTEL_ID];
  lastStopOfDay[p.day] = p.id;

  if (p.dayStart && !isFirstOfDay) {
    warnings.push(`${label(p)}設了 dayStart,但不是 Day ${p.day} 最早的一站`);
  }
  if (!prev) {
    if (p.transitInfo) warnings.push(`${label(p)}是當天起點 (dayStart),transitInfo 不會顯示`);
    continue;
  }

  const info = p.transitInfo;
  if (!info) {
    warnings.push(`${label(p)}沒有 transitInfo,app 只會顯示 Google Maps 路線 (前一站:${label(prev)})`);
    continue;
  }
  if (!fromMatches(info.from, prev)) {
    errors.push(`${label(p)}的交通說明寫從「${info.from}」出發,但實際前一站是${label(prev)} (app 會改顯示 Google Maps 路線)`);
  }
  if (!TRANSIT_METHODS.includes(info.method)) {
    errors.push(`${label(p)}的 transitInfo.method「${info.method}」不對,要是 ${TRANSIT_METHODS.join(" / ")}`);
  }
  if (typeof info.duration !== "number" || !(info.duration > 0)) {
    errors.push(`${label(p)}的 transitInfo.duration 要是大於 0 的數字 (分鐘):${info.duration}`);
  }
  if (!info.line || !info.details) {
    warnings.push(`${label(p)}的 transitInfo 缺少 line 或 details`);
  }

  // 前一站同一天時,出發時間 + 交通時間不能晚於抵達時間 (通常是時間打錯)
  if (prev.day === p.day && normalizeTime(prev.time) && typeof info.duration === "number") {
    const arrival = toMinutes(normalizeTime(prev.time)) + info.duration;
    if (arrival > toMinutes(normalizeTime(p.time))) {
      warnings.push(`${label(p)} ${normalizeTime(p.time)}:從${label(prev)} ${normalizeTime(prev.time)} 出發要 ${info.duration} 分鐘,時間來不及`);
    }
  }
}

DAYS.forEach((day) => {
  if (!(day in lastStopOfDay)) warnings.push(`Day ${day} 沒有排任何地點`);
});
const finalStop = byId[lastStopOfDay[LAST_DAY]];
if (finalStop && finalStop.category !== "transport") {
  warnings.push(`最後一天 (Day ${LAST_DAY}) 的最後一站是${label(finalStop)},不是回程機場`);
}

// ---------- index.html 的天數標籤 ----------
for (const [, id] of indexHtml.matchAll(/data-day-of="([^"]+)"/g)) {
  if (!byId[id]) errors.push(`index.html 的天數標籤 data-day-of="${id}" 找不到這個地點`);
}

// ---------- 結果 ----------
const candidates = PLACES.filter((p) => p.day === null).length;
console.log(`已檢查 data.js:${PLACES.length} 個地點 (${PLACES.length - candidates} 個排入行程、${candidates} 個候補)`);
if (errors.length) {
  console.log(`\n❌ 錯誤 (${errors.length}):`);
  errors.forEach((e) => console.log(`  - ${e}`));
}
if (warnings.length) {
  console.log(`\n⚠️ 提醒 (${warnings.length}):`);
  warnings.forEach((w) => console.log(`  - ${w}`));
}
if (!errors.length && !warnings.length) console.log("✅ 沒有發現問題");
process.exitCode = errors.length ? 1 : 0;
