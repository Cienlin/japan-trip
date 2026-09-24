// 掃描 images/<地點資料夾>/ 產生 image-manifest.js
// 用法:node tools/sync-images.js
//
// - 每個地點的資料夾名稱由 data.js 的 imageFolder 指定
// - 只收以數字命名的圖片 (1.jpg、2.png...),依數字排序;第 1 張是卡片封面
// - 網址附上檔案內容指紋 (?v=),同檔名換成新照片時手機也會重新下載
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const IMAGE_DIR = path.join(ROOT, "images");
const OUTPUT = path.join(ROOT, "image-manifest.js");
const IMAGE_FILE = /^(\d+)\.(jpe?g|png|webp|gif)$/i;
const MAX_SIZE_KB = 500;

const dataSrc = fs.readFileSync(path.join(ROOT, "data.js"), "utf8");
const { PLACES } = new Function(`${dataSrc}; return { PLACES };`)();

const manifest = {};
const warnings = [];
const usedFolders = new Set();

for (const place of PLACES) {
  if (!place.imageFolder) {
    warnings.push(`data.js 的「${place.name}」沒有設定 imageFolder`);
    continue;
  }
  usedFolders.add(place.imageFolder);

  const dir = path.join(IMAGE_DIR, place.imageFolder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    warnings.push(`已建立資料夾(目前沒有圖片):images/${place.imageFolder}`);
  }

  const entries = fs.readdirSync(dir).filter((f) => !f.startsWith("."));
  const images = entries.filter((f) => IMAGE_FILE.test(f));
  entries
    .filter((f) => !IMAGE_FILE.test(f))
    .forEach((f) => warnings.push(`略過(檔名不是數字):images/${place.imageFolder}/${f}`));

  images.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  const numbers = images.map((f) => parseInt(f, 10));
  if (new Set(numbers).size !== numbers.length) {
    warnings.push(`編號重複(例如 1.jpg 和 1.png),順序可能不如預期:images/${place.imageFolder}`);
  }
  if (images.length === 0) {
    warnings.push(`沒有圖片(會顯示預設圖):images/${place.imageFolder}`);
  }

  manifest[place.id] = images.map((f) => {
    const content = fs.readFileSync(path.join(dir, f));
    const sizeKb = Math.round(content.length / 1024);
    if (sizeKb > MAX_SIZE_KB) {
      warnings.push(`檔案偏大 ${sizeKb}KB(建議寬度縮到 1200px):images/${place.imageFolder}/${f}`);
    }
    const hash = crypto.createHash("md5").update(content).digest("hex").slice(0, 8);
    return `${place.imageFolder}/${f}?v=${hash}`;
  });
}

for (const entry of fs.readdirSync(IMAGE_DIR, { withFileTypes: true })) {
  if (entry.isDirectory() && !usedFolders.has(entry.name)) {
    warnings.push(`這個資料夾沒有對應的地點,不會顯示:images/${entry.name}`);
  }
}

const body = Object.entries(manifest)
  .map(([id, list]) => `  ${JSON.stringify(id)}: ${JSON.stringify(list)}`)
  .join(",\n");
fs.writeFileSync(
  OUTPUT,
  "// 自動產生,請勿手動修改。更新方式:node tools/sync-images.js\n" +
  "// 每個地點的圖片 = images/<data.js 的 imageFolder>/ 裡以數字命名的檔案,依數字排序\n" +
  `const PLACE_IMAGES = {\n${body}\n};\n`
);

const total = Object.values(manifest).reduce((n, list) => n + list.length, 0);
console.log(`已產生 image-manifest.js:${Object.keys(manifest).length} 個地點、${total} 張圖片`);
if (warnings.length) {
  console.log(`\n注意 (${warnings.length}):`);
  warnings.forEach((w) => console.log(`  - ${w}`));
}
