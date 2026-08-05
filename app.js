// Tokyo Trip Map & Itinerary Application Engine (Updated with Custom Places)

document.addEventListener("DOMContentLoaded", () => {
  // 1. Initialize State
  let map = null;
  let activeTheme = 'light';
  let activeTab = 'itinerary';
  let activeDay = 'all';
  let activeCategory = 'all';
  let searchQuery = '';
  
  let mapMarkers = [];
  let mapPolylines = [];
  
  // Custom Places Data Lists
  let defaultPlaces = typeof PLACES !== "undefined" ? [...PLACES] : [];
  let customPlaces = [];
  let allPlaces = [];

  // Active slide index for current open drawer carousel
  let currentSlideIndex = 0;

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
  const filterChips = document.querySelectorAll(".filter-chip");
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
  const iconSun = themeToggleBtn.querySelector(".icon-sun");
  const iconMoon = themeToggleBtn.querySelector(".icon-moon");
  
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

  let isPickingCoords = false;
  let tempPickMarker = null;

  // Map tile configuration
  const tileUrls = {
    light: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
  };
  const tileAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
  let activeTileLayer = null;

  // Icons mapping for categories
  const categoryEmojis = {
    lodging: "🏨",
    food: "🍔",
    shopping: "🛍️",
    sightseeing: "🗼"
  };

  // ==========================================
  // INITIALIZATION & DATA MERGING
  // ==========================================
  
  function init() {
    // Load persisted custom places
    refreshAllPlaces();

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

  // Load custom places from local storage and merge
  function refreshAllPlaces() {
    const stored = localStorage.getItem("tokyo_trip_custom_places");
    if (stored) {
      try {
        customPlaces = JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse custom places:", e);
        customPlaces = [];
      }
    } else {
      customPlaces = [];
    }
    allPlaces = [...defaultPlaces, ...customPlaces];
  }

  // Countdown timer
  function initCountdown() {
    const targetDate = new Date("2026-12-09T12:50:00+09:00"); // 12:50 Tokyo Time
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
      zoomControl: false,
      maxZoom: 18,
      minZoom: 10
    }).setView([35.6895, 139.755], 12);

    // Place zoom control at top-left
    L.control.zoom({ position: "topleft" }).addTo(map);

    // Add Tile Layer
    activeTileLayer = L.tileLayer(tileUrls[activeTheme], {
      attribution: tileAttribution
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
      
      document.querySelectorAll(".day-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      activeDay = btn.getAttribute("data-day");
      renderItinerary();
      updateMapMarkers();
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

    // 4. Search input search (Directory Tab)
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderDirectory();
    });

    // 5. Theme Toggle Button
    themeToggleBtn.addEventListener("click", () => {
      if (activeTheme === 'light') {
        activeTheme = 'dark';
        document.body.classList.remove("theme-light");
        document.body.classList.add("theme-dark");
        iconSun.style.display = "none";
        iconMoon.style.display = "block";
      } else {
        activeTheme = 'light';
        document.body.classList.remove("theme-dark");
        document.body.classList.add("theme-light");
        iconSun.style.display = "block";
        iconMoon.style.display = "none";
      }
      
      // Update tile layer source
      if (map && activeTileLayer) {
        map.removeLayer(activeTileLayer);
        activeTileLayer = L.tileLayer(tileUrls[activeTheme], {
          attribution: tileAttribution
        }).addTo(map);
      }
    });

    // 6. Reset view button
    resetViewBtn.addEventListener("click", () => {
      fitMapToActiveMarkers();
    });

    // 7. Locate Hotel button in Logistics
    hotelLocateBtn.addEventListener("click", () => {
      locatePlace("syla_hotel");
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
          tempPickMarker.on("dragend", (dEvent) => {
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

    // 10. Add Custom Place Modal triggers
    openAddModalBtn.addEventListener("click", () => {
      addPlaceModal.classList.add("show");
    });

    const closeAddModal = () => {
      addPlaceModal.classList.remove("show");
      addPlaceForm.reset();
      if (tempPickMarker) {
        map.removeLayer(tempPickMarker);
        tempPickMarker = null;
      }
    };

    modalCloseBtn.addEventListener("click", closeAddModal);
    modalCancelBtn.addEventListener("click", closeAddModal);

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

    // Submit Custom Place
    addPlaceForm.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const name = document.getElementById("new-place-name").value.trim();
      const englishName = document.getElementById("new-place-english").value.trim() || "";
      const category = document.getElementById("new-place-category").value;
      const dayVal = document.getElementById("new-place-day").value;
      const day = dayVal === "" ? null : parseInt(dayVal);
      const time = document.getElementById("new-place-time").value.trim() || null;
      const lat = parseFloat(document.getElementById("new-place-lat").value);
      const lng = parseFloat(document.getElementById("new-place-lng").value);
      const desc = document.getElementById("new-place-desc").value.trim() || "自訂新增的地點。";
      
      let gmaps = document.getElementById("new-place-gmaps").value.trim();
      if (!gmaps) {
        gmaps = `https://maps.google.com/?q=${encodeURIComponent(name)}`;
      }

      let imageVal = document.getElementById("new-place-image").value.trim();
      let images = [];
      if (imageVal) {
        images = [imageVal];
      } else {
        // Fallback default graphics
        if (category === "food") images = ["tonkatsu_1.jpg"];
        else if (category === "shopping") images = ["uniqlo_1.jpg"];
        else if (category === "sightseeing") images = ["sensoji_1.jpg"];
        else images = ["hotel_1.jpg"];
      }

      const newPlace = {
        id: `custom_${Date.now()}`,
        name,
        englishName,
        category,
        lat,
        lng,
        day,
        time,
        desc,
        images,
        gmaps,
        transitInfo: null
      };

      // Set standard template transit helper for custom items
      if (day !== null) {
        newPlace.transitInfo = {
          from: "前一站",
          method: "subway",
          line: "搭乘地鐵或步行",
          duration: "自選",
          details: "自訂新增景點，交通細節與搭乘線路請點擊 Google Maps 查詢最佳方案。"
        };
      }

      // Store in localStorage
      customPlaces.push(newPlace);
      localStorage.setItem("tokyo_trip_custom_places", JSON.stringify(customPlaces));

      // Refresh layout data
      refreshAllPlaces();
      renderItinerary();
      renderDirectory();
      updateMapMarkers();
      
      // Close modal
      closeAddModal();
      
      // Select the newly added place
      locatePlace(newPlace.id);
    });
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
    timelineContainer.innerHTML = "";
    if (allPlaces.length === 0) return;

    // Sort helper: order by (day, time). Places without `time` keep insertion order via stable sort.
    const sortByDayTime = (a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      const ta = a.time || "";
      const tb = b.time || "";
      return ta.localeCompare(tb);
    };

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

    // Build timeline elements
    filteredPlaces.forEach((place, index) => {
      const itemEl = document.createElement("div");
      itemEl.className = "timeline-item";
      itemEl.setAttribute("data-cat", place.category);
      itemEl.setAttribute("data-id", place.id);

      // Time comes from data.js `place.time` field
      const timeText = place.time || "";

      // Add delete button if it's a custom place
      const isCustom = place.id.startsWith("custom_");
      const deleteBtnHtml = isCustom ? `
        <button class="delete-place-btn" title="刪除自訂地點" onclick="deleteCustomPlace('${place.id}', event)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
      ` : '';

      itemEl.innerHTML = `
        <div class="timeline-marker"></div>
        <div class="timeline-card">
          <div class="timeline-card-header">
            <span class="timeline-time-badge">${timeText || "自訂行程"}</span>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="timeline-day-tag">Day ${place.day}</span>
              ${deleteBtnHtml}
            </div>
          </div>
          <h4>${place.name}</h4>
          <span class="english-name">${place.englishName}</span>
          <p class="card-desc">${place.desc}</p>
        </div>
      `;

      itemEl.addEventListener("click", () => {
        locatePlace(place.id);
        openDrawer(place.id);
      });

      timelineContainer.appendChild(itemEl);

      // Add a Transit Connection Line if there is transit info AND we are not on the last item of the day
      if (place.transitInfo && (activeDay !== "all" || (index < filteredPlaces.length - 1 && filteredPlaces[index + 1].day === place.day))) {
        const transitEl = document.createElement("div");
        transitEl.className = "transit-log";
        
        let transitEmoji = "🚃";
        if (place.transitInfo.method === "walk") transitEmoji = "🚶";
        else if (place.transitInfo.method === "bus") transitEmoji = "🚌";

        transitEl.innerHTML = `
          <div class="transit-icon-wrapper">
            <span class="transit-icon">${transitEmoji}</span>
          </div>
          <div>
            ${place.transitInfo.line} - <span class="transit-duration">${place.transitInfo.duration} 分鐘</span>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">
              ${place.transitInfo.details}
            </div>
          </div>
        `;
        timelineContainer.appendChild(transitEl);
      }
    });
  }

  // Render Places Directory
  function renderDirectory() {
    placesListContainer.innerHTML = "";
    if (allPlaces.length === 0) return;

    let filtered = allPlaces.filter(place => {
      // Category filter
      if (activeCategory !== "all" && place.category !== activeCategory) return false;
      // Search query filter
      if (searchQuery) {
        const matchName = place.name.toLowerCase().includes(searchQuery);
        const matchEng = place.englishName.toLowerCase().includes(searchQuery);
        const matchDesc = place.desc.toLowerCase().includes(searchQuery);
        return matchName || matchEng || matchDesc;
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
      const deleteBtnHtml = isCustom ? `
        <button class="delete-place-btn" title="刪除自訂地點" onclick="deleteCustomPlace('${place.id}', event)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
      ` : '';

      // Determine picture path (handle user added absolute image URLs)
      let mainImg = "images/subway_1.jpg";
      if (place.images && place.images.length > 0) {
        const img = place.images[0];
        mainImg = (img.startsWith("http://") || img.startsWith("https://")) ? img : `images/${img}`;
      }

      cardEl.innerHTML = `
        <div class="place-card-img" style="background-image: url('${mainImg}');"></div>
        <div class="place-card-body">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="flex: 1; min-width: 0;">
              <h3 style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${place.name}</h3>
              <div style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${place.englishName}</div>
            </div>
            ${deleteBtnHtml}
          </div>
          <div class="place-card-meta">
            <span class="place-card-category" data-cat="${place.category}">${categoryEmojis[place.category]} ${getCategoryChinese(place.category)}</span>
            <span class="place-card-day">${place.day ? `Day ${place.day}` : '自訂'}</span>
          </div>
        </div>
      `;

      cardEl.addEventListener("click", (e) => {
        // Prevent trigger if clicking on the delete button
        if (e.target.closest(".delete-place-btn")) return;
        
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

  // Delete Custom Place Global Function
  window.deleteCustomPlace = function (id, event) {
    if (event) event.stopPropagation(); // Stop card navigate bubble
    
    if (!confirm("確定要刪除此自訂地點嗎？")) return;
    
    let storedPlaces = [];
    const stored = localStorage.getItem("tokyo_trip_custom_places");
    if (stored) {
      try {
        storedPlaces = JSON.parse(stored);
      } catch (e) {
        storedPlaces = [];
      }
    }
    
    // Filter and update
    storedPlaces = storedPlaces.filter(p => p.id !== id);
    localStorage.setItem("tokyo_trip_custom_places", JSON.stringify(storedPlaces));

    // Close detail drawer if active open
    closeDrawer();

    // Refresh everything
    refreshAllPlaces();
    renderItinerary();
    renderDirectory();
    updateMapMarkers();
  };

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
      placesToShow = allPlaces.filter(p => p.day === dayNum || p.id === "syla_hotel");
    }

    // 2. Create Leaflet Markers
    placesToShow.forEach(place => {
      // Custom Div Icon to style markers with category colors
      const markerHtml = `
        <div class="marker-pin" data-cat="${place.category}" id="pin-${place.id}">
          <span class="marker-icon">${categoryEmojis[place.category]}</span>
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
      
      // Determine picture path (handle user added absolute image URLs)
      let mainImg = "images/subway_1.jpg";
      if (place.images && place.images.length > 0) {
        const img = place.images[0];
        mainImg = (img.startsWith("http://") || img.startsWith("https://")) ? img : `images/${img}`;
      }

      // Popup Content
      const popupContent = `
        <div class="popup-card">
          <div class="popup-img" style="background-image: url('${mainImg}')"></div>
          <div class="popup-body">
            <h3>${place.name}</h3>
            <p>${place.englishName}</p>
            <a href="#" class="popup-link" onclick="window.dispatchEvent(new CustomEvent('open-place-drawer', {detail: '${place.id}'})); return false;">
              查看詳細資訊與交通 &rarr;
            </a>
          </div>
        </div>
      `;
      
      marker.bindPopup(popupContent, {
        closeButton: true,
        offset: L.point(0, -26)
      });

      marker.on("click", () => {
        highlightMarkerPin(place.id);
        openDrawer(place.id);
      });

      mapMarkers.push(marker);
    });

    // 3. Draw colored routing polylines if a activeDay is selected
    if (activeDay !== "all") {
      const dayNum = parseInt(activeDay);
      // Sort day spots in timeline sequence
      let daySpots = allPlaces.filter(p => p.day === dayNum);
      
      // Dynamic chronological sorting by time. 
      // Places with time are sorted chronologically, places without time are pushed to the end (using weight 99:99).
      daySpots.sort((a, b) => {
        const ta = a.time || "99:99";
        const tb = b.time || "99:99";
        if (ta !== tb) return ta.localeCompare(tb);
        return a.id.localeCompare(b.id);
      });

      // Construct route: Start at Hotel -> visit day spots -> return to Hotel (except Day 6)
      const hotel = allPlaces.find(p => p.id === "syla_hotel");
      const pathCoordinates = [];

      if (hotel) {
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
        color: dayColors[dayNum] || "#c5a059",
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

  // Highlight a marker pin visually on map
  function highlightMarkerPin(placeId) {
    document.querySelectorAll(".marker-pin").forEach(pin => pin.classList.remove("active"));
    const element = document.getElementById(`pin-${placeId}`);
    if (element) {
      element.classList.add("active");
    }
  }

  // Map Locate and Zoom on a place
  function locatePlace(placeId) {
    const place = allPlaces.find(p => p.id === placeId);
    if (!place) return;

    map.setView([place.lat, place.lng], 15, {
      animate: true,
      duration: 1.0
    });

    map.closePopup();
    
    const marker = mapMarkers.find(m => m.placeId === placeId);
    if (marker) {
      setTimeout(() => marker.openPopup(), 600);
    }

    highlightMarkerPin(placeId);
  }

  // Listen to popup redirects
  window.addEventListener("open-place-drawer", (e) => {
    openDrawer(e.detail);
  });

  // ==========================================
  // DRAWER & SLIDER
  // ==========================================
  
  function openDrawer(placeId) {
    const place = allPlaces.find(p => p.id === placeId);
    if (!place) return;

    // Automatically collapse sidebar on mobile when opening detail drawer so they never overlap (Google Maps style)
    if (window.innerWidth <= 768) {
      sidebar.classList.remove("expanded");
    }

    currentSlideIndex = 0;

    // Build Image Slider HTML
    let imageSlidesHtml = "";
    let indicatorsHtml = "";
    
    const imageList = place.images && place.images.length > 0 ? place.images : ["subway_1.jpg"];
    
    imageList.forEach((img, idx) => {
      const imgSrc = (img.startsWith("http://") || img.startsWith("https://")) ? img : `images/${img}`;
      imageSlidesHtml += `<div class="carousel-slide" style="background-image: url('${imgSrc}');"></div>`;
      indicatorsHtml += `<span class="indicator ${idx === 0 ? 'active' : ''}" data-idx="${idx}"></span>`;
    });

    // Build Transit details in drawer
    let drawerTransitHtml = "";
    if (place.transitInfo) {
      let tEmoji = "🚃";
      if (place.transitInfo.method === "walk") tEmoji = "🚶";
      else if (place.transitInfo.method === "bus") tEmoji = "🚌";
      
      drawerTransitHtml = `
        <div class="detail-transit-block">
          <div class="transit-header-text">交通路線 (起點: ${place.transitInfo.from})</div>
          <div class="transit-step-body">
            <span style="font-size: 1.3rem;">${tEmoji}</span>
            <div>
              <div class="transit-desc-text">${place.transitInfo.line}</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">${place.transitInfo.details}</div>
            </div>
            <div style="margin-left: auto; text-align: right; white-space: nowrap;">
              <span class="transit-duration" style="font-size: 1rem;">${place.transitInfo.duration}</span>
              <span style="font-size: 0.75rem; color: var(--text-muted);">分鐘</span>
            </div>
          </div>
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
              <h2>${place.name}</h2>
              <div class="detail-badges">
                <span class="tag-badge" data-cat="${place.category}">${categoryEmojis[place.category]} ${getCategoryChinese(place.category)}</span>
                ${place.day ? `<span class="tag-badge tag-badge-day">Day ${place.day}</span>` : ''}
              </div>
            </div>
            <div class="detail-english">${place.englishName}</div>
          </div>
          
          <div class="detail-desc">
            ${place.desc}
          </div>
          
          ${drawerTransitHtml}
          
          <div class="drawer-actions">
            <a href="${place.gmaps}" target="_blank" class="btn btn-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px; height:16px; margin-right:6px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Google Maps 地圖導航
            </a>
            <button class="btn btn-outline" id="drawer-locate-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px; height:16px; margin-right:6px;"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
              定位地圖
            </button>
          </div>
        </div>
        
      </div>
    `;

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
    let savedStates = {};
    const stored = localStorage.getItem("tokyo_trip_checklist_state");
    if (stored) {
      try {
        savedStates = JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse checklist states:", e);
      }
    }

    const checkboxes = checklistContainer.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
      const id = cb.id;
      if (id && savedStates[id] !== undefined) {
        cb.checked = savedStates[id];
      }

      // Add event listener to save state when changed
      cb.addEventListener("change", () => {
        savedStates[cb.id] = cb.checked;
        localStorage.setItem("tokyo_trip_checklist_state", JSON.stringify(savedStates));
      });
    });
  }

  // Budget & Expense Calculator
  function initBudgetCalculator() {
    const calcRateInput = document.getElementById("calc-rate");
    const calcFlightInput = document.getElementById("calc-flight");
    const calcPocketInput = document.getElementById("calc-pocket");
    
    if (!calcRateInput || !calcFlightInput || !calcPocketInput) return;

    const hotelPerPersonJpy = 33120;
    const targetBudgetTwd = 50000;

    // Load saved inputs
    const stored = localStorage.getItem("tokyo_trip_budget_inputs");
    if (stored) {
      try {
        const savedInputs = JSON.parse(stored);
        if (savedInputs.rate !== undefined) calcRateInput.value = savedInputs.rate;
        if (savedInputs.flight !== undefined) calcFlightInput.value = savedInputs.flight;
        if (savedInputs.pocket !== undefined) calcPocketInput.value = savedInputs.pocket;
      } catch (e) {
        console.error("Failed to parse budget inputs:", e);
      }
    }

    function calculate() {
      const rate = parseFloat(calcRateInput.value) || 0.22;
      const flightTwd = parseFloat(calcFlightInput.value) || 0;
      const pocketJpy = parseFloat(calcPocketInput.value) || 0;

      // Save to LocalStorage
      localStorage.setItem("tokyo_trip_budget_inputs", JSON.stringify({
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

      // Update progress bar
      const percentage = Math.min(100, Math.round((totalTwd / targetBudgetTwd) * 100));
      document.getElementById("budget-percentage").textContent = `已用 ${percentage}%`;
      
      const fillBar = document.getElementById("budget-progress-fill");
      fillBar.style.width = `${percentage}%`;

      // Remove previous color classes
      fillBar.classList.remove("under-budget", "near-budget", "over-budget");
      
      // Update color based on percentage
      if (percentage < 80) {
        fillBar.classList.add("under-budget");
      } else if (percentage <= 100) {
        fillBar.classList.add("near-budget");
      } else {
        fillBar.classList.add("over-budget");
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
