const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3005;

http.createServer((req, res) => {
  // Decode URL in case of Chinese characters or spaces
  const decodedUrl = decodeURIComponent(req.url);
  let filePath = '.' + decodedUrl;
  if (filePath === './' || filePath === './index.html') {
    filePath = './index.html';
  }

  // Prevent directory traversal
  filePath = path.normalize(filePath);
  if (filePath.includes('..') || filePath.startsWith('/') || filePath.startsWith('\\')) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const extname = path.extname(filePath);
  let contentType = 'text/html';
  switch (extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.jpg':
    case '.jpeg':
      contentType = 'image/jpeg';
      break;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File Not Found');
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
}).listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
