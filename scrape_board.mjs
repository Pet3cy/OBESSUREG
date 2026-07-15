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
  
  // console.log(board.slice(0, 1000));
  
  // Let's use regex to extract some interesting blocks
  // Looking for <h3 ...> Name </h3> and <span ...> Role </span> or similar
  const h3Regex = /<h[34][^>]*>(.*?)<\/h[34]>/g;
  const pRegex = /<p[^>]*>(.*?)<\/p>/g;
  
  console.log("BOARD H3s:");
  let match;
  while ((match = h3Regex.exec(board)) !== null) {
    if(match[1].length < 40) console.log(match[1].replace(/<[^>]+>/g, '').trim());
  }
  
  console.log("SECRETARIAT H3s:");
  while ((match = h3Regex.exec(secretariat)) !== null) {
    if(match[1].length < 40) console.log(match[1].replace(/<[^>]+>/g, '').trim());
  }
}
run();
