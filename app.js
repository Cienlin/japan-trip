// 東京行程地圖 app:地圖、時間軸、美食景點、行前指南、本機編輯

document.addEventListener("DOMContentLoaded", () => {
  // iOS standalone/PWA can report different values for 100vh, 100dvh and the
  // fixed-position viewport. Use one measured height for every full-screen layer.
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
                (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

  const syncAppViewportHeight = () => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
                         window.navigator.standalone === true;

    // 瀏覽器模式下用 visualViewport (排除 URL bar)
    const vv = window.visualViewport?.height || window.innerHeight;
    let viewportHeight = isStandalone ? Math.max(vv, window.innerHeight || 0) : vv;

    // iOS PWA 會把 viewport 錯報得比物理螢幕短 (少了 safe-area),改用螢幕高度補滿。
    // - iOS 的 screen.width/height 固定是直立尺寸,橫放時要取短邊
    // - 只在差距是 safe-area 等級時才補,避免 iPad 分割畫面等視窗被撐出螢幕
    // - Android 的 screen.height 含系統列,不適用
    if (isStandalone && isIOS) {
      const isLandscape = window.matchMedia("(orientation: landscape)").matches;
      const { width: sw, height: sh } = window.screen;
      const physicalHeight = isLandscape ? Math.min(sw, sh) : Math.max(sw, sh);
      const gap = physicalHeight - viewportHeight;
      if (gap > 0 && gap <= 120) viewportHeight = physicalHeight;
    }

    document.documentElement.style.setProperty("--app-height", `${viewportHeight}px`);
  };
  syncAppViewportHeight();
  window.addEventListener("resize", syncAppViewportHeight, { passive: true });
  window.visualViewport?.addEventListener("resize", syncAppViewportHeight, { passive: true });

  // 1. Initialize State
  const STORAGE_KEYS = {
    theme: "tokyo_trip_theme",
    customPlaces: "tokyo_trip_custom_places",
    placeOverrides: "tokyo_trip_place_overrides",
    checklist: "tokyo_trip_checklist_state",
    budget: "tokyo_trip_budget_inputs"
  };

  const HOTEL_ID = "syla_hotel";
  // 內建地點 (data.js) 可在本機修改的欄位;修改存成 override,不動 data.js
  const EDITABLE_FIELDS = ["name", "englishName", "day", "time", "desc", "gmaps"];

  let map = null;
  let activeTheme = localStorage.getItem(STORAGE_KEYS.theme) || 'light';
  let activeTab = 'itinerary';
  let activeDay = 'all';
  let activeCategory = 'all';
  let searchQuery = '';
  
  let mapMarkers = [];
  let mapPolylines = [];
  
  // Custom Places Data Lists
  // 內建地點的圖片來自 image-manifest.js (images/<imageFolder>/ 裡的數字檔名,由 tools/sync-images.js 產生)
  const placeImages = typeof PLACE_IMAGES !== "undefined" ? PLACE_IMAGES : {};
  let defaultPlaces = typeof PLACES !== "undefined"
    ? PLACES.map(p => ({ ...p, images: placeImages[p.id] || [] }))
    : [];
  let customPlaces = [];
  // 內建地點的本機修改:{ [placeId]: { 有改動的欄位..., deleted?: true } }
  let placeOverrides = {};
  let allPlaces = [];
  // 原始行程 (data.js) 中每一站的前一站,用來判斷交通說明是否仍然適用
  let originalPrevStop = {};

  // 編輯中的地點 id;null 代表表單是「新增」模式
  let editingPlaceId = null;

  // Active slide index for current open drawer carousel
  let currentSlideIndex = 0;

  // 最後選取的地點 (地圖 marker 與時間軸都會標示)
  let selectedPlaceId = null;

  // DOM Elements
  const tripTitleEl = document.getElementById("trip-title");
  const tripDatesEl = document.getElementById("trip-dates");
  const countdownTextEl = document.getElementById("countdown-text");
  
  // Tab Elements
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");
  
  // Itinerary / Day Selector
  const daySelectorContainer = document.getElementById("day-selector-container");
  const timelineContainer = document.getElementById("timeline-container");
  
  // Directory Search / Filters
  const searchInput = document.getElementById("place-search");
  const placesListContainer = document.getElementById("places-list-container");
  
  // Logistics Info
  const flightArrTimeEl = document.getElementById("flight-arr-time");
  const flightDepTimeEl = document.getElementById("flight-dep-time");
  const hotelNameEl = document.getElementById("hotel-name");
  const hotelAddressEl = document.getElementById("hotel-address");
  const hotelCostEl = document.getElementById("hotel-cost");
  const hotelAgodaLink = document.getElementById("hotel-agoda-link");
  const hotelLocateBtn = document.getElementById("hotel-locate-btn");
  
  // Map Elements
  const themeToggleBtn = document.getElementById("theme-toggle");
  const resetViewBtn = document.getElementById("reset-view-btn");
  const zoomInBtn = document.getElementById("zoom-in-btn");
  const zoomOutBtn = document.getElementById("zoom-out-btn");
  
  // Drawer Elements
  const detailDrawer = document.getElementById("detail-drawer");
  const closeDrawerBtn = document.getElementById("close-drawer-btn");
  const drawerContentBody = document.getElementById("drawer-content-body");
  
  // Sidebar container for mobile
  const sidebar = document.querySelector(".sidebar");

  // Modal / Form Elements for Adding Custom Places
  const openAddModalBtn = document.getElementById("open-add-modal-btn");
  const addPlaceModal = document.getElementById("add-place-modal");
  const modalCloseBtn = document.getElementById("modal-close-btn");
  const modalCancelBtn = document.getElementById("modal-cancel-btn");
  const addPlaceForm = document.getElementById("add-place-form");
  const mapPickCoordsBtn = document.getElementById("map-pick-coords-btn");
  const mapPickerBanner = document.getElementById("map-picker-banner");
  const cancelMapPickBtn = document.getElementById("cancel-map-pick-btn");

  // Local edits: 提示列與匯出視窗
  const localChangesBanner = document.getElementById("local-changes-banner");
  const localChangesText = document.getElementById("local-changes-text");
  const restoreAllBtn = document.getElementById("restore-all-btn");
  const exportModal = document.getElementById("export-modal");
  const exportTextarea = document.getElementById("export-textarea");
  const exportCopyBtn = document.getElementById("export-copy-btn");

  let isPickingCoords = false;
  let tempPickMarker = null;

  // Map tile — 2024 起 CARTO basemaps 開始要 API key + 浮水印,改用 OpenStreetMap
  // 深色主題透過 CSS filter 反轉,不需第二個 tile source
  const tileUrl = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  const tileAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  // Icons mapping for categories
  const categoryEmojis = {
    lodging: "🏨",
    food: "🍔",
    shopping: "🛍️",
    sightseeing: "🗼"
  };

  // Transit method → emoji lookup
  const transitEmojis = {
    walk: "🚶",
    bus: "🚌",
    subway: "🚃",
    train: "🚆"
  };

  // 沒有圖片時顯示的預設圖
  const PLACEHOLDER_IMAGE = "images/placeholder.svg";

  // Helpers
  const resolveImageUrl = (img) => {
    if (!img) return PLACEHOLDER_IMAGE;
    if (/^https?:\/\//.test(img)) return img;
    // 舊版自訂地點存的是已移除的根目錄預設圖 (例如 "tonkatsu_1.jpg"),改顯示預設圖
    if (!img.includes("/")) return PLACEHOLDER_IMAGE;
    return `images/${img}`;
  };

  const firstImageOf = (place) => {
    const list = place.images && place.images.length > 0 ? place.images : null;
    return resolveImageUrl(list ? list[0] : null);
  };

  const transitEmojiOf = (info) => transitEmojis[info?.method] || "🚃";

  // 時間統一成 HH:MM (例如 "9:30" → "09:30"),字串排序才會正確;格式不符回傳 null
  const normalizeTime = (time) => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(time ?? "").trim());
    return m ? `${m[1].padStart(2, "0")}:${m[2]}` : null;
  };

  // 行程排序:先依天數,再依時間,沒有時間的排在當天最後。時間軸與地圖路線共用,確保順序一致
  const sortByDayTime = (a, b) => {
    if (a.day !== b.day) return (a.day ?? 0) - (b.day ?? 0);
    const ta = normalizeTime(a.time) || "99:99";
    const tb = normalizeTime(b.time) || "99:99";
    return ta.localeCompare(tb);
  };

  // 每一站的前一站 id,當天第一站的前一站是飯店。{ [placeId]: prevPlaceId }
  // dayStart 的地點 (例如抵達日的機場) 是當天起點,沒有前一站
  const buildPrevStopMap = (places) => {
    const prevStop = {};
    const lastStopOfDay = {};
    places.filter(p => p.day !== null && p.day !== undefined).sort(sortByDayTime).forEach(p => {
      prevStop[p.id] = p.dayStart ? null : (lastStopOfDay[p.day] ?? HOTEL_ID);
      lastStopOfDay[p.day] = p.id;
    });
    return prevStop;
  };

  // Google Maps 路線 (用座標,不受店名翻譯影響);walk 用步行,其餘用大眾運輸
  const directionsUrl = (from, to, method) => {
    const mode = method === "walk" ? "walking" : "transit";
    return `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}` +
           `&destination=${to.lat},${to.lng}&travelmode=${mode}`;
  };

  const readJson = (key, fallback) => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
    } catch (e) {
      console.error(`Failed to read ${key}:`, e);
      return fallback;
    }
  };

  // Escape HTML to prevent XSS from user-added custom places (name/desc/etc.)
  const escapeHtml = (str) => {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  // Sanitize a URL for safe use in href/src. Rejects javascript:, data: etc.
  const safeUrl = (url) => {
    if (!url) return "";
    const trimmed = String(url).trim();
    if (/^\s*(javascript|data|vbscript):/i.test(trimmed)) return "";
    return trimmed;
  };

  // Escape a URL for safe interpolation inside a CSS url("...") value.
  const cssEscapeUrl = (url) => String(url || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  // Shared markup for the delete pin on custom places.
  // Uses [data-action="delete-place"] so we can rely on event delegation instead of inline onclick.
  const deleteButtonMarkup = () => `
    <button class="delete-place-btn" title="刪除自訂地點" data-action="delete-place" aria-label="刪除此自訂地點">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
    </button>
  `;

  // ==========================================
  // INITIALIZATION & DATA MERGING
  // ==========================================
  
  function init() {
    // 首次繪製前的主題已由 index.html 開頭的 inline script 套用,這裡同步 body class
    applyTheme(activeTheme);

    // Load persisted custom places & local edits
    refreshAllPlaces();
    originalPrevStop = buildPrevStopMap(defaultPlaces);

    // A. Render metadata
    if (typeof TRIP_METADATA !== "undefined") {
      tripTitleEl.textContent = TRIP_METADATA.title;
      tripDatesEl.textContent = TRIP_METADATA.dates;
      flightArrTimeEl.textContent = `${TRIP_METADATA.flightDetails.arrival.date} ${TRIP_METADATA.flightDetails.arrival.time} (${TRIP_METADATA.flightDetails.arrival.notes})`;
      flightDepTimeEl.textContent = `${TRIP_METADATA.flightDetails.departure.date} ${TRIP_METADATA.flightDetails.departure.time} (${TRIP_METADATA.flightDetails.departure.notes})`;
      
      hotelNameEl.textContent = TRIP_METADATA.accommodation.name;
      hotelAddressEl.textContent = TRIP_METADATA.accommodation.address;
      hotelCostEl.textContent = `費用總額：${TRIP_METADATA.accommodation.cost}`;
      hotelAgodaLink.href = TRIP_METADATA.accommodation.link;
      
      initCountdown();
      setInterval(initCountdown, 60000); // Update every minute
    }

    // B. Initialize Leaflet Map
    initMap();

    // C. Setup Event Listeners
    setupEventListeners();

    // D. Render Itinerary and Directory initial lists
    renderItinerary();
    renderDirectory();

    // E. Initialize Persistence & Calculators
    initChecklist();
    initBudgetCalculator();
  }

  // 讀取本機的自訂地點與內建地點修改,合併成 allPlaces
  function refreshAllPlaces() {
    customPlaces = readJson(STORAGE_KEYS.customPlaces, []);
    placeOverrides = readJson(STORAGE_KEYS.placeOverrides, {});
    if (pruneRedundantOverrides()) savePlaceOverrides();

    // 自訂地點已經加進共用行程 (data.js 有同名、同座標的地點) 時自動移除,避免重複
    const isInSharedItinerary = (custom) => defaultPlaces.some(p =>
      p.name === custom.name && Math.abs(p.lat - custom.lat) < 1e-5 && Math.abs(p.lng - custom.lng) < 1e-5);
    if (customPlaces.some(isInSharedItinerary)) {
      customPlaces = customPlaces.filter(c => !isInSharedItinerary(c));
      saveCustomPlaces();
    }

    const editedDefaults = defaultPlaces
      .filter(p => !placeOverrides[p.id]?.deleted)
      .map(p => {
        const override = placeOverrides[p.id];
        if (!override) return p;
        const merged = { ...p };
        EDITABLE_FIELDS.forEach(field => {
          if (field in override) merged[field] = override[field];
        });
        return merged;
      });
    allPlaces = [...editedDefaults, ...customPlaces];
  }

  // 本機修改已經跟共用行程 (data.js) 一樣時自動清掉,例如貼給 Claude 改成共用行程之後;
  // 地點已從 data.js 移除時,它的本機修改也一併清掉。回傳是否有變動
  function pruneRedundantOverrides() {
    let changed = false;
    Object.keys(placeOverrides).forEach(placeId => {
      const base = defaultPlaces.find(p => p.id === placeId);
      const override = placeOverrides[placeId];
      if (!base) {
        delete placeOverrides[placeId];
        changed = true;
        return;
      }
      if (override.deleted) return;

      EDITABLE_FIELDS.forEach(field => {
        if (!(field in override)) return;
        const baseValue = field === "time" ? normalizeTime(base.time) : (base[field] ?? null);
        const value = field === "time" ? normalizeTime(override.time) : (override[field] ?? null);
        if (value === baseValue) {
          delete override[field];
          changed = true;
        }
      });
      if (Object.keys(override).length === 0) {
        delete placeOverrides[placeId];
        changed = true;
      }
    });
    return changed;
  }

  const isCustomPlace = (placeId) => String(placeId).startsWith("custom_");
  const isModifiedPlace = (placeId) => !isCustomPlace(placeId) && Boolean(placeOverrides[placeId]);

  function saveCustomPlaces() {
    localStorage.setItem(STORAGE_KEYS.customPlaces, JSON.stringify(customPlaces));
  }

  function savePlaceOverrides() {
    localStorage.setItem(STORAGE_KEYS.placeOverrides, JSON.stringify(placeOverrides));
  }

  // 資料變動後重新整理所有畫面
  function refreshAndRenderAll() {
    refreshAllPlaces();
    renderItinerary();
    renderDirectory();
    updateMapMarkers();
  }

  // Reusable confirm dialog — replaces native window.confirm() which is ugly and blocks UI on mobile
  function confirmDialog(message) {
    return new Promise(resolve => {
      const modal = document.getElementById("confirm-modal");
      const msgEl = document.getElementById("confirm-modal-message");
      const okBtn = document.getElementById("confirm-modal-ok");
      const cancelBtn = document.getElementById("confirm-modal-cancel");
      if (!modal || !okBtn || !cancelBtn) {
        resolve(window.confirm(message));
        return;
      }
      msgEl.textContent = message;
      modal.classList.add("show");

      const cleanup = (result) => {
        modal.classList.remove("show");
        okBtn.removeEventListener("click", onOk);
        cancelBtn.removeEventListener("click", onCancel);
        modal.removeEventListener("click", onOverlay);
        document.removeEventListener("keydown", onKey);
        resolve(result);
      };
      const onOk = () => cleanup(true);
      const onCancel = () => cleanup(false);
      const onOverlay = (e) => { if (e.target === modal) cleanup(false); };
      const onKey = (e) => {
        if (e.key === "Escape") cleanup(false);
        else if (e.key === "Enter") cleanup(true);
      };
      okBtn.addEventListener("click", onOk);
      cancelBtn.addEventListener("click", onCancel);
      modal.addEventListener("click", onOverlay);
      document.addEventListener("keydown", onKey);
      setTimeout(() => okBtn.focus(), 50);
    });
  }

  // Apply a theme: swap body class (太陽/月亮圖示與地圖 tile 都靠 CSS 依 class 切換,不重新請求)
  // 首次繪製前 index.html 開頭的 inline script 已先套好 class,這裡負責之後的切換
  function applyTheme(theme) {
    document.body.classList.toggle("theme-dark", theme === 'dark');
    document.body.classList.toggle("theme-light", theme === 'light');
  }

  // Countdown timer
  function initCountdown() {
    const iso = (typeof TRIP_METADATA !== "undefined" && TRIP_METADATA.departureISO)
      || "2026-12-09T12:50:00+09:00";
    const targetDate = new Date(iso);
    const now = new Date();
    const diff = targetDate - now;

    if (diff <= 0) {
      countdownTextEl.textContent = "已出航！✈️";
      countdownTextEl.style.borderColor = "#10b981";
      countdownTextEl.style.color = "#10b981";
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    countdownTextEl.textContent = `出發倒數 ${days} 天 ${hours} 小時`;
  }

  // Initialize Map
  function initMap() {
    // Center map around Tokyo area covering Asakusa, Ginza, Shinjuku, Shibuya
    map = L.map("map", {
      zoomControl: false, // 用自訂的 floating-toolbar 按鈕取代
      maxZoom: 19,
      minZoom: 10
    }).setView([35.6895, 139.755], 12);

    // Add Tile Layer (單一 source,主題切換靠 CSS filter,不用重新請求 tile)
    // crossOrigin:用 CORS 載入 tile,Service Worker 才拿得到可快取的回應 (no-cors 的 opaque 回應無法判斷成功與否)
    L.tileLayer(tileUrl, {
      attribution: tileAttribution,
      maxZoom: 19,
      crossOrigin: true
    }).addTo(map);

    // Draw all markers
    updateMapMarkers();
  }

  // ==========================================
  // EVENT LISTENERS
  // ==========================================
  function setupEventListeners() {
    // 1. Sidebar Tab Switching
    tabBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-tab");
        const prevTab = activeTab; // Store the previous active tab
        switchTab(tab);
        
        // Close detail drawer when switching tabs to prevent mobile overlapping
        closeDrawer();
        
        // Mobile expansion logic (Google Maps style)
        if (window.innerWidth <= 768) {
          if (prevTab !== tab) {
            sidebar.classList.add("expanded");
          } else {
            sidebar.classList.toggle("expanded");
          }
        }
      });
    });

    // 2. Day Selector filtering (Itinerary Tab)
    daySelectorContainer.addEventListener("click", (e) => {
      const btn = e.target.closest(".day-btn");
      if (!btn) return;
      setActiveDay(btn.getAttribute("data-day"));
    });

    // 3. Category Chip filtering (Directory Tab)
    document.getElementById("category-filter-container").addEventListener("click", (e) => {
      const chip = e.target.closest(".filter-chip");
      if (!chip) return;

      document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");

      activeCategory = chip.getAttribute("data-category");
      renderDirectory();
    });

    // 4. Search input search (Directory Tab) — debounced 150ms
    let searchDebounceTimer = null;
    searchInput.addEventListener("input", (e) => {
      const value = e.target.value.toLowerCase().trim();
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        searchQuery = value;
        renderDirectory();
      }, 150);
    });

    // 5. Theme Toggle Button
    themeToggleBtn.addEventListener("click", () => {
      activeTheme = activeTheme === 'light' ? 'dark' : 'light';
      applyTheme(activeTheme);
      localStorage.setItem(STORAGE_KEYS.theme, activeTheme);
    });

    // 6. Reset view button
    resetViewBtn.addEventListener("click", () => {
      fitMapToActiveMarkers();
    });

    // 6b. Custom zoom buttons (取代 Leaflet 預設左上角 zoom control)
    zoomInBtn.addEventListener("click", () => map.zoomIn());
    zoomOutBtn.addEventListener("click", () => map.zoomOut());

    // 7. Locate Hotel button in Logistics
    hotelLocateBtn.addEventListener("click", () => {
      locatePlace(HOTEL_ID);
    });

    // 8. Close Drawer
    closeDrawerBtn.addEventListener("click", closeDrawer);

    // 9. Map Click Handlers (picker mode vs normal modal drawer closing)
    map.on("click", (e) => {
      if (isPickingCoords) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        
        // Fill form values
        document.getElementById("new-place-lat").value = lat.toFixed(6);
        document.getElementById("new-place-lng").value = lng.toFixed(6);
        
        // Render a visual indicator pin
        if (tempPickMarker) {
          tempPickMarker.setLatLng(e.latlng);
        } else {
          tempPickMarker = L.marker(e.latlng, { draggable: true }).addTo(map);
          tempPickMarker.on("dragend", () => {
            const pos = tempPickMarker.getLatLng();
            document.getElementById("new-place-lat").value = pos.lat.toFixed(6);
            document.getElementById("new-place-lng").value = pos.lng.toFixed(6);
          });
        }
        
        // Reset picker overlay view
        mapPickerBanner.classList.remove("active");
        addPlaceModal.classList.add("show");
        isPickingCoords = false;
        return;
      }

      // Normal click behavior
      closeDrawer();
      if (window.innerWidth <= 768) {
        sidebar.classList.remove("expanded");
      }
    });

    // 10. Add / Edit Place Modal triggers
    openAddModalBtn.addEventListener("click", () => openPlaceModal(null));

    modalCloseBtn.addEventListener("click", closePlaceModal);
    modalCancelBtn.addEventListener("click", closePlaceModal);
    document.getElementById("modal-delete-btn").addEventListener("click", () => {
      if (editingPlaceId) deletePlace(editingPlaceId);
    });
    document.getElementById("modal-restore-btn").addEventListener("click", () => {
      if (editingPlaceId) restorePlace(editingPlaceId);
    });

    // Close add-place modal via Escape or overlay click
    addPlaceModal.addEventListener("click", (e) => {
      if (e.target === addPlaceModal) closePlaceModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (addPlaceModal.classList.contains("show")) closePlaceModal();
      if (exportModal.classList.contains("show")) exportModal.classList.remove("show");
    });

    // 10b. 本機修改提示列:複製變更內容 / 全部還原
    document.getElementById("export-changes-btn").addEventListener("click", openExportModal);
    document.getElementById("restore-all-btn").addEventListener("click", restoreAllPlaces);
    document.getElementById("export-copy-btn").addEventListener("click", copyExportText);
    ["export-close-btn", "export-cancel-btn"].forEach(id => {
      document.getElementById(id).addEventListener("click", () => exportModal.classList.remove("show"));
    });
    exportModal.addEventListener("click", (e) => {
      if (e.target === exportModal) exportModal.classList.remove("show");
    });

    // Coordinate picker button click
    mapPickCoordsBtn.addEventListener("click", () => {
      addPlaceModal.classList.remove("show");
      mapPickerBanner.classList.add("active");
      isPickingCoords = true;
    });

    cancelMapPickBtn.addEventListener("click", () => {
      mapPickerBanner.classList.remove("active");
      addPlaceModal.classList.add("show");
      isPickingCoords = false;
      if (tempPickMarker) {
        map.removeLayer(tempPickMarker);
        tempPickMarker = null;
      }
    });

    // Submit:新增自訂地點 / 儲存編輯
    addPlaceForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const dayVal = document.getElementById("new-place-day").value;
      const values = {
        name: document.getElementById("new-place-name").value.trim(),
        englishName: document.getElementById("new-place-english").value.trim(),
        day: dayVal === "" ? null : parseInt(dayVal, 10),
        time: normalizeTime(document.getElementById("new-place-time").value),
        desc: document.getElementById("new-place-desc").value.trim(),
        gmaps: safeUrl(document.getElementById("new-place-gmaps").value.trim())
      };
      const category = document.getElementById("new-place-category").value;
      const lat = parseFloat(document.getElementById("new-place-lat").value);
      const lng = parseFloat(document.getElementById("new-place-lng").value);
      const imageVal = safeUrl(document.getElementById("new-place-image").value.trim());

      const placeId = editingPlaceId;

      if (placeId && !isCustomPlace(placeId)) {
        saveDefaultPlaceEdit(placeId, values);
      } else {
        const customFields = {
          ...values,
          category,
          lat,
          lng,
          desc: values.desc || "自訂新增的地點。",
          gmaps: values.gmaps || `https://maps.google.com/?q=${encodeURIComponent(values.name)}`,
          images: imageVal ? [imageVal] : []
        };
        const target = placeId && customPlaces.find(p => p.id === placeId);
        if (target) {
          Object.assign(target, customFields);
        } else {
          // 交通資訊由 getTransitView 依前一站自動產生 Google Maps 路線
          customPlaces.push({ id: `custom_${Date.now()}`, ...customFields, transitInfo: null });
        }
        saveCustomPlaces();
      }

      const savedId = placeId || customPlaces[customPlaces.length - 1].id;
      closePlaceModal();
      refreshAndRenderAll();
      locatePlace(savedId);
      // 編輯後重新顯示更新過的詳細資訊;新增的地點則照舊只在地圖上標示
      if (placeId) openDrawer(savedId);
    });
  }

  // ==========================================
  // PLACE EDITING (本機修改,不影響 data.js 與其他人)
  // ==========================================

  // 開啟地點表單:placeId 為 null 是新增自訂地點,否則是編輯
  function openPlaceModal(placeId) {
    const place = placeId ? allPlaces.find(p => p.id === placeId) : null;
    editingPlaceId = place ? placeId : null;
    const isEdit = Boolean(place);
    const isCustom = !isEdit || isCustomPlace(placeId);

    addPlaceForm.reset();
    document.getElementById("add-place-modal-title").textContent = isEdit ? "編輯地點" : "新增自訂地點";
    document.getElementById("modal-submit-btn").textContent = isEdit ? "儲存修改" : "儲存地點";
    // 內建地點只能改名稱、天數時間、介紹與連結;類別、座標、照片維持 data.js 的設定
    addPlaceForm.querySelectorAll("[data-custom-only]").forEach(el => { el.hidden = !isCustom; });
    document.getElementById("modal-delete-btn").hidden = !isEdit;
    document.getElementById("modal-restore-btn").hidden = !(isEdit && isModifiedPlace(placeId));

    if (place) {
      const setValue = (id, value) => { document.getElementById(id).value = value ?? ""; };
      const firstImage = place.images?.[0] || "";
      setValue("new-place-name", place.name);
      setValue("new-place-english", place.englishName);
      setValue("new-place-category", place.category);
      setValue("new-place-day", place.day ?? "");
      setValue("new-place-time", normalizeTime(place.time) || "");
      setValue("new-place-lat", place.lat);
      setValue("new-place-lng", place.lng);
      setValue("new-place-desc", place.desc);
      setValue("new-place-gmaps", place.gmaps);
      setValue("new-place-image", /^https?:\/\//.test(firstImage) ? firstImage : "");
    }

    addPlaceModal.classList.add("show");
  }

  function closePlaceModal() {
    addPlaceModal.classList.remove("show");
    addPlaceForm.reset();
    editingPlaceId = null;
    if (tempPickMarker) {
      map.removeLayer(tempPickMarker);
      tempPickMarker = null;
    }
  }

  // 內建地點:只記錄跟 data.js 不同的欄位;留空的文字欄位視為沿用原始資料
  function saveDefaultPlaceEdit(placeId, values) {
    const base = defaultPlaces.find(p => p.id === placeId);
    if (!base) return;

    const override = {};
    EDITABLE_FIELDS.forEach(field => {
      let value = values[field] ?? null;
      if (value === "") value = base[field] ?? "";
      const baseValue = field === "time" ? normalizeTime(base.time) : (base[field] ?? null);
      if (value !== baseValue) override[field] = value;
    });

    if (Object.keys(override).length > 0) {
      placeOverrides[placeId] = override;
    } else {
      delete placeOverrides[placeId];
    }
    savePlaceOverrides();
  }

  // 刪除:自訂地點直接移除;內建地點標記為已刪除 (可用「全部還原」復原)
  function deletePlace(placeId) {
    const message = isCustomPlace(placeId)
      ? "確定要刪除此自訂地點嗎？"
      : "確定要刪除此地點嗎？只會從這支手機的行程移除，之後可以用「全部還原」復原。";
    confirmDialog(message).then(ok => {
      if (!ok) return;
      if (isCustomPlace(placeId)) {
        customPlaces = customPlaces.filter(p => p.id !== placeId);
        saveCustomPlaces();
      } else {
        placeOverrides[placeId] = { deleted: true };
        savePlaceOverrides();
      }
      closePlaceModal();
      closeDrawer();
      refreshAndRenderAll();
    });
  }

  function restorePlace(placeId) {
    confirmDialog("確定要把這個地點還原成原始資料嗎？").then(ok => {
      if (!ok) return;
      delete placeOverrides[placeId];
      savePlaceOverrides();
      closePlaceModal();
      refreshAndRenderAll();
      locatePlace(placeId);
      openDrawer(placeId);
    });
  }

  function restoreAllPlaces() {
    confirmDialog("確定要把所有修改還原成原始行程嗎？（自訂地點不受影響）").then(ok => {
      if (!ok) return;
      placeOverrides = {};
      savePlaceOverrides();
      closeDrawer();
      refreshAndRenderAll();
    });
  }

  // 行程頁上方的提示列:有本機修改或自訂地點才顯示
  function renderLocalChangesBanner() {
    const modifiedCount = defaultPlaces.filter(p => placeOverrides[p.id]).length;
    const customCount = customPlaces.length;

    localChangesBanner.hidden = modifiedCount + customCount === 0;
    restoreAllBtn.hidden = modifiedCount === 0;

    const parts = [];
    if (modifiedCount > 0) parts.push(`修改了 ${modifiedCount} 個地點`);
    if (customCount > 0) parts.push(`新增了 ${customCount} 個自訂地點`);
    localChangesText.textContent = `📝 這支手機上${parts.join("、")}（其他人看不到）`;
  }

  // 把本機修改整理成 docs/行程變更範本.md 的格式,貼給 Claude 即可改成 5 人共用
  function buildChangeReport() {
    const slotText = (day, time) => `第 ${day} 天 ${normalizeTime(time) || "（未定時間）"}`;
    const fieldLabels = { name: "名稱", englishName: "日文／英文名稱", desc: "介紹", gmaps: "Google Maps 連結" };
    const sections = [];
    const addSection = (title, lines) => {
      sections.push(`### ${title}\n${lines.map(line => `- ${line}`).join("\n")}`);
    };

    defaultPlaces.forEach(base => {
      const override = placeOverrides[base.id];
      if (!override) return;

      if (override.deleted) {
        addSection("6. 刪除地點", [`地點：${base.name}`]);
        return;
      }

      const current = allPlaces.find(p => p.id === base.id);
      if ("day" in override || "time" in override) {
        if (base.day === null && current.day !== null) {
          addSection("2. 候補景點排入行程", [`地點：${base.name}`, `排到：${slotText(current.day, current.time)}`]);
        } else if (base.day !== null && current.day === null) {
          addSection("3. 移出行程（改回候補，不刪除）", [`地點：${base.name}`]);
        } else {
          addSection("1. 移動地點（改天數或時間）", [`地點：${base.name}`, `改到：${slotText(current.day, current.time)}`]);
        }
      }

      Object.entries(fieldLabels).forEach(([field, label]) => {
        if (!(field in override)) return;
        addSection("5. 修改說明或備註", [`地點：${base.name}`, `要改的內容：${label}`, `新的內容：${override[field]}`]);
      });
    });

    customPlaces.forEach(p => {
      addSection("4. 新增地點", [
        `名稱：${p.name}`,
        `日文／英文名稱（選填）：${p.englishName || ""}`,
        `類別：${getCategoryChinese(p.category)}`,
        `排到：${p.day ? slotText(p.day, p.time) : "候補"}`,
        `座標：${p.lat}, ${p.lng}`,
        `Google Maps 連結（選填）：${p.gmaps || ""}`,
        `介紹：${p.desc || ""}`
      ]);
    });

    return sections.length > 0 ? `## 本次變更\n\n${sections.join("\n\n")}\n` : "（目前沒有任何修改）";
  }

  function openExportModal() {
    exportTextarea.value = buildChangeReport();
    exportCopyBtn.textContent = "複製";
    exportModal.classList.add("show");
  }

  function copyExportText() {
    const markCopied = () => { exportCopyBtn.textContent = "已複製 ✓"; };
    const fallbackCopy = () => {
      // Clipboard API 不可用時:選取文字後用 execCommand,再不行就請使用者手動複製
      exportTextarea.focus();
      exportTextarea.setSelectionRange(0, exportTextarea.value.length);
      let copied = false;
      try {
        copied = document.execCommand("copy");
      } catch (e) {
        copied = false;
      }
      exportCopyBtn.textContent = copied ? "已複製 ✓" : "請手動全選複製";
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(exportTextarea.value).then(markCopied, fallbackCopy);
    } else {
      fallbackCopy();
    }
  }

  // Switch Tab
  function switchTab(tabName) {
    activeTab = tabName;
    tabBtns.forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === tabName);
    });
    tabPanes.forEach(pane => {
      pane.classList.toggle("active", pane.id === `pane-${tabName}`);
    });
  }

  // ==========================================
  // RENDER DYNAMIC LISTS
  // ==========================================

  // Render Itinerary Timeline
  function renderItinerary() {
    renderLocalChangesBanner();
    timelineContainer.innerHTML = "";
    if (allPlaces.length === 0) return;

    // Filter places by selected day
    let filteredPlaces = [];
    if (activeDay === "all") {
      filteredPlaces = allPlaces.filter(p => p.day !== null).sort(sortByDayTime);
    } else {
      const dayNum = parseInt(activeDay);
      filteredPlaces = allPlaces.filter(p => p.day === dayNum).sort(sortByDayTime);
    }

    if (filteredPlaces.length === 0) {
      timelineContainer.innerHTML = `<div class="empty-state">此天無安排特定行程地點，可以自由探索或購物！</div>`;
      return;
    }

    const prevStopMap = buildPrevStopMap(allPlaces);

    // Build timeline elements
    filteredPlaces.forEach(place => {
      // 交通資訊描述「如何抵達此地點」,所以畫在卡片之前
      const transitView = getTransitView(place, prevStopMap);
      if (transitView) timelineContainer.appendChild(buildTransitLog(transitView));

      const itemEl = document.createElement("div");
      itemEl.className = "timeline-item";
      itemEl.setAttribute("data-cat", place.category);
      itemEl.setAttribute("data-id", place.id);

      // Time comes from data.js `place.time` field
      const timeText = normalizeTime(place.time) || place.time || "";

      const isCustom = place.id.startsWith("custom_");
      const deleteBtnHtml = isCustom ? deleteButtonMarkup() : '';

      itemEl.innerHTML = `
        <div class="timeline-marker"></div>
        <div class="timeline-card">
          <div class="timeline-card-header">
            <span class="timeline-time-badge">${escapeHtml(timeText || "自訂行程")}</span>
            <div class="timeline-card-header-right">
              ${localTagMarkup(place.id)}
              <span class="timeline-day-tag">Day ${escapeHtml(place.day)}</span>
              ${deleteBtnHtml}
            </div>
          </div>
          <h4>${escapeHtml(place.name)}</h4>
          <span class="english-name">${escapeHtml(place.englishName)}</span>
          <p class="card-desc">${escapeHtml(place.desc)}</p>
        </div>
      `;

      itemEl.addEventListener("click", (e) => {
        if (e.target.closest('[data-action="delete-place"]')) {
          e.stopPropagation();
          deletePlace(place.id);
          return;
        }
        locatePlace(place.id);
        openDrawer(place.id);
      });

      timelineContainer.appendChild(itemEl);
    });

    highlightTimelineItem();
  }

  // Render Places Directory
  function renderDirectory() {
    placesListContainer.innerHTML = "";
    if (allPlaces.length === 0) return;

    let filtered = allPlaces.filter(place => {
      // Category filter
      if (activeCategory !== "all" && place.category !== activeCategory) return false;
      // Search query filter (null-safe)
      if (searchQuery) {
        const haystack = `${place.name || ""} ${place.englishName || ""} ${place.desc || ""}`.toLowerCase();
        return haystack.includes(searchQuery);
      }
      return true;
    });

    if (filtered.length === 0) {
      placesListContainer.innerHTML = `<div class="empty-state">無符合搜尋條件的地點</div>`;
      return;
    }

    filtered.forEach(place => {
      const cardEl = document.createElement("div");
      cardEl.className = "place-card";
      cardEl.setAttribute("data-id", place.id);
      
      const isCustom = place.id.startsWith("custom_");
      const deleteBtnHtml = isCustom ? deleteButtonMarkup() : '';

      const mainImg = firstImageOf(place);

      cardEl.innerHTML = `
        <div class="place-card-img"></div>
        <div class="place-card-body">
          <div class="place-card-body-top">
            <div class="place-card-title-wrap">
              <h3>${escapeHtml(place.name)}</h3>
              <div class="place-card-eng">${escapeHtml(place.englishName)}</div>
            </div>
            ${deleteBtnHtml}
          </div>
          <div class="place-card-meta">
            <span class="place-card-category" data-cat="${escapeHtml(place.category)}">${categoryEmojis[place.category] || ''} ${escapeHtml(getCategoryChinese(place.category))}</span>
            ${localTagMarkup(place.id)}
            <span class="place-card-day">${place.day ? `Day ${escapeHtml(place.day)}` : '候補'}</span>
          </div>
        </div>
      `;
      // Set background-image via DOM to avoid CSS injection
      const imgEl = cardEl.querySelector(".place-card-img");
      if (imgEl) imgEl.style.backgroundImage = `url("${cssEscapeUrl(mainImg)}")`;

      cardEl.addEventListener("click", (e) => {
        if (e.target.closest('[data-action="delete-place"]')) {
          e.stopPropagation();
          deletePlace(place.id);
          return;
        }
        switchTab("itinerary"); // Sync tab
        locatePlace(place.id);
        openDrawer(place.id);
      });

      placesListContainer.appendChild(cardEl);
    });
  }

  function getCategoryChinese(cat) {
    if (cat === "food") return "美食";
    if (cat === "shopping") return "購物";
    if (cat === "sightseeing") return "景點";
    if (cat === "lodging") return "住宿";
    return "";
  }

  // 決定某一站要顯示的交通資訊 (時間軸與抽屜共用):
  // - 前一站跟原始行程 (data.js) 一樣 → 沿用原本的交通說明
  // - 行程調整過 (自己或前面的站被移動) 或自訂地點 → 只顯示「從〇〇出發」與 Google Maps 路線
  function getTransitView(place, prevStopMap) {
    if (place.day === null || place.day === undefined) return null;
    const fromPlace = allPlaces.find(p => p.id === prevStopMap[place.id]);
    if (!fromPlace) return null;

    const isCustom = isCustomPlace(place.id);
    const useOriginal = !isCustom && Boolean(place.transitInfo) &&
                        originalPrevStop[place.id] === prevStopMap[place.id];
    const info = useOriginal ? place.transitInfo : null;

    return {
      info,
      fromPlace,
      navUrl: directionsUrl(fromPlace, place, info?.method),
      note: isCustom
        ? "自訂地點，交通方式請用 Google Maps 查詢"
        : "行程調整過，原本的交通說明不適用，請用 Google Maps 查詢"
    };
  }

  const transitNavLinkMarkup = (view) =>
    `<a class="transit-nav-link" href="${escapeHtml(view.navUrl)}" target="_blank" rel="noopener noreferrer">🧭 Google Maps 路線</a>`;

  function buildTransitLog(view) {
    const el = document.createElement("div");
    el.className = "transit-log";
    if (view.info) {
      el.innerHTML = `
        <div class="transit-icon-wrapper">
          <span class="transit-icon">${transitEmojiOf(view.info)}</span>
        </div>
        <div>
          ${escapeHtml(view.info.line)} - <span class="transit-duration">${escapeHtml(view.info.duration)} 分鐘</span>
          <div class="transit-details">${escapeHtml(view.info.details)}</div>
          ${transitNavLinkMarkup(view)}
        </div>
      `;
    } else {
      el.innerHTML = `
        <div class="transit-icon-wrapper">
          <span class="transit-icon">🧭</span>
        </div>
        <div>
          從「${escapeHtml(view.fromPlace.name)}」出發
          <div class="transit-details">${escapeHtml(view.note)}</div>
          ${transitNavLinkMarkup(view)}
        </div>
      `;
    }
    return el;
  }

  // 卡片上的本機修改標籤
  function localTagMarkup(placeId) {
    if (isCustomPlace(placeId)) return `<span class="local-tag">自訂</span>`;
    if (isModifiedPlace(placeId)) return `<span class="local-tag">已修改</span>`;
    return "";
  }

  // ==========================================
  // MAP INTERACTIONS & MARKERS
  // ==========================================

  // Clear markers & draw new ones based on activeDay filters
  function updateMapMarkers() {
    // 1. Clear existing markers
    mapMarkers.forEach(m => map.removeLayer(m));
    mapMarkers = [];
    
    // Clear polylines
    mapPolylines.forEach(p => map.removeLayer(p));
    mapPolylines = [];

    // Filter places to show
    let placesToShow = [];
    if (activeDay === "all") {
      placesToShow = allPlaces; // Show everything
    } else {
      const dayNum = parseInt(activeDay);
      // Always include hotel (home base) and the current day's spots
      placesToShow = allPlaces.filter(p => p.day === dayNum || p.id === HOTEL_ID);
    }

    // 2. Create Leaflet Markers
    placesToShow.forEach(place => {
      // Custom Div Icon to style markers with category colors
      const markerHtml = `
        <div class="marker-pin" data-cat="${escapeHtml(place.category)}" id="pin-${escapeHtml(place.id)}">
          <span class="marker-icon">${categoryEmojis[place.category] || ''}</span>
        </div>
      `;
      
      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: markerHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      const marker = L.marker([place.lat, place.lng], { icon: customIcon }).addTo(map);
      marker.placeId = place.id;
      
      const mainImg = firstImageOf(place);

      // Popup Content — built as DOM to avoid string-injection into style="url(...)" and onclick
      const popupEl = document.createElement("div");
      popupEl.className = "popup-card";
      popupEl.innerHTML = `
        <div class="popup-img"></div>
        <div class="popup-body">
          <h3>${escapeHtml(place.name)}</h3>
          <p>${escapeHtml(place.englishName)}</p>
          <a href="#" class="popup-link" data-action="open-drawer">
            查看詳細資訊與交通 &rarr;
          </a>
        </div>
      `;
      const popupImgEl = popupEl.querySelector(".popup-img");
      if (popupImgEl) popupImgEl.style.backgroundImage = `url("${cssEscapeUrl(mainImg)}")`;
      const popupLinkEl = popupEl.querySelector('[data-action="open-drawer"]');
      if (popupLinkEl) {
        popupLinkEl.addEventListener("click", (ev) => {
          ev.preventDefault();
          openDrawer(place.id);
        });
      }

      // popup 不綁在 marker 上 (bindPopup 會在點 marker 時自動打開,跟抽屜重疊)。
      // 只有 locatePlace 在抽屜沒開時才顯示,例如「在地圖上標示」飯店、定位地圖
      marker.detailPopup = L.popup({
        closeButton: true,
        offset: L.point(0, -26)
      }).setLatLng([place.lat, place.lng]).setContent(popupEl);

      marker.on("click", (ev) => {
        // 防止事件冒泡到 map.on("click"),否則 iOS Safari 上會馬上觸發 closeDrawer
        if (ev && ev.originalEvent) L.DomEvent.stopPropagation(ev.originalEvent);
        highlightMarkerPin(place.id);
        openDrawer(place.id);
      });

      mapMarkers.push(marker);
    });

    // 3. Draw colored routing polylines if a activeDay is selected
    if (activeDay !== "all") {
      const dayNum = parseInt(activeDay);
      // Sort day spots in timeline sequence (same comparator as the timeline)
      const daySpots = allPlaces.filter(p => p.day === dayNum).sort(sortByDayTime);

      // Construct route: Start at Hotel -> visit day spots -> return to Hotel (except Day 6)
      // 當天第一站是 dayStart (例如機場) 時,路線從那裡開始,不從飯店出發
      const hotel = allPlaces.find(p => p.id === HOTEL_ID);
      const pathCoordinates = [];

      if (hotel && !daySpots[0]?.dayStart) {
        pathCoordinates.push([hotel.lat, hotel.lng]); // Start at hotel
      }
      
      daySpots.forEach(s => {
        pathCoordinates.push([s.lat, s.lng]);
      });

      if (hotel && dayNum !== 6) {
        pathCoordinates.push([hotel.lat, hotel.lng]); // Return to hotel
      }

      // Draw polyline on map
      const dayColors = {
        1: "#ef4444", // Red
        2: "#f97316", // Orange
        3: "#a855f7", // Purple
        4: "#3b82f6", // Blue
        5: "#10b981", // Green
        6: "#ec4899"  // Pink
      };

      const routePolyline = L.polyline(pathCoordinates, {
        color: dayColors[dayNum],
        weight: 4,
        opacity: 0.8,
        dashArray: "8, 8",
        lineJoin: "round"
      }).addTo(map);

      mapPolylines.push(routePolyline);
    }

    // Zoom map bounds to fit markers nicely
    fitMapToActiveMarkers();
  }

  // Adjust zoom to cover all active markers
  function fitMapToActiveMarkers() {
    if (mapMarkers.length === 0) return;
    const group = new L.featureGroup(mapMarkers);
    map.fitBounds(group.getBounds().pad(0.15));
  }

  // Highlight a marker pin visually on map (同時標示時間軸上的同一個地點)
  function highlightMarkerPin(placeId) {
    document.querySelectorAll(".marker-pin").forEach(pin => pin.classList.remove("active"));
    const element = document.getElementById(`pin-${placeId}`);
    if (element) {
      element.classList.add("active");
    }
    selectedPlaceId = placeId;
    highlightTimelineItem();
  }

  // 時間軸上標示最後選取的地點。關閉抽屜時不清除:手機上要切回「行程規劃」分頁
  // 才看得到時間軸,而切換分頁會關閉抽屜,清掉的話就看不到標示了
  function highlightTimelineItem() {
    timelineContainer.querySelectorAll(".timeline-item").forEach(item => {
      item.classList.toggle("active", item.getAttribute("data-id") === selectedPlaceId);
    });
  }

  // 切換天數篩選:同步按鈕狀態、時間軸與地圖 marker
  function setActiveDay(day) {
    activeDay = String(day);
    document.querySelectorAll(".day-btn").forEach(b => {
      b.classList.toggle("active", b.getAttribute("data-day") === activeDay);
    });
    renderItinerary();
    updateMapMarkers();
  }

  // Map Locate and Zoom on a place
  function locatePlace(placeId) {
    const place = allPlaces.find(p => p.id === placeId);
    if (!place) return;

    // 地點不在目前的天數篩選裡 (地圖上沒有它的 marker) → 切到它的天數;沒排天數的候補景點切到「全部」
    if (!mapMarkers.some(m => m.placeId === placeId)) {
      setActiveDay(place.day ?? "all");
    }

    map.setView([place.lat, place.lng], 15, {
      animate: true,
      duration: 1.0
    });

    map.closePopup();
    
    const marker = mapMarkers.find(m => m.placeId === placeId);
    if (marker) {
      setTimeout(() => {
        // 詳細資訊抽屜開著時不顯示 popup,兩者內容重複又會互相遮擋
        if (!detailDrawer.classList.contains("open")) map.openPopup(marker.detailPopup);
      }, 600);
    }

    highlightMarkerPin(placeId);
  }

  // ==========================================
  // DRAWER & SLIDER
  // ==========================================
  
  function openDrawer(placeId) {
    const place = allPlaces.find(p => p.id === placeId);
    if (!place) return;

    // 抽屜與 popup 不同時出現 (例如從 popup 的「查看詳細資訊」點進來)
    map.closePopup();

    // Automatically collapse sidebar on mobile when opening detail drawer so they never overlap (Google Maps style)
    if (window.innerWidth <= 768) {
      sidebar.classList.remove("expanded");
    }

    currentSlideIndex = 0;

    // Build Image Slider HTML — slide background images are applied via DOM below to avoid CSS injection
    let indicatorsHtml = "";
    const imageList = place.images && place.images.length > 0 ? place.images : [null];
    const resolvedImageUrls = imageList.map(img => resolveImageUrl(img));
    const imageSlidesHtml = imageList.map((_, idx) => `<div class="carousel-slide" data-slide-idx="${idx}"></div>`).join("");
    imageList.forEach((_, idx) => {
      indicatorsHtml += `<span class="indicator ${idx === 0 ? 'active' : ''}" data-idx="${idx}"></span>`;
    });

    // Build Transit details in drawer (與時間軸同一套判斷)
    let drawerTransitHtml = "";
    const transitView = getTransitView(place, buildPrevStopMap(allPlaces));
    if (transitView?.info) {
      const info = transitView.info;
      drawerTransitHtml = `
        <div class="detail-transit-block">
          <div class="transit-header-text">交通路線 (起點: ${escapeHtml(info.from)})</div>
          <div class="transit-step-body">
            <span class="transit-step-emoji">${transitEmojiOf(info)}</span>
            <div>
              <div class="transit-desc-text">${escapeHtml(info.line)}</div>
              <div class="transit-step-details">${escapeHtml(info.details)}</div>
            </div>
            <div class="transit-step-duration">
              <span class="transit-duration transit-duration-lg">${escapeHtml(info.duration)}</span>
              <span class="transit-step-unit">分鐘</span>
            </div>
          </div>
          ${transitNavLinkMarkup(transitView)}
        </div>
      `;
    } else if (transitView) {
      drawerTransitHtml = `
        <div class="detail-transit-block">
          <div class="transit-header-text">交通路線 (起點: ${escapeHtml(transitView.fromPlace.name)})</div>
          <div class="transit-step-body">
            <span class="transit-step-emoji">🧭</span>
            <div class="transit-step-details">${escapeHtml(transitView.note)}</div>
          </div>
          ${transitNavLinkMarkup(transitView)}
        </div>
      `;
    }

    // Build Drawer Body Content
    drawerContentBody.innerHTML = `
      <div class="detail-grid">
        
        <!-- Left Column: Carousel -->
        <div class="image-carousel">
          <div class="carousel-slides" id="carousel-slides-container">
            ${imageSlidesHtml}
          </div>
          
          ${imageList.length > 1 ? `
            <button class="carousel-control prev" id="carousel-prev">&lsaquo;</button>
            <button class="carousel-control next" id="carousel-next">&rsaquo;</button>
          ` : ''}
          
          <div class="carousel-indicators" id="carousel-indicators-container">
            ${imageList.length > 1 ? indicatorsHtml : ''}
          </div>
        </div>
        
        <!-- Right Column: Details & Actions -->
        <div class="detail-info">
          <div class="detail-header">
            <div class="detail-title-row">
              <h2>${escapeHtml(place.name)}</h2>
              <div class="detail-badges">
                <span class="tag-badge" data-cat="${escapeHtml(place.category)}">${categoryEmojis[place.category] || ''} ${escapeHtml(getCategoryChinese(place.category))}</span>
                ${place.day ? `<span class="tag-badge tag-badge-day">Day ${escapeHtml(place.day)}</span>` : ''}
                ${localTagMarkup(place.id)}
              </div>
            </div>
            <div class="detail-english">${escapeHtml(place.englishName)}</div>
          </div>

          <div class="detail-desc">
            ${escapeHtml(place.desc)}
          </div>

          ${drawerTransitHtml}

          <div class="drawer-actions">
            <a href="${escapeHtml(safeUrl(place.gmaps))}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Google Maps 地圖導航
            </a>
            <button class="btn btn-outline" id="drawer-locate-btn">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
              定位地圖
            </button>
            ${place.id !== HOTEL_ID ? `
            <button class="btn btn-outline" id="drawer-edit-btn">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              編輯
            </button>` : ''}
          </div>
        </div>
        
      </div>
    `;

    // Apply resolved image URLs to each carousel slide via DOM (avoids CSS injection)
    drawerContentBody.querySelectorAll(".carousel-slide").forEach((slide, idx) => {
      const url = resolvedImageUrls[idx];
      if (url) slide.style.backgroundImage = `url("${cssEscapeUrl(url)}")`;
    });

    // Open Drawer
    detailDrawer.classList.add("open");

    // Hook Carousel Event Listeners (if multiple images)
    if (imageList.length > 1) {
      const slidesContainer = document.getElementById("carousel-slides-container");
      const indicatorDots = document.querySelectorAll(".indicator");
      
      const updateCarousel = (index) => {
        currentSlideIndex = index;
        slidesContainer.style.transform = `translateX(-${index * 100}%)`;
        
        indicatorDots.forEach((dot, dIdx) => {
          dot.classList.toggle("active", dIdx === index);
        });
      };

      document.getElementById("carousel-prev").addEventListener("click", () => {
        let prevIndex = currentSlideIndex - 1;
        if (prevIndex < 0) prevIndex = imageList.length - 1;
        updateCarousel(prevIndex);
      });

      document.getElementById("carousel-next").addEventListener("click", () => {
        let nextIndex = currentSlideIndex + 1;
        if (nextIndex >= imageList.length) nextIndex = 0;
        updateCarousel(nextIndex);
      });

      document.getElementById("carousel-indicators-container").addEventListener("click", (e) => {
        const dot = e.target.closest(".indicator");
        if (!dot) return;
        const targetIdx = parseInt(dot.getAttribute("data-idx"));
        updateCarousel(targetIdx);
      });
    }

    // Hook Drawer locate button
    document.getElementById("drawer-locate-btn").addEventListener("click", () => {
      locatePlace(placeId);
      if (window.innerWidth <= 500) {
        closeDrawer(); // Close on mobile to show zoom
      }
    });

    // 飯店是每天路線的起點,不開放編輯
    document.getElementById("drawer-edit-btn")?.addEventListener("click", () => openPlaceModal(placeId));
  }

  function closeDrawer() {
    if (detailDrawer) {
      detailDrawer.classList.remove("open");
    }
    // Remove marker highlights
    document.querySelectorAll(".marker-pin").forEach(pin => pin.classList.remove("active"));
  }

  // Packing Checklist Persistence
  function initChecklist() {
    const checklistContainer = document.querySelector(".packing-checklist");
    if (!checklistContainer) return;

    // Load saved checklist states
    const savedStates = readJson(STORAGE_KEYS.checklist, {}) || {};

    const checkboxes = checklistContainer.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
      const id = cb.id;
      if (id && savedStates[id] !== undefined) {
        cb.checked = savedStates[id];
      }

      // Add event listener to save state when changed
      cb.addEventListener("change", () => {
        savedStates[cb.id] = cb.checked;
        localStorage.setItem(STORAGE_KEYS.checklist, JSON.stringify(savedStates));
      });
    });
  }

  // Budget & Expense Calculator
  function initBudgetCalculator() {
    const calcRateInput = document.getElementById("calc-rate");
    const calcFlightInput = document.getElementById("calc-flight");
    const calcPocketInput = document.getElementById("calc-pocket");
    
    if (!calcRateInput || !calcFlightInput || !calcPocketInput) return;

    const hotelPerPersonJpy = TRIP_METADATA?.accommodation?.perPersonJpy ?? 33120;
    const targetBudgetTwd = 50000;

    // Sync the static "每人分攤住宿" display with the metadata so it can never drift
    const hotelJpyDisplay = document.getElementById("calc-hotel-jpy");
    if (hotelJpyDisplay) hotelJpyDisplay.textContent = hotelPerPersonJpy.toLocaleString();

    // Load saved inputs
    const savedInputs = readJson(STORAGE_KEYS.budget, {}) || {};
    if (savedInputs.rate !== undefined) calcRateInput.value = savedInputs.rate;
    if (savedInputs.flight !== undefined) calcFlightInput.value = savedInputs.flight;
    if (savedInputs.pocket !== undefined) calcPocketInput.value = savedInputs.pocket;

    function calculate() {
      const rate = parseFloat(calcRateInput.value) || 0.22;
      const flightTwd = parseFloat(calcFlightInput.value) || 0;
      const pocketJpy = parseFloat(calcPocketInput.value) || 0;

      // Save to LocalStorage
      localStorage.setItem(STORAGE_KEYS.budget, JSON.stringify({
        rate,
        flight: flightTwd,
        pocket: pocketJpy
      }));

      // Calculate conversions
      const hotelTwd = Math.round(hotelPerPersonJpy * rate);
      const pocketTwd = Math.round(pocketJpy * rate);
      const totalTwd = Math.round(flightTwd + hotelTwd + pocketTwd);

      // Render results in DOM
      document.getElementById("res-flight-twd").textContent = `NT$ ${flightTwd.toLocaleString()}`;
      document.getElementById("res-hotel-twd").textContent = `NT$ ${hotelTwd.toLocaleString()}`;
      document.getElementById("res-pocket-twd").textContent = `NT$ ${pocketTwd.toLocaleString()}`;
      
      const totalEl = document.getElementById("res-total-twd");
      totalEl.textContent = `NT$ ${totalTwd.toLocaleString()}`;

      // Update progress bar — 顯示實際百分比 (可超過 100%),只有進度條寬度封頂 100%
      const percentage = Math.round((totalTwd / targetBudgetTwd) * 100);
      document.getElementById("budget-percentage").textContent = `已用 ${percentage}%`;

      const fillBar = document.getElementById("budget-progress-fill");
      fillBar.style.width = `${Math.min(100, percentage)}%`;

      // Remove previous color classes
      fillBar.classList.remove("under-budget", "near-budget", "over-budget");
      
      // Update color — 超支用金額判斷,避免 100.4% 四捨五入成 100% 時顏色與超支訊息不一致
      if (totalTwd > targetBudgetTwd) {
        fillBar.classList.add("over-budget");
      } else if (percentage < 80) {
        fillBar.classList.add("under-budget");
      } else {
        fillBar.classList.add("near-budget");
      }

      // Update status message
      const statusMsgEl = document.getElementById("budget-status-msg");
      statusMsgEl.className = "budget-status-msg"; // reset classes
      
      const diff = targetBudgetTwd - totalTwd;
      if (diff > 0) {
        if (percentage < 80) {
          statusMsgEl.classList.add("under");
          statusMsgEl.textContent = `預算非常充裕！距離目標 NT$ 50,000 還剩餘 NT$ ${diff.toLocaleString()}。`;
        } else {
          statusMsgEl.classList.add("warn");
          statusMsgEl.textContent = `預算尚在控制範圍內，距離目標還剩餘 NT$ ${diff.toLocaleString()}，請注意後續購物花費。`;
        }
      } else if (diff === 0) {
        statusMsgEl.classList.add("warn");
        statusMsgEl.textContent = `估計總花費剛好達到 NT$ 50,000 預算目標！`;
      } else {
        statusMsgEl.classList.add("danger");
        statusMsgEl.textContent = `⚠️ 注意：估計總花費已超支 NT$ ${Math.abs(diff).toLocaleString()}！建議微調日幣預算或購物計畫。`;
      }
    }

    // Bind event listeners
    calcRateInput.addEventListener("input", calculate);
    calcFlightInput.addEventListener("input", calculate);
    calcPocketInput.addEventListener("input", calculate);

    // Initial calculation
    calculate();
  }

  // ==========================================
  // RUN MAIN ENTRY
  // ==========================================
  init();
});

// ==========================================
// PWA:註冊 Service Worker(頁面載入完再註冊,不阻塞首次渲染)
// ==========================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.warn('Service Worker 註冊失敗:', err);
    });

    // 預先快取所有景點圖片,旅途中離線也看得到 (SW 只會補抓還沒快取的,並清掉已不再使用的舊圖)
    navigator.serviceWorker.ready.then((registration) => {
      if (!registration.active || typeof PLACE_IMAGES === "undefined") return;
      const imageFiles = new Set(Object.values(PLACE_IMAGES).flat());
      const urls = [...imageFiles, "placeholder.svg"]
        .map((img) => new URL(`images/${img}`, location.href).href);
      registration.active.postMessage({ type: "precache-images", urls });
    });
  });
}
