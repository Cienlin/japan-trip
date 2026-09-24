const TRIP_METADATA = {
  title: "東京冬日 5 人行 🇯🇵",
  dates: "2026/12/9 ~ 12/14 (六天五夜)",
  peopleCount: 5,
  // ISO 起飛時間 — 用於倒數計時,單一資料源
  departureISO: "2026-12-09T12:50:00+09:00",
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
    cost: "165,598 日幣 (5 晚總額，5 人平分約 33,120 日幣/人)",
    // 結構化欄位:總價 / 每人 — app.js 從此計算,不再硬編碼
    totalCostJpy: 165598,
    perPersonJpy: 33120,
    link: "https://www.agoda.com/zh-tw/syla-hotel-oshiage/hotel/all/tokyo-jp.html?checkIn=2026-12-9&los=5",
    coordinates: [35.7108, 139.8150]
  }
};

const PLACES = [
  {
    id: "syla_hotel",
    name: "SYLA HOTEL Oshiage",
    englishName: "シーラホテル押上",
    category: "lodging",
    lat: 35.7108,
    lng: 139.8150,
    day: null,
    time: null,
    desc: "本次旅程的住宿大本營。位於墨田區押上，走 5 分鐘就是東京晴空塔與押上地鐵站。押上站同時擁有 4 條線 — 半藏門線（直達澀谷、清澄白河）、都營淺草線（直達淺草、銀座、機場）、京成押上線與東武伊勢崎線，機場往返都不用轉車。",
    imageFolder: "SYLA 飯店",
    gmaps: "https://maps.google.com/?q=SYLA+HOTEL+Oshiage",
    transitInfo: null
  },

  // ==================== DAY 1 (12/9 週三) — 抵達日 ====================
  {
    id: "sensoji_night",
    name: "淺草寺",
    englishName: "Senso-ji Temple (浅草寺) — Night Visit",
    category: "sightseeing",
    lat: 35.7148,
    lng: 139.7967,
    day: 1,
    time: "19:30",
    desc: "可以看看第一天晚上要去看看還是有去淺草在順便去",
    imageFolder: "淺草寺",
    gmaps: "https://maps.google.com/?q=Sensoji+Temple",
    transitInfo: {
      from: "Chiikawa Land 晴空塔店 (Solamachi)",
      method: "subway",
      line: "都營淺草線 (押上 → 淺草)",
      duration: 10,
      details: "逛完 Solamachi，18:30 押上站搭都營淺草線 2 站至淺草站（3 分鐘），A4 出口步行 5 分鐘抵達雷門。"
    }
  },
  {
    id: "lawson_oshiage",
    name: "Lawson 押上店 (第一晚宵夜)",
    englishName: "Lawson Oshiage",
    category: "food",
    lat: 35.7115,
    lng: 139.8138,
    day: 1,
    time: "21:30",
    desc: "必吃炸機跟炸熱狗，可以買回去房間吃",
    imageFolder: "Lawson 押上店",
    gmaps: "https://maps.google.com/?q=Lawson+Oshiage",
    transitInfo: {
      from: "淺草寺",
      method: "subway",
      line: "都營淺草線 (淺草 → 押上)",
      duration: 10,
      details: "淺草站搭都營淺草線回押上，出站 Lawson 就在飯店旁。"
    }
  },

  // ==================== DAY 2 (12/10 週四) — 銀座 + 東京車站 ====================
  {
    id: "bongen_coffee",
    name: "BONGEN COFFEE 盆栽咖啡 銀座",
    englishName: "BONGENCOFFEE Ginza (盆源珈琲)",
    category: "food",
    lat: 35.6711,
    lng: 139.7708,
    day: 2,
    time: "10:00",
    desc: "10:00 悠閒出門開啟銀座日。位於銀座小巷的精品咖啡店，店內擺著百年盆栽，招牌是手沖精品咖啡與濃縮拿鐵，搭配日式和菓子點心。店小人多，可能要外帶去逛。",
    imageFolder: "BONGEN COFFEE 銀座",
    gmaps: "https://maps.google.com/?q=BONGEN+COFFEE+Ginza",
    transitInfo: {
      from: "SYLA HOTEL Oshiage",
      method: "subway",
      line: "都營淺草線 (押上 → 東銀座)",
      duration: 20,
      details: "10:00 押上站搭都營淺草線直達東銀座站（7 站、13 分鐘），A7 出口步行 5 分鐘。"
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
    time: "11:15",
    desc: "東京炸豬排前三強！選用高品質林 SPF 豬肉，外皮金黃酥脆、切面粉嫩多汁。桌上有多款高級岩鹽，搭鹽吃能吃出豬肉甘甜。11:00 開店，建議 11:15 前到店排隊，不然要排 1 小時起跳。",
    imageFolder: "とんかつ檍 銀座",
    gmaps: "https://maps.google.com/?q=Tonkatsu+Aoki+Ginza+8-chome",
    transitInfo: {
      from: "BONGEN COFFEE",
      method: "walk",
      line: "徒步 (Walk 1.0km)",
      duration: 13,
      details: "沿銀座中央通往南步行約 1 公里抵達銀座 8 丁目，店在地下室。"
    }
  },
  {
    id: "uniqlo_ginza",
    name: "Uniqlo 銀座旗艦店",
    englishName: "UNIQLO Ginza (ユニクロ 銀座店)",
    category: "shopping",
    lat: 35.6717,
    lng: 139.7647,
    day: 2,
    time: "13:30",
    desc: "你們清單裡「一定要去」的點！全球最大 Uniqlo 旗艦店，12 層樓。特別聯名款、UT 客製化專區、頂樓 Uniqlo Coffee。留 1.5 ~ 2 小時慢慢挑冬裝。",
    imageFolder: "Uniqlo 銀座",
    gmaps: "https://maps.google.com/?q=UNIQLO+Ginza",
    transitInfo: {
      from: "Tonkatsu Aoki",
      method: "walk",
      line: "徒步 (Walk 400m)",
      duration: 6,
      details: "從銀座 8 丁目沿中央通往北步行 400 公尺，Uniqlo 12 層旗艦大樓在銀座 6 丁目。"
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
    time: "16:00",
    desc: "有樂町高架橋下的精緻咖啡酒吧，外帶「可麗露 Canelé」外皮酥脆、內裡溫潤，被譽為東京可麗露天花板。可以坐下喝杯咖啡休息，也可買 5 個可麗露帶著走。",
    imageFolder: "THE STAND 可麗露",
    gmaps: "https://maps.google.com/?q=THE+STAND+Yurakucho",
    transitInfo: {
      from: "Uniqlo 銀座旗艦店",
      method: "walk",
      line: "徒步 (Walk 500m)",
      duration: 7,
      details: "從 Uniqlo 銀座往北 500 公尺，接近有樂町站高架橋下。"
    }
  },
  {
    id: "hanayama_udon",
    name: "五代目 花山烏冬 銀座店",
    englishName: "Godaime Hanayama Udon Ginza (五代目 花山うどん)",
    category: "food",
    lat: 35.6699,
    lng: 139.7691,
    day: 2,
    time: "17:30",
    desc: "來自群馬的百年老店，招牌「鬼紐川寬烏龍麵」寬達 5 公分，麵條 Q 彈超有嚼勁，搭特製芝麻沾醬。17:30 傍晚場開店，避開午餐排隊。是烏龍麵愛好者的朝聖店。",
    imageFolder: "花山烏冬 銀座",
    gmaps: "https://maps.google.com/?q=Godaime+Hanayama+Udon+Ginza",
    transitInfo: {
      from: "THE STAND 可麗露",
      method: "walk",
      line: "徒步 (Walk 550m)",
      duration: 7,
      details: "從有樂町 THE STAND 走回銀座 4 丁目方向約 550 公尺。"
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
    time: "19:30",
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

  // ==================== DAY 3 (12/11 週五, 平日) — 代代木八幡 + 新宿 ====================
  {
    id: "path_yoyogi",
    name: "PATH 荷蘭鬆餅早餐 代代木八幡",
    englishName: "PATH (パス) Yoyogi-Hachiman",
    category: "food",
    lat: 35.6688,
    lng: 139.6899,
    day: 3,
    time: "10:00",
    desc: "隱身代代木八幡的法式小餐館，招牌「Dutch Baby 荷蘭烤鬆餅」現點現烤，鬆軟餅皮上鋪滿生火腿、布拉塔起司、淋楓糖。08:00 開店、14:00 打烊，平日早去更容易有位。5 人可能要拆桌坐。",
    imageFolder: "PATH 荷蘭鬆餅",
    gmaps: "https://maps.google.com/?q=PATH+Yoyogihachiman",
    transitInfo: {
      from: "SYLA HOTEL Oshiage",
      method: "subway",
      line: "半藏門線 → 千代田線",
      duration: 40,
      details: "09:00 押上站搭半藏門線至表參道，轉千代田線至代代木公園站，八幡口步行 3 分鐘。"
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
    desc: "**清單上「一定要去」的點！** 新宿最狂運動用品大樓，地下 1 至 8 樓共 9 層。**特意排在平日(週五)來逛，避開週末可怕的結帳與試穿人潮！**",
    imageFolder: "Alpen Tokyo",
    gmaps: "https://maps.google.com/?q=Alpen+Tokyo+Shinjuku",
    transitInfo: {
      from: "PATH 荷蘭鬆餅",
      method: "subway",
      line: "小田急線 / 千代田線 (代代木八幡 → 新宿)",
      duration: 15,
      details: "代代木八幡站搭小田急線 2 站至新宿站（4 分鐘），東口步行 4 分鐘至新宿三丁目方向。"
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
    desc: "夢幻的主題專賣店「まじかるちいかわストア」！位於新宿 Marui 本館 (新宿丸井 1F)。全店以魔法少女風格打造，是吉伊卡哇粉必朝聖之地。**安排在平日前來，比起週末更能輕鬆進店與選購！** (熱門時段需注意是否有現場整理券或預約制)",
    imageFolder: "魔法少女吉伊卡哇 新宿",
    gmaps: "https://maps.google.com/?q=Shinjuku+Marui+Main+Building",
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
    desc: "紐約潮流漢堡東京店。你清單上的『shake shake』就是這家！新宿南口小田急塔 2F，經典 ShackBurger + 東京限定黑芝麻奶昔，平日午段內用位子更充裕。",
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
    id: "azuki_to_kouri",
    name: "あずきとこおり 精緻刨冰",
    englishName: "Azuki to Kouri (あずきとこおり)",
    category: "food",
    lat: 35.6823,
    lng: 139.6972,
    day: 3,
    time: "16:30",
    desc: "米其林二星 Florilège 前甜點主廚開的預約制刨冰店。平日時段預約更容易成功！**強烈建議一週前官網預約 5 位**。",
    imageFolder: "あずきとこおり 刨冰",
    gmaps: "https://maps.google.com/?q=Azuki+to+Kouri",
    transitInfo: {
      from: "Shake Shack 新宿",
      method: "walk",
      line: "徒步 (Walk 1.2km)",
      duration: 15,
      details: "從新宿南口沿代代木方向往東南步行約 1.2 公里至千駄谷區。"
    }
  },
  {
    id: "omoide_yokocho",
    name: "新宿回憶橫丁 居酒屋",
    englishName: "Omoide Yokocho (思い出横丁)",
    category: "food",
    lat: 35.6931,
    lng: 139.6997,
    day: 3,
    time: "19:30",
    desc: "昭和風情極濃的窄巷居酒屋群！週五夜晚正是下班上班族聚會氣氛最棒的時候，炭火烤雞肉串 + Highball 收尾大男生日最對味。想跑酒吧餐後再走 5 分鐘到黃金街分組體驗。",
    imageFolder: "新宿回憶橫丁",
    gmaps: "https://maps.google.com/?q=Omoide+Yokocho+Shinjuku",
    transitInfo: {
      from: "あずきとこおり",
      method: "walk",
      line: "徒步 (Walk 1.0km) 回新宿西口",
      duration: 13,
      details: "從千駄谷步行返回新宿西口出站，思い出橫丁就在西口斜對面。玩到 24:00 前趕末班車押上線回飯店。"
    }
  },

  // ==================== DAY 4 (12/12 週六) — 青山 / 原宿 / 澀谷 / 表參道 ====================
  {
    id: "cafe_kitsune_aoyama",
    name: "Café Kitsuné 青山",
    englishName: "Café Kitsuné Aoyama (カフェ キツネ)",
    category: "food",
    lat: 35.6648,
    lng: 139.7153,
    day: 4,
    time: "10:30",
    desc: "法國時尚品牌 Maison Kitsuné 旗下咖啡廳，木造和風竹林裝潢極有質感。點一杯拿鐵配狐狸餅乾，開啟表參道/青山散步日。",
    imageFolder: "Cafe Kitsune 青山",
    gmaps: "https://maps.google.com/?q=Cafe+Kitsune+Aoyama",
    transitInfo: {
      from: "SYLA HOTEL Oshiage",
      method: "subway",
      line: "半藏門線 (押上 → 表參道)",
      duration: 35,
      details: "10:00 押上站搭半藏門線直達表參道站（10 站、25 分鐘），B4 出口步行 6 分鐘。"
    }
  },
  {
    id: "yaiyai_okonomiyaki",
    name: "原宿大阪燒 やいやい",
    englishName: "Harajuku Okonomiyaki Yai-yai (原宿お好み焼き やいやい)",
    category: "food",
    lat: 35.6670,
    lng: 139.7057,
    day: 4,
    time: "13:00",
    desc: "你清單上的『大阪燒』實際位置！原宿裏通鐵板燒老店，客人自己在鐵板前煎大阪燒、廣島燒、文字燒、炒麵。5 個人圍鐵板一起玩最好玩。",
    imageFolder: "原宿大阪燒 やいやい",
    gmaps: "https://maps.app.goo.gl/Gh6o8XyB8696pZx78",
    transitInfo: {
      from: "Café Kitsuné 青山",
      method: "walk",
      line: "徒步 (Walk 1.3km 穿過表參道)",
      duration: 17,
      details: "從 Café Kitsuné 往西沿表參道方向漫步，穿過原宿商圈至裏原宿。"
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
    desc: "位於原宿 Kiddy Land 1 樓的旗艦級吉伊卡哇專賣店！周邊款式極齊全，還有獨家的打卡牆與原宿限定紀念品。吃完原宿大阪燒順路逛極流暢。",
    imageFolder: "Chiikawa 原宿店",
    gmaps: "https://maps.google.com/?q=Kiddy+Land+Harajuku",
    transitInfo: {
      from: "原宿大阪燒 やいやい",
      method: "walk",
      line: "徒步 (Walk 250m)",
      duration: 3,
      details: "從裏原宿やいやい大阪燒出來往明治通り/表參道方向步行 3 分鐘至 Kiddy Land 原宿店 1F。"
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
    desc: "招牌「水果千層蛋糕 Mille-crepes」層次分明，鮮草莓、奇異果、香蕉、哈密瓜配鮮奶油與可麗餅皮，是東京女生（和五個大男生）都愛的下午茶。逛完 Hikarie 直接半藏門線回押上超方便。",
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
    id: "yamawarau_omotesando",
    name: "山笑ふ 壽喜燒 / 涮涮鍋 表參道",
    englishName: "Sukiyaki Shabushabu Yamawarau (山笑ふ 表参道店)",
    category: "food",
    lat: 35.6675,
    lng: 139.7110,
    day: 4,
    time: "19:00",
    desc: "主打「一人一鍋」的高質感壽喜燒/涮涮鍋，圓弧吧台各人獨立銅鍋，選頂級山形和牛。⚠️ **老闆不吃牛可點豬肉套餐（黑豚 or SPF 豚，一樣鮮嫩）**。強烈建議一週前 Tabelog 或電話預約 5 人吧台位。",
    imageFolder: "山笑ふ 壽喜燒",
    gmaps: "https://maps.google.com/?q=Yamawarau+Omotesando",
    transitInfo: {
      from: "HARBS 澀谷 Hikarie",
      method: "subway",
      line: "東京 Metro 銀座線 (澀谷 → 表參道)",
      duration: 10,
      details: "澀谷站搭銀座線 1 站至表參道站，A4 出口步行 4 分鐘。晚餐結束搭半藏門線直達押上。"
    }
  },

  // ==================== DAY 5 (12/13 週日) — 清澄白河 + 淺草 + 入谷 + 上野 ====================
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
      duration: 12,
      details: "09:45 押上站搭半藏門線直達清澄白河站（3 站、6 分鐘），B2 出口步行 5 分鐘。"
    }
  },
  {
    id: "takoyaki_asakusa",
    name: "淺草章魚燒 蛸兄弟",
    englishName: "Asakusa Takoyaki Tako Kyodai (浅草蛸たこ×ころも兄弟)",
    category: "food",
    lat: 35.7118,
    lng: 139.7947,
    day: 5,
    time: "12:00",
    desc: "淺草 1-32-11 的章魚燒新店，招牌是「章魚燒仙貝三明治」— 兩顆現烤章魚燒夾在章魚燒仙貝之間淋醬 & 美乃滋，創意十足！仲見世通逛完順路吃。",
    imageFolder: "淺草章魚燒 蛸兄弟",
    gmaps: "https://maps.google.com/?q=浅草蛸たこ×ころも兄弟",
    transitInfo: {
      from: "PATISSERIE TEN&",
      method: "subway",
      line: "半藏門線 → 銀座線 (清澄白河 → 淺草)",
      duration: 25,
      details: "清澄白河搭半藏門線回押上，轉東京 Metro 銀座線至淺草站；或搭大江戶線至藏前轉都營淺草線至淺草。"
    }
  },
  {
    id: "umezono_daifuku",
    name: "梅園 淺草本店 (大福和菓子)",
    englishName: "Umezono Asakusa Honten (梅園 浅草本店)",
    category: "food",
    lat: 35.7145,
    lng: 139.7959,
    day: 5,
    time: "12:30",
    desc: "1854 年創業、170 年歷史的和菓子老店！你清單的『大福』就靠這家。招牌粟善哉、麻糬紅豆湯、季節限定豆大福，是仲見世通必吃甜點。",
    imageFolder: "梅園 淺草",
    gmaps: "https://maps.google.com/?q=Umezono+Asakusa",
    transitInfo: {
      from: "章魚燒 蛸兄弟",
      method: "walk",
      line: "徒步 (Walk 200m)",
      duration: 3,
      details: "沿仲見世通往北 200 公尺，梅園就在仲見世通西側。"
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
    desc: "入谷小巷內的美式復古 diner，粗絞牛肉漢堡排鐵板現壓、爆汁淋滿起司醬。美式搖滾裝潢很有味道。⚠️ **不吃牛的老闆可點雞肉漢堡或熱狗替代**。",
    imageFolder: "American Diner Andra",
    gmaps: "https://maps.app.goo.gl/uhuaHdVNmjzKpiri8",
    transitInfo: {
      from: "梅園 淺草本店",
      method: "subway",
      line: "東京 Metro 日比谷線 (淺草 → 入谷)",
      duration: 10,
      details: "從淺草站搭日比谷線 2 站至入谷站（3 分鐘），出站步行 5 分鐘。"
    }
  },
  {
    id: "cuiyun_ueno",
    name: "水煮魚 翠雲 上野店",
    englishName: "Cuiyun Ueno (翠雲 上野店)",
    category: "food",
    lat: 35.7084,
    lng: 139.7735,
    day: 5,
    time: "18:30",
    desc: "東京超有名的精緻川菜館，招牌『水煮魚』魚肉滑嫩、紅油花椒噴香，麻辣過癮。⚠️ **老闆不吃牛沒問題，主打魚料理跟豬料理**。5 人聚餐點大盤菜共享超划算。",
    imageFolder: "翠雲 上野",
    gmaps: "https://maps.app.goo.gl/vJZ7t3rMbehgdnHDA",
    transitInfo: {
      from: "American Diner Andra",
      method: "walk",
      line: "徒步 (Walk 900m) 至上野",
      duration: 12,
      details: "從入谷沿昭和通往南走約 900 公尺至上野站不忍口一帶。"
    }
  },
  {
    id: "otafuku_oden",
    name: "淺草大多福 關東煮",
    englishName: "Asakusa Oden Otafuku (浅草 大多福)",
    category: "food",
    lat: 35.7196,
    lng: 139.7915,
    day: 5,
    time: "21:00",
    desc: "1915 年創業的東京最古老關東煮名店，滿足你清單上的『關東煮』。湯頭每日慢火熬煮，30 多種食材燉煮入味，冬天吃一碗超暖胃。⚠️ 單價偏高（人均 ¥5,000），建議先電話預約。",
    imageFolder: "大多福 關東煮",
    gmaps: "https://maps.google.com/?q=Asakusa+Oden+Otafuku",
    transitInfo: {
      from: "翠雲 上野店",
      method: "subway",
      line: "東京 Metro 銀座線 (上野 → 淺草)",
      duration: 15,
      details: "上野站搭銀座線 3 站至淺草（5 分鐘），出站往北步行 8 分鐘至千束大多福。吃完直接叫計程車回押上約 ¥1,200。"
    }
  },

  // ==================== DAY 6 (12/14 週一) — 打包 + 回程 ====================
  // 無排定行程 — 09:00 起床打包，12:30 押上站搭京成 Access 特急直達成田機場

  // ==================== 吉伊卡哇專賣店 (Chiikawa Stores) ====================
  {
    id: "chiikawa_solamachi",
    name: "Chiikawa Land 晴空塔店 (Solamachi)",
    englishName: "Chiikawa Land Tokyo Solamachi (ちいかわらんど)",
    category: "shopping",
    lat: 35.7100,
    lng: 139.8120,
    day: 1,
    time: "18:00",
    desc: "去晃一下晴空塔，然後我要買及掰卡哇",
    imageFolder: "Chiikawa 晴空塔店",
    gmaps: "https://maps.google.com/?q=Chiikawa+Land+Tokyo+Solamachi",
    transitInfo: {
      from: "SYLA HOTEL Oshiage",
      method: "walk",
      line: "徒步 (Walk 300m)",
      duration: 4,
      details: "從飯店步行 3 分鐘直達 Tokyo Solamachi 3 樓 East Yard 12 番地。"
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
    time: "19:00",
    desc: "位於東京車站一番街 B1F「東京動漫人物街 (Tokyo Character Street)」內的超人氣吉伊卡哇專賣店。有許多東京車站限定的站長系列、鐵道主題吉伊卡哇周邊，適合在 D2 買伴手禮時一併血拼！",
    imageFolder: "Chiikawa 東京車站店",
    gmaps: "https://maps.google.com/?q=Chiikawa+Land+TOKYO+Station",
    transitInfo: {
      from: "花山烏冬",
      method: "subway",
      line: "東京 Metro 丸之內線 (銀座 → 東京)",
      duration: 8,
      details: "銀座站搭丸之內線 1 站至東京站，出站直通東京車站一番街 B1F 角色街。"
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
    id: "meiji_jingu",
    name: "明治神宮 (推薦景點)",
    englishName: "Meiji Jingu Shrine",
    category: "sightseeing",
    lat: 35.6764,
    lng: 139.6993,
    day: null,
    time: null,
    desc: "🌟 **推薦候補**：東京市中心的巨型森林神社，鳥居下拍照極美。若 D4 想在原宿多留 1 小時，走 15 分鐘就到，五人拍團體照的絕佳場所。",
    imageFolder: "明治神宮",
    gmaps: "https://maps.google.com/?q=Meiji+Jingu",
    transitInfo: null
  },
  {
    id: "akihabara",
    name: "秋葉原電器街 (推薦景點)",
    englishName: "Akihabara Electric Town",
    category: "shopping",
    lat: 35.6984,
    lng: 139.7731,
    day: null,
    time: null,
    desc: "🌟 **推薦候補**：你們興趣裡的動漫電玩男子聖地！Yodobashi Camera 9 層、GiGO 遊戲中心、Super Potato 二手電玩、扭蛋機殿堂。若想加碼可用半天，離 D5 上野只有 2 站。",
    imageFolder: "秋葉原",
    gmaps: "https://maps.google.com/?q=Akihabara+Electric+Town",
    transitInfo: null
  },
  {
    id: "tokyo_skytree",
    name: "東京晴空塔 天望展望台 (推薦景點)",
    englishName: "Tokyo Skytree Tembo Deck",
    category: "sightseeing",
    lat: 35.7101,
    lng: 139.8107,
    day: null,
    time: null,
    desc: "🌟 **推薦候補**：住飯店旁邊，全世界最高的獨立式電波塔（634m）！天望甲板 350m 高，看整個東京 + 富士山。5 分鐘走到，任何早上有空都可以上去。假日建議 9:00 開場前排隊或買 Fast Ticket。",
    imageFolder: "晴空塔展望台",
    gmaps: "https://maps.google.com/?q=Tokyo+Skytree",
    transitInfo: null
  },
];
