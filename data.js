const TRIP_METADATA = {
  title: "東京行",
  dates: "2026/12/9 ~ 12/14",
  peopleCount: 5,
  // ISO 起飛時間 (桃園機場,台灣時間 +08:00) — 用於倒數計時,單一資料源
  departureISO: "2026-12-09T12:50:00+08:00",
  // Day 1 的日期 (日本時間):旅行期間用來判斷今天是 Day 幾
  startDate: "2026-12-09",
  flightDetails: {
    arrival: {
      date: "12/9 (週三)",
      time: "12:50 ~ 16:50",
      notes: "桃園機場 (TPE) 飛往成田機場 (NRT)，抵達後搭乘京成 Access 特急直達押上飯店，車程約 55 分鐘、單程 ¥1,270"
    },
    departure: {
      date: "12/14 (週一)",
      time: "15:30 ~ 18:40",
      notes: "預計 12:30 從押上站搭京成 Access 特急直達成田機場 (NRT) 返回桃園 (TPE)，抓 2.5 小時提前抵達"
    }
  },
  accommodation: {
    name: "SYLA HOTEL Oshiage (押上)",
    address: "東京都墨田區押上 3 丁目 (Oshiage, Sumida-ku) — 走 5 分鐘到晴空塔",
    cost: "165,598 日幣 (5 晚)，5 人分攤每人 NT$9,061",
    // 結構化欄位:總價 (日幣原價) / 每人實際分攤 (台幣,已付款,不隨匯率變動) — 預算計算機用 perPersonTwd
    totalCostJpy: 165598,
    perPersonTwd: 9061,
    link: "https://www.agoda.com/zh-tw/syla-hotel-oshiage/hotel/all/tokyo-jp.html?checkIn=2026-12-9&los=5",
    coordinates: [35.7108, 139.8150]
  },
  // 預算計算機 (行前指南) 的預設值,每人計算。
  // 手機只記住使用者自己改過的欄位,沒改過的一律用這裡的最新值,改了之後大家的手機都會更新
  // 預算分頁的預設值 (旅伴改過的值只存在各自的手機);總預算由各自填,沒有預設值
  budget: {
    flightTwd: 14424,  // 機票 (台幣)
    jpyRate: 0.21      // 匯率 (台幣 / 1 日圓) — 臺灣銀行現金賣出,2026-11-12
  },
  // 行前清單的預設項目 (大家共用);旅伴自己加的項目、刪掉的預設項目、打勾狀態只存在各自的手機
  // id 是手機上打勾紀錄的 key:已經有的 id 不要改,新增項目用新的 id
  checklist: [
    { id: "checklist-passport", text: "護照正本 (效期大於 6 個月)" },
    { id: "checklist-vjw", text: "Visit Japan Web 填寫完成 (入境 QR Code)" },
    { id: "checklist-cash", text: "日幣現金 (建議每人準備 3~5 萬日幣現鈔，其餘刷卡)" },
    { id: "checklist-sim", text: "上網網卡 (eSIM 或實體 SIM 卡)" },
    { id: "checklist-powerbank", text: "行動電源(嚴禁放入托運行李)，每人最多限帶 2 顆" },
    { id: "checklist-trash-bag", text: "垃圾袋(裝髒衣服用)" },
    { id: "checklist-luggage-scale", text: "行李秤" },
    { id: "checklist-lotion", text: "乳液類(要記得分裝成小瓶)" },
    { id: "checklist-cable", text: "充電線" },
    { id: "checklist-meds", text: "自己要吃的藥" },
    { id: "checklist-clothing", text: "衣物" },
    { id: "checklist-mask", text: "口罩" },
    { id: "checklist-essentials", text: "鑰匙、錢包、耳機(出門三寶)" },
    { id: "checklist-toothbrush", text: "牙膏牙刷" },
    { id: "checklist-lip-balm", text: "護唇膏" },
    { id: "checklist-backup-info", text: "手機備份好機票跟住宿的資訊" },
    { id: "checklist-camera", text: "相機" },
    { id: "checklist-insurance", text: "保險" },
    { id: "checklist-suica", text: "西瓜卡處理" },
    { id: "checklist-tickets", text: "車票訂好或看好" },
    { id: "checklist-ready", text: "一顆準備好出去玩的心" }
  ]
};

const PLACES = [
  {
    id: "syla_hotel",
    name: "SYLA HOTEL Oshiage",
    englishName: "シーラホテル押上",
    category: "lodging",
    lat: 35.7108,
    lng: 139.8150,
    day: 1,
    time: "19:00",
    desc: "本次旅程的住宿大本營。位於墨田區押上，走 5 分鐘就是東京晴空塔與押上地鐵站。押上站同時擁有 4 條線 — 半藏門線（直達澀谷、清澄白河）、都營淺草線（直達淺草、銀座、機場）、京成押上線與東武伊勢崎線，機場往返都不用轉車。第一天約 19:00 抵達 check-in、放行李。",
    imageFolder: "SYLA 飯店",
    gmaps: "https://maps.google.com/?q=SYLA+HOTEL+Oshiage",
    transitInfo: {
      from: "成田國際機場",
      method: "train",
      line: "京成 Access 特急 (成田機場 → 押上)",
      duration: 55,
      details: "入境、領行李約 1 小時，約 18:00 搭京成 Access 特急直達押上（約 55 分鐘、¥1,270），押上站步行約 5 分鐘到飯店。"
    }
  },

  // ==================== DAY 1 (12/9 週三) — 抵達日 ====================
  {
    id: "narita_airport",
    name: "成田國際機場",
    englishName: "成田国際空港",
    category: "transport",
    lat: 35.770761,
    lng: 140.387137,
    day: 1,
    time: "16:50",
    // 當天從這裡出發 (不是飯店):時間軸不顯示前一段交通,地圖路線從這裡開始畫
    dayStart: true,
    desc: "機場",
    imageFolder: "成田國際機場",
    gmaps: "https://maps.app.goo.gl/QwbjzmpN7jsnnofv8",
    transitInfo: null
  },
  {
    id: "lawson_oshiage",
    name: "Lawson 押上店 (第一晚宵夜)",
    englishName: "Lawson Oshiage",
    category: "food",
    lat: 35.7115,
    lng: 139.8138,
    day: 1,
    time: "21:45",
    desc: "必吃炸機跟炸熱狗，可以買回去房間吃",
    imageFolder: "Lawson 押上店",
    gmaps: "https://maps.google.com/?q=Lawson+Oshiage",
    transitInfo: {
      from: "SYLA HOTEL Oshiage",
      method: "walk",
      line: "徒步 (Walk 250m)",
      duration: 4,
      details: "check-in 放好行李後出門，Lawson 就在飯店旁，走 250 公尺就到。"
    }
  },

  // ==================== DAY 2 (12/10 週四) — 龜有 + 銀座 + 東京車站 (2026-11-25 照另一個 AI 的推薦排) ====================
  {
    id: "kameari_ryotsu",
    name: "龜有 兩津勘吉銅像",
    englishName: "Ryotsu Kankichi Statue, Kameari (両津勘吉像)",
    category: "sightseeing",
    lat: 35.7663,
    lng: 139.8478,
    day: 2,
    time: "09:30",
    desc: "《烏龍派出所》的故鄉，龜有站北口有兩津勘吉銅像，車站周邊還有十幾座角色銅像可以邊走邊找。",
    imageFolder: "龜有 兩津勘吉",
    gmaps: "https://maps.app.goo.gl/K6bQ9cS8sqXLqtmy5",
    transitInfo: {
      from: "SYLA HOTEL Oshiage",
      method: "train",
      line: "東武晴空塔線 → 千代田線 (押上 → 北千住 → 龜有)",
      duration: 35,
      details: "從飯店走到押上站（約 5 分鐘），搭東武晴空塔線（東武スカイツリーライン）到北千住站，轉千代田線（直通 JR 常磐線各站停車）2 站到龜有站（有些班次只到綾瀨，在綾瀨換車），北口出站就是兩津勘吉銅像。"
    }
  },
  {
    id: "tonkatsu_aoki",
    name: "とんかつ檍 銀座 8 丁目店",
    englishName: "Tonkatsu Aoki Ginza 8-chome (とんかつ檍)",
    category: "food",
    lat: 35.6682,
    lng: 139.7615,
    day: 2,
    time: "11:05",
    desc: "東京炸豬排前三強！選用高品質林 SPF 豬肉，外皮金黃酥脆、切面粉嫩多汁。桌上有多款高級岩鹽，搭鹽吃能吃出豬肉甘甜。11:00 開店，建議 11:15 前到店排隊，不然要排 1 小時起跳。",
    imageFolder: "とんかつ檍 銀座",
    gmaps: "https://maps.google.com/?q=Tonkatsu+Aoki+Ginza+8-chome",
    transitInfo: {
      from: "龜有 兩津勘吉銅像",
      method: "subway",
      line: "千代田線 (龜有 → 日比谷)",
      duration: 45,
      details: "10:15 龜有站搭 JR 常磐線各站停車（直通千代田線）直達日比谷站（約 30 分鐘；有些班次只到綾瀨，在綾瀨換車），出站往銀座 8 丁目方向步行約 12 分鐘，店在地下室。"
    }
  },
  {
    id: "uniqlo_ginza",
    name: "Uniqlo 銀座旗艦店",
    englishName: "UNIQLO Ginza (ユニクロ 銀座店)",
    category: "shopping",
    lat: 35.6702,
    lng: 139.7635,
    day: 2,
    time: "13:00",
    desc: "你們清單裡「一定要去」的點！全球最大 Uniqlo 旗艦店，12 層樓。特別聯名款、UT 客製化專區、頂樓 Uniqlo Coffee。留 1.5 ~ 2 小時慢慢挑冬裝。",
    imageFolder: "Uniqlo 銀座",
    gmaps: "https://maps.app.goo.gl/gghggXqJd81zzHmi9",
    transitInfo: {
      from: "Tonkatsu Aoki",
      method: "walk",
      line: "徒步 (Walk 400m)",
      duration: 6,
      details: "從銀座 8 丁目沿中央通往北步行 400 公尺，Uniqlo 12 層旗艦大樓在銀座 6 丁目。"
    }
  },
  {
    id: "ginza_akebono",
    name: "銀座あけぼの 銀座本店",
    englishName: "Ginza Akebono (銀座あけぼの 銀座本店)",
    category: "food",
    lat: 35.67132,
    lng: 139.764498,
    day: 2,
    time: "15:15",
    desc: "老字號和菓子店，就是奇哥影片裡那間。買草莓大福或豆大福外帶。月～土 10:00～21:00、日 10:00～20:00，無休。",
    imageFolder: "銀座あけぼの",
    gmaps: "https://maps.google.com/?q=銀座あけぼの+銀座本店",
    transitInfo: {
      from: "Uniqlo 銀座旗艦店",
      method: "walk",
      line: "徒步 (Walk 約 300m)",
      duration: 5,
      details: "從 Uniqlo 銀座沿中央通往北走到銀座 5 丁目，約 300 公尺。"
    }
  },
  {
    id: "the_stand_canele",
    name: "THE STAND 可麗露",
    englishName: "THE STAND Yurakucho",
    category: "food",
    lat: 35.6748,
    lng: 139.7627,
    day: 2,
    time: "15:45",
    desc: "有樂町高架橋下的精緻咖啡酒吧，外帶「可麗露 Canelé」外皮酥脆、內裡溫潤，被譽為東京可麗露天花板。可以坐下喝杯咖啡休息，也可買 5 個可麗露帶著走。",
    imageFolder: "THE STAND 可麗露",
    gmaps: "https://maps.google.com/?q=THE+STAND+Yurakucho",
    transitInfo: {
      from: "銀座あけぼの 銀座本店",
      method: "walk",
      line: "徒步 (Walk 約 500m)",
      duration: 7,
      details: "從銀座 5 丁目往有樂町站方向走，THE STAND 在有樂町站高架橋下。"
    }
  },
  {
    id: "tamatoya_tokyo_station",
    name: "月島もんじゃ たまとや 東京駅",
    englishName: "Tsukishima Monja Tamatoya Tokyo Station (月島もんじゃ たまとや 東京駅)",
    category: "food",
    lat: 35.6823771,
    lng: 139.7681174,
    day: 2,
    time: "17:15",
    desc: "月島本店的排隊名店，有豬肉、海鮮的大阪燒和文字燒，對不吃牛友善。在東京站八重洲北口改札外的グランスタ八重北 B1F 黑塀橫丁，11:00～23:00。建議先訂 5 人位；店裡鐵板多比較熱，穿好穿脫的衣服。",
    imageFolder: "月島もんじゃ たまとや",
    gmaps: "https://maps.google.com/?q=月島もんじゃ+たまとや+東京駅",
    transitInfo: {
      from: "THE STAND 可麗露",
      method: "train",
      line: "JR 山手線 (有樂町 → 東京)",
      duration: 12,
      details: "從 THE STAND 走到有樂町站，搭 JR 山手線 1 站到東京站（2 分鐘），往八重洲北口方向走到グランスタ八重北 B1F 黑塀橫丁。"
    }
  },
  {
    id: "tokyo_station_souvenirs",
    name: "東京車站一番街 (伴手禮採購)",
    englishName: "Tokyo Station First Avenue (東京駅一番街)",
    category: "shopping",
    lat: 35.6812,
    lng: 139.7671,
    day: 2,
    time: "19:45",
    desc: "東京最強伴手禮大本營。Tokyo Banana、Press Butter Sand 焦糖奶油餅、NY Perfect Cheese 起司條、Calbee+ 現炸薯條、寶可夢中心、寶可夢角色街、拉麵激戰區全在這一棟。5 人分頭掃貨最快。",
    imageFolder: "東京車站一番街",
    gmaps: "https://maps.google.com/?q=Tokyo+Station+First+Avenue",
    transitInfo: {
      from: "Chiikawa Land 東京車站店",
      method: "walk",
      line: "徒步 (一番街站內)",
      duration: 2,
      details: "同在東京車站一番街 B1F，逛完角色街直接移動到伴手禮區。逛完可搭東京 Metro 半藏門線於大手町轉車直達押上。"
    }
  },

  // ==================== DAY 3 (12/11 週五, 平日) — 新宿 ====================
  {
    id: "sekaido_shinjuku",
    name: "世界堂 (Sekaido) 新宿本店",
    englishName: "Sekaido Shinjuku Main Store (世界堂 新宿本店)",
    category: "shopping",
    lat: 35.6899,
    lng: 139.7063,
    day: 3,
    time: "11:00",
    desc: "幫家人看文具。畫材、文具專賣店，整棟 5 層樓，多數商品最多打 8 折。9:30～21:00，年中無休（年初除外）。在新宿三丁目，離 D3 的 Alpen Tokyo 步行約 10 分鐘。",
    imageFolder: "世界堂 新宿本店",
    gmaps: "https://maps.google.com/?q=世界堂+新宿本店",
    transitInfo: {
      from: "SYLA HOTEL Oshiage",
      method: "subway",
      line: "半藏門線 → 都營新宿線 (押上 → 新宿三丁目)",
      duration: 40,
      details: "從飯店走到押上站（約 5 分鐘），搭半藏門線至九段下站（約 16 分鐘），轉都營新宿線至新宿三丁目站（約 8 分鐘），出站步行約 3 分鐘。"
    }
  },
  {
    id: "eifukuen_shinjuku",
    name: "燒肉 永福苑 新宿店",
    englishName: "Yakiniku Eifukuen Shinjuku (焼肉 永福苑)",
    category: "food",
    lat: 35.6873,
    lng: 139.6968,
    day: 3,
    time: "12:00",
    desc: "開了 30 年的燒肉店，新宿南口步行 5 分鐘（南新宿セントラルビル 2F）。午餐有便宜的炭火豬五花（サムギョプサル）套餐，晚餐人均約 ¥4,000～5,000。午市 11:30～15:00、晚市 17:00 起，週日公休。⚠️ 老闆不吃牛：可以點豬五花。",
    imageFolder: "燒肉 永福苑",
    gmaps: "https://maps.app.goo.gl/kPDQ27uJYL5Qu1os6",
    transitInfo: {
      from: "世界堂 新宿本店",
      method: "walk",
      line: "徒步 (Walk 約 1km)",
      duration: 13,
      details: "從新宿三丁目往新宿南口方向走，過南口後沿甲州街道往西到南新宿，店在南新宿セントラルビル 2F。"
    }
  },
  {
    id: "alpen_tokyo",
    name: "Alpen Tokyo 體育用品旗艦",
    englishName: "Alpen Tokyo Shinjuku (アルペントーキョー)",
    category: "shopping",
    lat: 35.6934,
    lng: 139.7007,
    day: 3,
    time: "12:30",
    desc: "真的要去爆買了",
    imageFolder: "Alpen Tokyo",
    gmaps: "https://maps.google.com/?q=Alpen+Tokyo+Shinjuku",
    transitInfo: {
      from: "燒肉 永福苑 新宿店",
      method: "walk",
      line: "徒步 (Walk 約 1km)",
      duration: 13,
      details: "吃完從南新宿往北走，經新宿南口到新宿站東口一帶，步行約 1 公里。"
    }
  },
  {
    id: "magical_chiikawa_shinjuku",
    name: "魔法少女吉伊卡哇專賣店 新宿店",
    englishName: "Magical Chiikawa Store Shinjuku (まじかるちいかわストア)",
    category: "shopping",
    lat: 35.6917,
    lng: 139.7038,
    day: 3,
    time: "13:45",
    desc: "夢幻的主題專賣店「まじかるちいかわストア」！位於新宿 Marui 本館 (新宿丸井 1F)。這我要爆買，但好像假日會要整理券才能進去，到時候再看看",
    imageFolder: "魔法少女吉伊卡哇 新宿",
    gmaps: "https://maps.app.goo.gl/7rK9parQbRVMiUM68",
    transitInfo: {
      from: "Alpen Tokyo",
      method: "walk",
      line: "徒步 (Walk 300m)",
      duration: 4,
      details: "從 Alpen Tokyo 出來沿新宿三丁目方向步行 4 分鐘即可抵達新宿 Marui 本館 1F。"
    }
  },
  {
    id: "shake_shack_shinjuku",
    name: "Shake Shack 新宿 Southern Terrace",
    englishName: "Shake Shack Shinjuku Southern Terrace",
    category: "food",
    lat: 35.6862,
    lng: 139.7005,
    day: 3,
    time: "14:30",
    desc: "新宿南口小田急塔 2F，吃一下",
    imageFolder: "Shake Shack 新宿",
    gmaps: "https://maps.google.com/?q=Shake+Shack+Shinjuku+Southern+Terrace",
    transitInfo: {
      from: "魔法少女吉伊卡哇專賣店 新宿店",
      method: "walk",
      line: "徒步 (Walk 600m)",
      duration: 8,
      details: "從新宿 Marui 本館沿甲州街道往新宿南口方向步行 600 公尺至小田急南塔 2F。"
    }
  },
  {
    // 押上的兩家串燒店二選一 (都在とうきょうスカイツリー站旁),座標用車站;還沒選定所以不放 Google Maps 連結
    id: "omoide_yokocho",
    name: "居酒屋",
    englishName: "居酒屋 (Izakaya)",
    category: "food",
    lat: 35.7103,
    lng: 139.8090,
    day: 3,
    time: "19:30",
    desc: "其實隨便居酒屋就可以了，到時候再看看要吃哪間。二選一，都在押上的とうきょうスカイツリー站旁：やきとんひなた（豬肉串燒為主，平日 16:00～23:00），或角吉（牛、豬、雞串燒都有）。",
    imageFolder: "居酒屋",
    gmaps: null,
    transitInfo: {
      from: "Shake Shack 新宿",
      method: "subway",
      line: "都營新宿線 → 半藏門線 (新宿 → 押上)",
      duration: 45,
      details: "新宿站搭都營新宿線到九段下站，轉半藏門線到押上站（約 30 分鐘）。可以先回飯店放戰利品，再從飯店走約 7 分鐘到とうきょうスカイツリー站旁；吃完走回飯店，不用趕末班車。"
    }
  },

  // ==================== DAY 4 (12/12 週六) — 神宮外苑 / 明治神宮 / 原宿 / 澀谷 / 表參道 ====================
  {
    id: "jingu_gaien_ginkgo",
    name: "神宮外苑 銀杏並木 (推薦景點)",
    englishName: "Meiji Jingu Gaien Ginkgo Avenue (明治神宮外苑 いちょう並木)",
    category: "sightseeing",
    lat: 35.6727,
    lng: 139.7206,
    day: 4,
    time: "10:30",
    desc: "東京最有名的銀杏大道，約 300 公尺、約 150 棵銀杏排成四列，免費。⚠️ 往年最美是 11 月下旬到 12 月上旬，12/9 之後可能是尾聲（滿地落葉），出發前一週再看一次黃葉狀況。",
    imageFolder: "神宮外苑 銀杏並木",
    gmaps: "https://maps.app.goo.gl/mLFjLwzYTBKCrs2c7",
    transitInfo: {
      from: "SYLA HOTEL Oshiage",
      method: "subway",
      line: "半藏門線 (押上 → 青山一丁目)",
      duration: 40,
      details: "從飯店走到押上站（約 5 分鐘），搭半藏門線直達青山一丁目站（約 22 分鐘），出站沿青山通り往外苑前方向走到「青山二丁目」路口（約 7 分鐘），銀杏並木就在路口北側。"
    }
  },
  {
    id: "meiji_jingu",
    name: "明治神宮 (推薦景點)",
    englishName: "Meiji Jingu Shrine",
    category: "sightseeing",
    lat: 35.6764,
    lng: 139.6993,
    day: 4,
    time: "12:00",
    desc: "東京市中心的巨型森林神社，鳥居下拍照極美，五人拍團體照的絕佳場所。",
    imageFolder: "明治神宮",
    gmaps: "https://maps.app.goo.gl/78zYWAVM5sRB9NMS9",
    transitInfo: {
      from: "神宮外苑 銀杏並木",
      method: "subway",
      line: "銀座線 → 千代田線 (外苑前 → 明治神宮前〈原宿〉)",
      duration: 30,
      details: "走到外苑前站搭銀座線 1 站到表參道站，轉千代田線 1 站到明治神宮前〈原宿〉站，出站經原宿口鳥居步行約 10 分鐘到本殿。"
    }
  },
  {
    id: "chiikawa_harajuku",
    name: "Chiikawa Land 原宿店",
    englishName: "Chiikawa Land Harajuku (Kiddy Land 1F)",
    category: "shopping",
    lat: 35.6675,
    lng: 139.7058,
    day: 4,
    time: "14:30",
    desc: "前面如果買夠了就不看",
    imageFolder: "Chiikawa 原宿店",
    gmaps: "https://maps.app.goo.gl/JBWr123mratPgxdP8",
    transitInfo: {
      from: "明治神宮",
      method: "walk",
      line: "徒步 (Walk 約 1.5km)",
      duration: 20,
      details: "參拜完從本殿走回原宿口鳥居，過神宮橋沿表參道走到 Kiddy Land 原宿店 1F。"
    }
  },
  {
    id: "harbs_shibuya",
    name: "HARBS 蛋糕 澀谷 Hikarie 店",
    englishName: "HARBS Shibuya Hikarie ShinQs",
    category: "food",
    lat: 35.6595,
    lng: 139.7045,
    day: 4,
    time: "16:00",
    desc: "好像很猛的千層蛋糕",
    imageFolder: "HARBS 澀谷",
    gmaps: "https://maps.google.com/?q=HARBS+Shibuya+Hikarie",
    transitInfo: {
      from: "Chiikawa Land 原宿店",
      method: "subway",
      line: "JR 山手線 (原宿 → 澀谷)",
      duration: 10,
      details: "從 Kiddy Land 走至原宿/明治神宮前站搭 JR 山手線 1 站至澀谷（2 分鐘），從 Hikarie 出口直達 B3F。"
    }
  },
  {
    id: "pokemon_center_shibuya",
    name: "寶可夢中心 澀谷",
    englishName: "Pokémon Center Shibuya (ポケモンセンターシブヤ)",
    category: "shopping",
    lat: 35.6621,
    lng: 139.6986,
    day: 4,
    time: "16:30",
    desc: "在澀谷 PARCO 6F，同一層還有 Nintendo TOKYO。",
    imageFolder: "寶可夢中心 澀谷",
    gmaps: "https://maps.google.com/?q=Pokemon+Center+Shibuya",
    transitInfo: {
      from: "HARBS 澀谷 Hikarie",
      method: "walk",
      line: "徒步 (Walk 約 700m)",
      duration: 12,
      details: "從 Hikarie 經澀谷站走到八公口，過全向十字路口後沿公園通り往上走到澀谷 PARCO，搭電梯到 6F。"
    }
  },
  {
    id: "taco_bell_shibuya",
    name: "Taco Bell 澀谷道玄坂店",
    englishName: "Taco Bell Shibuya Dogenzaka (タコベル 渋谷道玄坂店)",
    category: "food",
    lat: 35.6599,
    lng: 139.6976,
    day: 4,
    time: "17:30",
    desc: "道玄坂 2-25-14 1F，平日 11:00～23:00、週末 10:00～23:00。",
    imageFolder: "Taco Bell 澀谷",
    gmaps: "https://maps.google.com/?q=Taco+Bell+Shibuya+Dogenzaka",
    transitInfo: {
      from: "寶可夢中心 澀谷",
      method: "walk",
      line: "徒步 (Walk 約 500m)",
      duration: 7,
      details: "從澀谷 PARCO 往南走到道玄坂，店在 1F。"
    }
  },
  {
    id: "yamawarau_omotesando",
    name: "山笑ふ 壽喜燒 / 涮涮鍋 表參道",
    englishName: "Sukiyaki Shabushabu Yamawarau (山笑ふ 表参道店)",
    category: "food",
    lat: 35.6675,
    lng: 139.7110,
    day: 4,
    time: "18:30",
    desc: "訂位好了，他們都吃牛我只吃豬",
    imageFolder: "山笑ふ 壽喜燒",
    gmaps: "https://maps.google.com/?q=Yamawarau+Omotesando",
    transitInfo: {
      from: "Taco Bell 澀谷道玄坂店",
      method: "subway",
      line: "東京 Metro 銀座線 (澀谷 → 表參道)",
      duration: 20,
      details: "從道玄坂走到澀谷站（約 7 分鐘），搭銀座線 1 站至表參道站，A4 出口步行 4 分鐘。晚餐結束搭半藏門線直達押上。"
    }
  },

  // ==================== DAY 5 (12/13 週日) — 清澄白河 + 秋葉原 + 淺草 + 入谷 + 晴空塔 ====================
  // 10:00 有 2 站同時間 (TEN&、秋葉原),排序跟這裡的先後一樣;排時間時再調整 (見 docs/行程待討論.md)
  {
    id: "patisserie_ten",
    name: "PATISSERIE TEN& 泡芙 清澄白河",
    englishName: "PATISSERIE TEN& (パティスリー テン)",
    category: "food",
    lat: 35.6816,
    lng: 139.8037,
    day: 5,
    time: "10:00",
    desc: "清澄白河文青區的法式糕點名店。招牌脆皮泡芙外皮酥脆、卡士達內餡現點現灌，配一杯手沖咖啡體驗慢活早晨。從押上搭半藏門線 3 站直達。",
    imageFolder: "PATISSERIE TEN 泡芙",
    gmaps: "https://maps.google.com/?q=PATISSERIE+TEN+Kiyosumi-shirakawa",
    transitInfo: {
      from: "SYLA HOTEL Oshiage",
      method: "subway",
      line: "半藏門線 (押上 → 清澄白河)",
      duration: 20,
      details: "從飯店走到押上站（約 5 分鐘），搭半藏門線直達清澄白河站（3 站、6 分鐘），B2 出口步行 5 分鐘。"
    }
  },
  {
    id: "akihabara",
    name: "秋葉原電器街 (推薦景點)",
    englishName: "Akihabara Electric Town",
    category: "shopping",
    lat: 35.6984,
    lng: 139.7731,
    day: 5,
    time: "10:00",
    desc: "你們興趣裡的動漫電玩男子聖地！Yodobashi Camera 9 層、GiGO 遊戲中心、Super Potato 二手電玩、扭蛋機殿堂。",
    imageFolder: "秋葉原",
    gmaps: "https://maps.google.com/?q=Akihabara+Electric+Town",
    transitInfo: {
      from: "PATISSERIE TEN&",
      method: "subway",
      line: "半藏門線 → 銀座線 (清澄白河 → 末廣町)",
      duration: 25,
      details: "清澄白河搭半藏門線 2 站到三越前，轉東京 Metro 銀座線 2 站到末廣町站（約 15 分鐘），出站就是秋葉原電器街（中央通り）。"
    }
  },
  {
    id: "sensoji_night",
    name: "淺草寺",
    englishName: "Senso-ji Temple (浅草寺) & Kaminarimon (雷門)",
    category: "sightseeing",
    lat: 35.7148,
    lng: 139.7967,
    day: 5,
    time: "10:45",
    desc: "可以看看第一天晚上要去看看還是有去淺草在順便去",
    imageFolder: "淺草寺",
    gmaps: "https://maps.google.com/?q=Sensoji+Temple",
    transitInfo: {
      from: "秋葉原電器街",
      method: "subway",
      line: "東京 Metro 銀座線 (末廣町 → 淺草)",
      duration: 20,
      details: "末廣町站搭銀座線直達淺草站（5 站、約 10 分鐘），出站步行 2 分鐘到雷門，穿過仲見世通到淺草寺。"
    }
  },
  {
    id: "takoyaki_asakusa",
    name: "章魚燒",
    englishName: "たこ焼き (Takoyaki)",
    category: "food",
    lat: 35.7118,
    lng: 139.7947,
    day: 5,
    time: "12:00",
    desc: "一樣隨便一家章魚燒店就好了",
    imageFolder: "章魚燒",
    gmaps: null,
    transitInfo: {
      from: "淺草寺",
      method: "walk",
      line: "徒步 (Walk 400m)",
      duration: 6,
      details: "參拜完從淺草寺往雷門方向走回來，雷門、仲見世通一帶就有章魚燒店。"
    }
  },
  {
    id: "american_diner_andra",
    name: "American Diner Andra 漢堡",
    englishName: "American Diner Andra (アンドラ) Iriya",
    category: "food",
    lat: 35.7136,
    lng: 139.7814,
    day: 5,
    time: "14:00",
    desc: "看起來很猛的漢堡",
    imageFolder: "American Diner Andra",
    gmaps: "https://maps.app.goo.gl/uhuaHdVNmjzKpiri8",
    transitInfo: {
      from: "章魚燒",
      method: "subway",
      line: "東京 Metro 日比谷線 (淺草 → 入谷)",
      duration: 10,
      details: "從淺草站搭日比谷線 2 站至入谷站（3 分鐘），出站步行 5 分鐘。"
    }
  },
  {
    id: "tokyo_skytree",
    name: "東京晴空塔 天望展望台",
    englishName: "Tokyo Skytree Tembo Deck",
    category: "sightseeing",
    lat: 35.7101,
    lng: 139.8107,
    day: 5,
    time: "15:00",
    desc: "住飯店旁邊，全世界最高的獨立式電波塔（634m）！天望甲板 350m 高，看整個東京 + 富士山。週末 9:00 開門（平日 10:00），D5 是週日人比較多，可以先買 Fast Ticket 免排隊。",
    imageFolder: "晴空塔展望台",
    gmaps: "https://maps.google.com/?q=Tokyo+Skytree",
    transitInfo: {
      from: "American Diner Andra",
      method: "subway",
      line: "銀座線 → 都營淺草線 (稻荷町 → 淺草 → 押上)",
      duration: 25,
      details: "走到東京 Metro 銀座線稻荷町站，搭 2 站到淺草站，轉都營淺草線 2 站到押上站，押上站直通晴空塔，4F 是天望甲板的售票、入口樓層。也可以直接搭計程車（約 10 分鐘）。"
    }
  },
  {
    id: "miffy_solamachi",
    name: "miffy style Solamachi(米飛兔)",
    englishName: "miffy style Solamachi",
    category: "shopping",
    lat: 35.709856,
    lng: 139.809797,
    day: 5,
    time: "16:30",
    desc: "幫我姊買米飛兔",
    imageFolder: "miffy style Solamachi",
    gmaps: "https://maps.app.goo.gl/PSQ5NGPd21AJ1KC97",
    transitInfo: {
      from: "Chiikawa Land 晴空塔店 (Solamachi)",
      method: "walk",
      line: "徒步 (Solamachi 館內)",
      duration: 5,
      details: "同在 Tokyo Solamachi 裡，館內走幾分鐘就到，樓層看館內指引。"
    }
  },
  {
    id: "otafuku_oden",
    name: "關東煮",
    englishName: "おでん (Oden)",
    category: "food",
    lat: 35.7196,
    lng: 139.7915,
    day: 5,
    time: "21:00",
    desc: "這是名店，但好像也可以隨便找一家",
    imageFolder: "關東煮",
    gmaps: null,
    transitInfo: {
      from: "miffy style Solamachi",
      method: "subway",
      line: "都營淺草線 (押上 → 淺草)",
      duration: 30,
      details: "押上站搭都營淺草線 2 站到淺草站（約 5 分鐘），往北步行約 1.3 公里到淺草北邊的千束一帶，附近找一家關東煮；不想走可以從押上直接搭計程車（約 10 分鐘）。吃完直接叫計程車回押上約 ¥1,200。"
    }
  },

  // ==================== DAY 6 (12/14 週一) — 打包 + 回程 ====================
  // 09:00 起床打包，12:30 押上站搭京成 Access 特急直達成田機場
  {
    id: "narita_airport_return",
    name: "成田機場（回程）",
    englishName: "成田国際空港",
    category: "transport",
    lat: 35.770761,
    lng: 140.387137,
    day: 6,
    time: "13:30",
    desc: "回程 15:30 起飛，約 13:30 抵達機場辦理報到、托運行李。",
    imageFolder: "成田國際機場",
    gmaps: "https://maps.app.goo.gl/QwbjzmpN7jsnnofv8",
    transitInfo: {
      from: "SYLA HOTEL Oshiage",
      method: "train",
      line: "京成 Access 特急 (押上 → 成田機場)",
      duration: 65,
      details: "從飯店拉行李走到押上站（約 5 分鐘），搭京成 Access 特急直達成田機場（約 55 分鐘、¥1,270），起飛前 2 小時到機場。"
    }
  },

  // ==================== 吉伊卡哇專賣店 (Chiikawa Stores) ====================
  {
    id: "chiikawa_solamachi",
    name: "Chiikawa Land 晴空塔店 (Solamachi)",
    englishName: "Chiikawa Land Tokyo Solamachi (ちいかわらんど)",
    category: "shopping",
    lat: 35.7100,
    lng: 139.8120,
    day: 5,
    time: "16:00",
    desc: "去晃一下晴空塔，然後我要買及掰卡哇",
    imageFolder: "Chiikawa 晴空塔店",
    gmaps: "https://maps.app.goo.gl/M3JUiBgcyr4PSaEt6",
    transitInfo: {
      from: "東京晴空塔",
      method: "walk",
      line: "徒步 (晴空塔 → Solamachi)",
      duration: 5,
      details: "看完展望台下樓，Tokyo Solamachi 就在晴空塔下方，到 3 樓 East Yard 12 番地。"
    }
  },
  {
    id: "chiikawa_tokyo_station",
    name: "Chiikawa Land 東京車站店",
    englishName: "Chiikawa Land TOKYO Station (ちいかわらんど)",
    category: "shopping",
    lat: 35.6812,
    lng: 139.7671,
    day: 2,
    time: "19:15",
    desc: "賣伴手禮如果有順便經過的話可以在逛一下",
    imageFolder: "Chiikawa 東京車站店",
    gmaps: "https://maps.google.com/?q=Chiikawa+Land+TOKYO+Station",
    transitInfo: {
      from: "月島もんじゃ たまとや 東京駅",
      method: "walk",
      line: "徒步 (東京車站地下街)",
      duration: 5,
      details: "從八重洲北口的黑塀橫丁沿地下街往八重洲中央口方向走，到東京車站一番街 B1F 角色街。"
    }
  },

  // ==================== 未排入行程的候補地點（地圖上可見，隨時可加入行程） ====================
  {
    id: "yamada_unagi",
    name: "山田的鰻 鰻骨拉麵 (築地本店)",
    englishName: "Yamada no Unagi (山田のうなぎ)",
    category: "food",
    lat: 35.6644,
    lng: 139.7705,
    day: null,
    time: null,
    desc: "以創新的「鰻魚骨白湯拉麵」聞名的特色拉麵店，湯底使用鹿兒島高品質鰻魚骨熬製，濃郁鮮美且無腥味。推薦點選「拉麵 + 鰻魚飯」套餐，可以同時享用外酥內嫩的蒲燒鰻魚飯，並將飯倒入剩餘的濃郁麵湯中享用，風味絕佳。*週日公休。",
    imageFolder: "山田的鰻",
    gmaps: "https://maps.app.goo.gl/JQu23KQcmjkVXoaf7",
    transitInfo: null
  },
  {
    id: "negishi_yurakucho",
    name: "牛たん ねぎし 有楽町店",
    englishName: "Gyutan Negishi Yurakucho (牛たん とろろ 麦めし ねぎし)",
    category: "food",
    lat: 35.6764,
    lng: 139.7647,
    day: null,
    time: null,
    desc: "牛舌、山藥泥、麥飯套餐的連鎖名店，在東京國際論壇前，JR 有楽町站步行 2 分鐘。11:00～22:00，有 8 人包廂。⚠️ 牛舌專門店，老闆不吃牛要先確認能點什麼。可以排在 D2 銀座、東京車站之間。",
    imageFolder: "ねぎし 有楽町",
    gmaps: "https://maps.app.goo.gl/Qu1NW8mVxvP75m7M9",
    transitInfo: null
  },
  {
    id: "surugaya",
    name: "駿河屋",
    englishName: "Suruga-ya Anime & Hobby Store",
    category: "shopping",
    lat: 35.701594,
    lng: 139.771828,
    day: null,
    time: null,
    desc: "要去買我妹的車車",
    imageFolder: "駿河屋",
    gmaps: "https://maps.app.goo.gl/wWji8Mj1nqZ9avne8",
    transitInfo: null
  },
  {
    id: "hanayama_udon",
    name: "五代目 花山烏冬 銀座店",
    englishName: "Godaime Hanayama Udon Ginza (五代目 花山うどん)",
    category: "food",
    lat: 35.6699,
    lng: 139.7691,
    day: null,
    time: null,
    desc: "來自群馬的百年老店，招牌「鬼紐川寬烏龍麵」寬達 5 公分，麵條 Q 彈超有嚼勁，搭特製芝麻沾醬。17:30 傍晚場開店，避開午餐排隊。是烏龍麵愛好者的朝聖店。",
    imageFolder: "花山烏冬 銀座",
    gmaps: "https://maps.google.com/?q=Godaime+Hanayama+Udon+Ginza",
    transitInfo: null
  },
  {
    id: "cafe_kitsune_aoyama",
    name: "Café Kitsuné 青山",
    englishName: "Café Kitsuné Aoyama (カフェ キツネ)",
    category: "food",
    lat: 35.6648,
    lng: 139.7153,
    day: null,
    time: null,
    desc: "法國時尚品牌 Maison Kitsuné 旗下咖啡廳，木造和風竹林裝潢極有質感。點一杯拿鐵配狐狸餅乾，開啟表參道/青山散步日。",
    imageFolder: "Cafe Kitsune 青山",
    gmaps: "https://maps.google.com/?q=Cafe+Kitsune+Aoyama",
    transitInfo: null
  },
  {
    // D2 改吃月島もんじゃ たまとや 東京駅,這站移回候補 (2026-11-25)
    id: "yaiyai_okonomiyaki",
    name: "大阪燒",
    englishName: "お好み焼き (Okonomiyaki)",
    category: "food",
    lat: 35.6670,
    lng: 139.7057,
    day: null,
    time: null,
    desc: "你清單上的『大阪燒』實際位置！原宿裏通鐵板燒老店，客人自己在鐵板前煎大阪燒、廣島燒、文字燒、炒麵。5 個人圍鐵板一起玩最好玩。",
    imageFolder: "大阪燒",
    gmaps: null,
    transitInfo: null
  },
  {
    // D2 改買銀座あけぼの,這站移回候補 (2026-11-25)
    id: "umezono_daifuku",
    name: "大福",
    englishName: "大福 (Daifuku)",
    category: "food",
    lat: 35.7145,
    lng: 139.7959,
    day: null,
    time: null,
    desc: "這個大幅好像不是我要的那間，我看過的是奇哥影片的",
    imageFolder: "大福",
    gmaps: null,
    transitInfo: null
  },
];
