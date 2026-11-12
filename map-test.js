// 地圖底圖測試頁 (OpenSpec change google-map-tiles 用,正式換進 App 後刪掉)
// 讓使用者用手機比較 Google 底圖的地名語言、字的大小、深淺色,並跟現在的 OpenStreetMap 底圖對照
(function () {
  const KEY = "AIzaSyAFrF2zfEIb0TVBYSoGvDLdC3ooK6vpo4I";
  const API = "https://tile.googleapis.com";
  const PAGE_VERSION = "測試頁 1";
  const HOTEL_ID = "syla_hotel";
  const SESSION_TIMEOUT_MS = 5000;

  const DAY_COLORS = { 1: "#ef4444", 2: "#f97316", 3: "#a855f7", 4: "#3b82f6", 5: "#10b981", 6: "#ec4899" };

  // 地名:Google 不會把日本地名翻成中文,zh-TW 的地名跟 ja 一樣是日文,但版權文字是中文
  const LANGS = {
    ja: { label: "日文", language: "zh-TW" },
    en: { label: "英日並列", language: "en-US" }
  };

  // 字的大小:highDpi 只能搭配 2x/4x。4x 的圖磚放大成 512px 顯示 (看的是低一層的圖面),字才會變兩倍大
  const SIZES = {
    normal: { label: "一般", scale: "scaleFactor2x", tileSize: 256, zoomOffset: 0 },
    large: { label: "兩倍字", scale: "scaleFactor4x", tileSize: 512, zoomOffset: -1 }
  };

  // Google Maps 官方範例的 Night mode 樣式,文字顏色調亮,手機上比較好讀
  const NIGHT_STYLES = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#b8b0a2" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#e0b07a" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#e0b07a" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
    { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#8fbf98" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#c0c7d2" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
    { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
    { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
    { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#e0b07a" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#7d8aa0" }] },
    { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] }
  ];

  // Google 規定背景複雜 (地圖) 時用有外框的 logo
  const LOGOS = {
    light: "assets/GoogleMaps_Logo_WithLightOutline.svg",
    dark: "assets/GoogleMaps_Logo_WithDarkOutline.svg"
  };

  const OSM_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  const state = { base: "google", lang: "ja", size: "normal", theme: "light" };
  // 同一組設定只建立一次通行碼:圖磚網址固定,瀏覽器快取才用得到
  const sessions = {};
  const diag = { session: "—", tile: "—", loaded: 0, failed: 0, copyright: "—" };

  let baseLayer = null;
  let copyrightText = "";
  let switchCount = 0; // 連續快速切換時,只套用最後一次

  const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));

  const comboId = () => `${state.lang}-${state.size}-${state.theme}`;

  // ---------- 地圖、地點、D5 路線 ----------
  const map = L.map("map", { maxZoom: 19, minZoom: 10 }).setView([35.7135, 139.7955], 15);

  const places = typeof PLACES !== "undefined" ? PLACES : [];
  places.forEach((p) => {
    L.circleMarker([p.lat, p.lng], {
      radius: 7,
      color: "#ffffff",
      weight: 2,
      fillColor: DAY_COLORS[p.day] || "#9ca3af",
      fillOpacity: 0.95
    }).bindPopup(`${p.day ? "D" + p.day : "候補"} ${escapeHtml(p.name)}`).addTo(map);
  });

  const hotel = places.find((p) => p.id === HOTEL_ID);
  const day5 = places.filter((p) => p.day === 5).sort((a, b) => String(a.time).localeCompare(String(b.time)));
  const route = [hotel, ...day5, hotel].filter(Boolean).map((p) => [p.lat, p.lng]);
  L.polyline(route, { color: DAY_COLORS[5], weight: 4, opacity: 0.8, dashArray: "8, 8" }).addTo(map);

  // ---------- Google logo ----------
  const LogoControl = L.Control.extend({
    options: { position: "bottomleft" },
    onAdd() {
      const img = L.DomUtil.create("img", "google-logo");
      img.alt = "Google Maps";
      img.hidden = true;
      return img;
    }
  });
  const logoControl = new LogoControl().addTo(map);

  function showLogo(visible) {
    const img = logoControl.getContainer();
    img.hidden = !visible;
    if (visible) img.src = LOGOS[state.theme];
  }

  // ---------- 版權文字 ----------
  function setCopyright(text) {
    if (copyrightText) map.attributionControl.removeAttribution(copyrightText);
    copyrightText = text ? escapeHtml(text) : "";
    if (copyrightText) map.attributionControl.addAttribution(copyrightText);
  }

  async function updateCopyright() {
    const session = sessions[comboId()];
    if (state.base !== "google" || !session) return;
    const b = map.getBounds();
    const zoom = Math.round(map.getZoom()) + SIZES[state.size].zoomOffset;
    const params = new URLSearchParams({
      session: session.session,
      key: KEY,
      zoom: String(zoom),
      north: String(b.getNorth()),
      south: String(b.getSouth()),
      east: String(b.getEast()),
      west: String(b.getWest())
    });
    try {
      const res = await fetch(`${API}/tile/v1/viewport?${params}`);
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.copyright) {
        setCopyright(json.copyright);
        diag.copyright = json.copyright;
      } else {
        diag.copyright = `失敗:HTTP ${res.status} ${json.error ? json.error.message : ""}`;
      }
    } catch (err) {
      diag.copyright = `失敗:${err.message}`;
    }
    renderDiag();
  }

  let copyrightTimer = null;
  map.on("moveend", () => {
    clearTimeout(copyrightTimer);
    copyrightTimer = setTimeout(updateCopyright, 500);
    renderDiag();
  });

  // ---------- 通行碼 ----------
  async function getSession() {
    const id = comboId();
    if (sessions[id]) return sessions[id];

    const body = {
      mapType: "roadmap",
      language: LANGS[state.lang].language,
      region: "TW",
      scale: SIZES[state.size].scale,
      highDpi: true
    };
    if (state.theme === "dark") body.styles = NIGHT_STYLES;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SESSION_TIMEOUT_MS);
    try {
      const res = await fetch(`${API}/v1/createSession?key=${KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.session) {
        throw new Error(`HTTP ${res.status} ${json.error ? json.error.message : "沒有拿到通行碼"}`);
      }
      sessions[id] = json;
      return json;
    } catch (err) {
      if (err.name === "AbortError") throw new Error(`逾時 (${SESSION_TIMEOUT_MS / 1000} 秒沒有回應)`);
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  // ---------- 切換底圖 ----------
  function setBaseLayer(layer) {
    if (baseLayer) map.removeLayer(baseLayer);
    baseLayer = layer;
    diag.loaded = 0;
    diag.failed = 0;
    if (!layer) return;
    layer.on("tileload", () => { diag.loaded += 1; renderDiagSoon(); });
    layer.on("tileerror", () => { diag.failed += 1; renderDiagSoon(); });
    layer.addTo(map);
    layer.bringToBack();
  }

  async function applyState() {
    const myCount = ++switchCount;
    document.body.classList.toggle("dark", state.theme === "dark");
    document.body.classList.toggle("osm", state.base === "osm");
    renderButtons();
    setCopyright("");

    if (state.base === "osm") {
      showLogo(false);
      diag.session = "(現在的地圖,不用通行碼)";
      diag.tile = "256×256px";
      diag.copyright = "OpenStreetMap";
      setBaseLayer(L.tileLayer(OSM_URL, { attribution: OSM_ATTRIBUTION, maxZoom: 19, crossOrigin: true }));
      renderDiag();
      return;
    }

    diag.session = "建立中⋯";
    diag.copyright = "—";
    renderDiag();
    try {
      const s = await getSession();
      if (myCount !== switchCount) return;
      const size = SIZES[state.size];
      diag.session = `成功,有效到 ${new Date(Number(s.expiry) * 1000).toLocaleString("zh-TW")}`;
      diag.tile = `${s.tileWidth}×${s.tileHeight}px,顯示成 ${size.tileSize}px`;
      const url = `${API}/v1/2dtiles/{z}/{x}/{y}?session=${encodeURIComponent(s.session)}&key=${KEY}`;
      setBaseLayer(L.tileLayer(url, { tileSize: size.tileSize, zoomOffset: size.zoomOffset, maxZoom: 19, minZoom: 10 }));
      showLogo(true);
      updateCopyright();
    } catch (err) {
      if (myCount !== switchCount) return;
      // 測試頁不退回現在的地圖,讓問題看得出來
      setBaseLayer(null);
      showLogo(false);
      diag.session = `失敗:${err.message}`;
      diag.tile = "—";
    }
    renderDiag();
  }

  // ---------- 按鈕與診斷資訊 ----------
  function renderButtons() {
    document.querySelectorAll("[data-key]").forEach((btn) => {
      btn.classList.toggle("active", state[btn.dataset.key] === btn.dataset.value);
    });
    document.querySelectorAll(".google-only").forEach((row) => {
      row.classList.toggle("dim", state.base === "osm");
    });
  }

  function renderDiag() {
    const zoom = map.getZoom();
    const tileZoom = state.base === "google" ? zoom + SIZES[state.size].zoomOffset : zoom;
    const baseLabel = state.base === "google"
      ? `Google (${LANGS[state.lang].label}、${SIZES[state.size].label}、${state.theme === "dark" ? "深色" : "淺色"})`
      : `現在的地圖 (${state.theme === "dark" ? "深色" : "淺色"})`;
    const rows = [
      ["頁面", PAGE_VERSION],
      ["螢幕倍率", String(window.devicePixelRatio)],
      ["Service Worker", navigator.serviceWorker && navigator.serviceWorker.controller ? "有" : "沒有"],
      ["底圖", baseLabel],
      ["通行碼", diag.session],
      ["圖磚大小", diag.tile],
      ["縮放", `${zoom} (圖磚層級 ${tileZoom})`],
      ["圖磚", `成功 ${diag.loaded} 張、失敗 ${diag.failed} 張`],
      ["版權文字", diag.copyright]
    ];
    document.getElementById("diag").innerHTML = rows
      .map(([label, value]) => `<li>${escapeHtml(label)}:${escapeHtml(value)}</li>`)
      .join("");
  }

  let diagTimer = null;
  function renderDiagSoon() {
    if (diagTimer) return;
    diagTimer = setTimeout(() => { diagTimer = null; renderDiag(); }, 300);
  }

  document.querySelectorAll("[data-key]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (state[btn.dataset.key] === btn.dataset.value) return;
      state[btn.dataset.key] = btn.dataset.value;
      applyState();
    });
  });

  applyState();
})();
