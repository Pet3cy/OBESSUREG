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
  
  // Let's use a very simple regex to capture text near these names
  const names = ['Alessandro Di Miceli', 'Ívar Máni Hrannarsson', 'Lauren Bond', 'Elodie Böhling', 'Kacper Bogalecki', 'Rui Teixeira', 'Raquel Moreno Beneit', 'Amira Bakr', 'Yolanda Sangucho', 'Panagiotis Chatzimichail', 'Daniele Sabato', 'Francesca Osima', 'Paolo Ferraresi', 'Riccardo Ferraresi'];
  
  const html = board + secretariat;
  for (const name of names) {
    const idx = html.indexOf(name);
    if (idx !== -1) {
      // get 500 characters after the name
      const snippet = html.substring(idx, idx + 500);
      const cleanSnippet = snippet.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      console.log(`\nNAME: ${name}`);
      console.log(`SNIPPET: ${cleanSnippet}`);
    }
  }
}
run();
