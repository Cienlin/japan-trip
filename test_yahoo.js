const https = require('https');

function testYahoo(query) {
  console.log(`Searching Yahoo Images for: "${query}"`);
  const url = `https://images.search.yahoo.com/search/images?p=${encodeURIComponent(query)}`;
  
  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5'
    }
  };

  https.get(url, options, (res) => {
    console.log('HTTP Status:', res.statusCode);
    let html = '';
    res.on('data', chunk => html += chunk);
    res.on('end', () => {
      // Look for "imgurl":"..." or similar JSON properties inside the HTML
      // Yahoo Image Search embeds metadata inside a JSON object or data attributes
      const regex = /"imgurl":"([^"]+)"/g;
      let match;
      const urls = [];
      while ((match = regex.exec(html)) !== null && urls.length < 5) {
        // Decode escaped slashes
        const imgUrl = match[1].replace(/\\/g, '');
        urls.push(imgUrl);
      }
      
      console.log('Found URLs:', urls);
    });
  }).on('error', (err) => {
    console.error('Request error:', err.message);
  });
}

testYahoo('五代目 花山うどん 銀座店 鬼釜');
