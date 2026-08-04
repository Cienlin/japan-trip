const fs = require('fs');
const path = require('path');
const https = require('https');

const IMAGES_DIR = path.join(__dirname, 'images');

// Ensure images directory exists
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR);
}

// Curated list of high-quality Unsplash image IDs for the Tokyo trip locations
const imagesToDownload = [
  { filename: 'hotel_1.jpg', id: 'photo-1540959733332-eab4deceeaf7' }, // Tokyo Night / Skytree
  { filename: 'hotel_2.jpg', id: 'photo-1590490360182-c33d57733427' }, // Modern Hotel Room
  { filename: 'tonkatsu_1.jpg', id: 'photo-1626082927389-6cd097cdc6ec' }, // Fried Pork Cutlet
  { filename: 'tonkatsu_2.jpg', id: 'photo-1546964124-0cce460f38ef' }, // Japanese crispy cutlet style
  { filename: 'canele_1.jpg', id: 'photo-1607958996333-41aef7caefaa' }, // Canelés
  { filename: 'puff_1.jpg', id: 'photo-1557308536-ee37e8d69fae' }, // Puffs / Sweets
  { filename: 'burger_1.jpg', id: 'photo-1568901346375-23c9450c58cd' }, // Juicy Burger
  { filename: 'sports_1.jpg', id: 'photo-1517649763962-0c623066013b' }, // Sports Equipment Store
  { filename: 'sukiyaki_1.jpg', id: 'photo-1552611052-33e04de081de' }, // Japanese Hot Pot
  { filename: 'sukiyaki_2.jpg', id: 'photo-1590137876181-2a5a7e34030a' }, // Shabu Beef
  { filename: 'kitsune_1.jpg', id: 'photo-1501339847302-ac426a4a7cbb' }, // Cozy Cafe
  { filename: 'bongen_1.jpg', id: 'photo-1447933601403-0c6688de566e' }, // Bonsai / Bonsai style coffee
  { filename: 'harbs_1.jpg', id: 'photo-1578985545062-69928b1d9587' }, // Fruit Layer Cake / Mille Crepes
  { filename: 'udon_1.jpg', id: 'photo-1618843479313-40f8afb4b4d8' }, // Hot Udon bowl
  { filename: 'ice_1.jpg', id: 'photo-1516685018646-549198525c1b' }, // Japanese Shaved Ice
  { filename: 'lawson_1.jpg', id: 'photo-1569058242253-92a9c755a0ec' }, // Crispy Fried Chicken
  { filename: 'uniqlo_1.jpg', id: 'photo-1483985988355-763728e1935b' }, // Ginza/Tokyo Shopping
  { filename: 'cuiyun_1.jpg', id: 'photo-1563245372-f21724e3856d' }, // Spicy Sichuan fish / Chilli food
  { filename: 'path_1.jpg', id: 'photo-1567620905732-2d1ec7ab7445' }, // Dutch Pancake
  { filename: 'sensoji_1.jpg', id: 'photo-1493976040374-85c8e12f0c0e' }, // Pagoda / Sensoji Temple
  { filename: 'sensoji_2.jpg', id: 'photo-1503899036084-c55cdd92da26' }, // Tokyo street night
  { filename: 'okonomiyaki_1.jpg', id: 'photo-1617196034183-421b4917c92d' }, // Teppanyaki / Okonomiyaki
  { filename: 'oden_1.jpg', id: 'photo-1547592180-85f173990554' }, // Oden Soup
  { filename: 'izakaya_1.jpg', id: 'photo-1579871494447-9811cf80d66c' }, // Izakaya Lantern Alley
  { filename: 'subway_1.jpg', id: 'photo-1542640244-7e672d6cef4e' } // Tokyo Metro Train
];

async function downloadImage({ filename, id }) {
  const url = `https://images.unsplash.com/${id}?w=800&auto=format&fit=crop&q=80`;
  const dest = path.join(IMAGES_DIR, filename);

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${filename}: HTTP ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${filename} successfully.`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log('Starting downloading images. Please wait...');
  for (const img of imagesToDownload) {
    try {
      await downloadImage(img);
      // Add a small delay between requests to avoid rate limits
      await new Promise(r => setTimeout(r, 200));
    } catch (error) {
      console.error(`Error downloading ${img.filename}:`, error.message);
    }
  }
  console.log('All image downloads completed!');
}

main();
