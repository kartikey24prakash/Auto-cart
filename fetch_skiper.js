import fs from 'fs/promises';
import https from 'https';
import path from 'path';

const urls = [
  'https://skiper-ui.com/registry/skiper26.json',
  'https://skiper-ui.com/registry/skiper37.json',
  'https://skiper-ui.com/registry/skiper61.json',
  'https://skiper-ui.com/registry/skiper58.json',
  'https://skiper-ui.com/registry/skiper39.json',
  'https://skiper-ui.com/registry/skiper19.json',
  'https://skiper-ui.com/registry/skiper89.json'
];

const fetchJson = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
};

async function run() {
  await fs.mkdir('frontend/src/components/ui/skiper-ui', { recursive: true });
  for (const url of urls) {
    console.log('Fetching', url);
    const data = await fetchJson(url);
    if (data.files && data.files.length > 0) {
      for (const file of data.files) {
        let content = file.content;
        let target = file.target.replace('components/ui/skiper-ui//', '');
        if (target.endsWith('.tsx')) target = target.replace('.tsx', '.jsx');
        if (target.endsWith('.ts')) target = target.replace('.ts', '.js');
        const dest = path.join('frontend/src/components/ui/skiper-ui', target);
        await fs.writeFile(dest, content);
        console.log('Saved', dest);
      }
    }
  }
}
run();
