// Downloads freely licensed photos of real Tanzanian places from Wikimedia Commons, resizes them
// to WebP (640px and 1280px wide) into public/photos/, and writes public/photos/credits.json with
// the author, licence and source page of each one. Re-run to refresh: node scripts/import-photos.mjs
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const OUT = path.resolve(process.env.PHOTOS_OUT || 'public/photos');
const UA = 'Mozilla/5.0 (compatible; photo-import-script/1.0)';
const OK_LICENCE = /^(cc0|public domain|pd|cc by(-sa)? [1-4]\.0|cc by(-sa)? 2\.5)/i;

// slot -> Commons search. File titles are matched against `must` to keep results on-subject.
const SLOTS = {
  'serengeti-lions': { q: 'Serengeti lions kopje', must: /serengeti/i },
  'serengeti-migration': { q: 'Serengeti wildebeest migration', must: /wildebeest|migration/i },
  'serengeti-balloon': { q: 'Serengeti hot air balloon', must: /balloon/i },
  'serengeti-plains': { q: 'Serengeti plains acacia', must: /serengeti/i },
  'ngorongoro-crater': { q: 'Ngorongoro crater view', must: /ngorongoro/i },
  'ngorongoro-elephant': { q: 'Ngorongoro elephant', must: /elephant/i },
  'ngorongoro-zebra': { q: 'Ngorongoro zebra', must: /zebra/i },
  'kilimanjaro-summit': { q: 'Mount Kilimanjaro', must: /kilimanjaro|kibo/i },
  'kilimanjaro-trek': { q: 'Kilimanjaro Lava Tower', must: /kilimanjaro|lava tower|shira|lemosho/i },
  'kilimanjaro-barranco': { q: 'Kilimanjaro Barranco', must: /barranco|kilimanjaro/i },
  'zanzibar-dhow': { q: 'Zanzibar dhow', must: /dhow/i },
  'zanzibar-stonetown': { q: 'Stone Town Zanzibar', must: /stone town/i },
  'zanzibar-beach': { q: 'Zanzibar beach Paje', must: /zanzibar|paje|nungwi|kendwa|jambiani/i },
  'eyasi-lake': { q: 'Lake Eyasi', must: /eyasi/i },
  'eyasi-baobab': { q: 'Tarangire baobab', must: /baobab|tarangire/i },
  'eyasi-rift': { q: 'Great Rift Valley Tanzania escarpment', must: /rift|manyara|escarpment/i },
  'mafia-whaleshark': { q: 'whale shark', must: /whale shark|rhincodon/i },
  'mafia-reef': { q: 'Mafia Island', must: /mafia/i },
  'mafia-sandbank': { q: 'Zanzibar sandbank', must: /sandbank|sand bank|island/i },
  'city-dar': { q: 'Dar es Salaam skyline', must: /dar es salaam/i },
  'culture-maasai': { q: 'Maasai village Tanzania', must: /maasai|masai/i }
};

const api = async (params) => {
  const url = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({ format: 'json', origin: '*', ...params });
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) return res.json();
    await new Promise((r) => setTimeout(r, 20000 * (attempt + 1)));
  }
  throw new Error('Commons API failed for ' + params.gsrsearch);
};

const strip = (html) => String(html || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

fs.mkdirSync(OUT, { recursive: true });
const credits = fs.existsSync(path.join(OUT, 'credits.json')) ? JSON.parse(fs.readFileSync(path.join(OUT, 'credits.json'), 'utf8')) : {};
const only = process.argv.slice(2);

for (const [slot, { q, must }] of Object.entries(SLOTS)) {
  if (only.length && !only.includes(slot)) continue;
  if (!only.length && credits[slot] && fs.existsSync(path.join(OUT, `${slot}-1280.webp`))) continue;
  const data = await api({
    action: 'query', generator: 'search', gsrsearch: `${q} filetype:bitmap`, gsrnamespace: '6', gsrlimit: '25',
    prop: 'imageinfo', iiprop: 'url|size|extmetadata|mime', iiurlwidth: '1600'
  });
  const pages = Object.values(data.query?.pages || {}).sort((a, b) => a.index - b.index);
  let chosen = null;
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    if (!ii || !/jpeg|png/.test(ii.mime) || ii.width < 1400 || ii.width < ii.height) continue;
    if (!must.test(p.title)) continue;
    const md = ii.extmetadata || {};
    const licence = strip(md.LicenseShortName?.value);
    if (!OK_LICENCE.test(licence)) continue;
    chosen = { p, ii, licence, author: strip(md.Artist?.value) || 'Unknown', licenceUrl: md.LicenseUrl?.value || '' };
    break;
  }
  if (!chosen) { console.log(`MISS ${slot}`); continue; }
  const img = await fetch(chosen.ii.thumburl || chosen.ii.url, { headers: { 'User-Agent': UA } });
  if (!img.ok) { console.log(`DOWNLOAD FAILED ${slot} ${img.status}`); continue; }
  const buf = Buffer.from(await img.arrayBuffer());
  for (const w of [640, 1280]) {
    await sharp(buf).rotate().resize({ width: w, height: Math.round(w * 0.66), fit: 'cover', position: 'attention' })
      .webp({ quality: w === 640 ? 62 : 68 }).toFile(path.join(OUT, `${slot}-${w}.webp`));
  }
  credits[slot] = {
    title: chosen.p.title.replace(/^File:/, '').replace(/\.[a-z]+$/i, ''),
    author: chosen.author.slice(0, 120),
    licence: chosen.licence,
    licenceUrl: chosen.licenceUrl,
    source: chosen.ii.descriptionurl
  };
  console.log(`ok   ${slot.padEnd(22)} ${chosen.licence.padEnd(14)} ${credits[slot].title.slice(0, 60)}`);
  fs.writeFileSync(path.join(OUT, 'credits.json'), JSON.stringify(credits, null, 2));
  await new Promise((r) => setTimeout(r, 4000));
}
