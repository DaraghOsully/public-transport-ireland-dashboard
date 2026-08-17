import { mkdir, writeFile } from 'node:fs/promises';

const sources = {
  THA25: 'https://ws.cso.ie/public/api.restful/PxStat.Data.Cube_API.ReadDataset/THA25/CSV/1.0/en',
  TII03: 'https://ws.cso.ie/public/api.restful/PxStat.Data.Cube_API.ReadDataset/TII03/CSV/1.0/en'
};

function inspect(csv) {
  const weeks = [...csv.matchAll(/(20\d{2})W(\d{1,2})/g)].map(m => ({ year: Number(m[1]), week: Number(m[2]) }));
  if (!weeks.length) throw new Error('No ISO week observations found in downloaded CSV');
  return weeks.reduce((latest, item) => item.year > latest.year || (item.year === latest.year && item.week > latest.week) ? item : latest);
}

await mkdir('public', { recursive: true });
const meta = { checkedAt: new Date().toISOString(), sources: {} };

for (const [name, url] of Object.entries(sources)) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${name} download failed: HTTP ${response.status}`);
  const csv = await response.text();
  if (csv.length < 1000) throw new Error(`${name} download looks unexpectedly small`);
  await writeFile(`${name}.csv`, csv);
  const latest = inspect(csv);
  meta.sources[name] = { url, latest };
}

await writeFile('public/data-meta.json', JSON.stringify(meta, null, 2) + '\n');
console.log(JSON.stringify(meta, null, 2));
