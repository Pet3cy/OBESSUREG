import https from 'https';

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  const board = await fetchHtml('https://obessu.org/structure/board/');
  const secretariat = await fetchHtml('https://obessu.org/structure/secretariat/');
  
  const extractRoles = (html) => {
    const blockRegex = /<div[^>]*class="[^"]*wd-info-box[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/g;
    let match;
    while ((match = blockRegex.exec(html)) !== null) {
      const block = match[1];
      const titleMatch = block.match(/<h[34][^>]*>(.*?)<\/h[34]>/);
      if (titleMatch) {
         const name = titleMatch[1].replace(/<[^>]+>/g, '').trim();
         // role is sometimes in <span class="info-box-subtitle"> or something
         const pMatch = block.match(/<div class="info-box-inner">([\s\S]*?)<\/div>/);
         
         const cleanText = block.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
         console.log(`- ${name}: ${cleanText}`);
      }
    }
  }
  
  console.log("BOARD:");
  extractRoles(board);
  
  console.log("SECRETARIAT:");
  extractRoles(secretariat);
}
run();
