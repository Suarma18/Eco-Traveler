import fs from 'node:fs';
import path from 'node:path';

const VILLAGE_IMAGE_MAPPING = [
  {
    id: 'desa-pemuteran',
    title: 'File:Snorkeling Pemuteran Bali 1.jpg',
    credit: 'Foto: Ennio morricone (Wikimedia Commons, CC BY-SA 3.0)'
  },
  {
    id: 'desa-sudaji',
    title: 'File:Air Terjun Sekumpul.jpg',
    credit: 'Foto: Nyoman Gita Astadi (Wikimedia Commons, CC BY-SA 4.0)'
  },
  {
    id: 'desa-sidemen',
    title: 'File:Sidemen sawah countryside (Bali, Indonesia 2016) (30039194120).jpg',
    credit: 'Foto: Paul Arps (Wikimedia Commons, CC BY 2.0)'
  },
  {
    id: 'desa-penglipuran',
    title: 'File:ID-bali-penglipuran-2.jpg',
    credit: 'Foto: Balou46 (Wikimedia Commons, CC BY-SA 4.0)'
  },
  {
    id: 'desa-blimbingsari',
    title: 'File:Altar GKPB Pniel Blimbingsari, Jembrana, Bali.jpg',
    credit: 'Foto: Pangeran Kurchilds (Wikimedia Commons, CC0)'
  },
  {
    id: 'desa-munduk',
    title: 'File:Munduk Tutub Waterfall SF0001.jpg',
    credit: 'Foto: Stefan Fussan (Wikimedia Commons, CC BY-SA 3.0)'
  },
  {
    id: 'desa-les',
    title: 'File:Les Village, Near Tejakula, Bali, Indonesia - panoramio.jpg',
    credit: 'Foto: ronnie.muhadi (Wikimedia Commons, CC BY-SA 3.0)'
  },
  {
    id: 'desa-sembiran',
    title: 'File:Pachung, Bali 200507-1.jpg',
    credit: 'Foto: Wikimedia Commons (CC BY-SA 3.0)'
  },
  {
    id: 'desa-pejarakan',
    title: 'File:Pulau Menjangan 2.jpg',
    credit: 'Foto: Chafidwahyu (Wikimedia Commons, CC BY-SA 4.0)'
  },
  {
    id: 'desa-ambengan',
    title: 'File:Gitgit 1998 08.jpg',
    credit: 'Foto: LBM1948 (Wikimedia Commons, CC BY-SA 4.0)'
  },
  {
    id: 'desa-gobleg',
    title: 'File:Danau Tamblingan SF0001.jpg',
    credit: 'Foto: Stefan Fussan (Wikimedia Commons, CC BY-SA 3.0)'
  },
  {
    id: 'desa-tenganan',
    title: 'File:Geringsing Gadis Tenganan.jpg',
    credit: 'Foto: Kresnanta (Wikimedia Commons, CC BY-SA 4.0)'
  },
  {
    id: 'desa-amed-purwakerti',
    title: 'File:Golden Hour in Amed.jpg',
    credit: 'Foto: Wawansatriawan bali (Wikimedia Commons, CC BY-SA 4.0)'
  },
  {
    id: 'desa-tulamben',
    title: 'File:21-Indonesia-Bali Tulamben 20 (Ship Wreck)-APiazza.JPG',
    credit: 'Foto: Andrepiazza (Wikimedia Commons, CC BY-SA 3.0)'
  },
  {
    id: 'desa-sibetan',
    title: 'File:A Road Of Sidemen to Sibetan 2012.jpg',
    credit: 'Foto: Adimelali Bali (Wikimedia Commons, CC BY-SA 3.0)'
  },
  {
    id: 'desa-budakeling',
    title: 'File:Sunrise at Budakeling.jpg',
    credit: 'Foto: Chinamoonroll (Wikimedia Commons, CC BY-SA 4.0)'
  },
  {
    id: 'desa-muncan',
    title: 'File:WIKITIRTA - TELAGA WAJA 6.jpg',
    credit: 'Foto: Anggabuana (Wikimedia Commons, CC BY-SA 4.0)'
  },
  {
    id: 'desa-timbrah',
    title: 'File:Usaba Dangsil Karangasem.jpg',
    credit: 'Foto: Giri Wijayanto (Wikimedia Commons, CC BY-SA 4.0)'
  },
  {
    id: 'desa-trunyan',
    title: 'File:Trunyan 200507.jpg',
    credit: 'Foto: Wikimedia Commons (CC BY-SA 3.0)'
  },
  {
    id: 'desa-undisan',
    title: 'File:Tembuku 200507-2.jpg',
    credit: 'Foto: Wikimedia Commons (CC BY-SA 3.0)'
  },
  {
    id: 'desa-batur-selatan',
    title: 'File:Bangly-Regency Bali Indonesia Lake-Batur-01.jpg',
    credit: 'Foto: Uwe Aranas (Wikimedia Commons, CC BY-SA 3.0)'
  },
  {
    id: 'desa-ekasari',
    title: 'File:Palasari Reservoir.jpg',
    credit: 'Foto: Budibudz (Flickr / Wikimedia Commons, CC BY 2.0)'
  },
  {
    id: 'desa-medewi',
    title: 'File:Pantai Medewi Jembrana - panoramio.jpg',
    credit: 'Foto: ahmad yudi (Panoramio / Wikimedia Commons, CC BY-SA 3.0)'
  },
  {
    id: 'desa-gumbrih',
    title: 'File:Gereja Katolik Paroki Santa Maria Ratu, Gumbrih, Jembrana.jpg',
    credit: 'Foto: Paroki Santa Maria Ratu Gumbrih (Wikimedia Commons, CC BY-SA 4.0)'
  },
  {
    id: 'desa-jatiluwih',
    title: 'File:Jatiluwih rice terraces SF0002.jpg',
    credit: 'Foto: Stefan Fussan (Wikimedia Commons, CC BY-SA 3.0)'
  },
  {
    id: 'desa-wongaya-gede',
    title: 'File:Pura Luhur Batukaru, hindu temple Bali - panoramio.jpg',
    credit: 'Foto: MajaK. (Panoramio / Wikimedia Commons, CC BY 3.0)'
  },
  {
    id: 'desa-taro',
    title: 'File:Tegallalang rice terraces SF0001.jpg',
    credit: 'Foto: Stefan Fussan (Wikimedia Commons, CC BY-SA 4.0)'
  },
  {
    id: 'desa-carangsari',
    title: 'File:Fauna Pura Beji Samuan Carangsari, Badung.jpg',
    credit: 'Foto: Ni Putu Novsa Dewi (Wikimedia Commons, CC BY-SA 4.0)'
  }
];

const TARGET_DIR = path.resolve('public/img/villages');
if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

async function fetchImageUrls() {
  const titles = VILLAGE_IMAGE_MAPPING.map(v => v.title);
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(
    titles.join('|')
  )}&prop=imageinfo&iiprop=url|size&iiurlwidth=960&format=json`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'EcoTravelerBali/1.0 (contact@ecotraveler.org)' }
  });
  const data = await res.json();
  const pages = Object.values(data.query.pages);
  const titleToUrl = {};
  for (const p of pages) {
    if (p.imageinfo && p.imageinfo[0]) {
      // Use iiurlwidth=960 thumburl if available, else original url
      titleToUrl[p.title] = p.imageinfo[0].thumburl || p.imageinfo[0].url;
    }
  }
  return titleToUrl;
}

async function downloadFile(url, destPath) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'EcoTravelerBali/1.0 (contact@ecotraveler.org)' }
  });
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: status ${res.status}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
}

async function main() {
  console.log(`Starting download for ${VILLAGE_IMAGE_MAPPING.length} villages...`);
  const titleToUrl = await fetchImageUrls();

  let successCount = 0;
  for (const item of VILLAGE_IMAGE_MAPPING) {
    const dest = path.join(TARGET_DIR, `${item.id}.jpg`);
    
    // Check if already downloaded and valid
    if (fs.existsSync(dest) && fs.statSync(dest).size > 20000) {
      console.log(`[SKIP - EXISTS] ${item.id} (${(fs.statSync(dest).size / 1024).toFixed(1)} KB)`);
      successCount++;
      continue;
    }

    const downloadUrl = titleToUrl[item.title];
    if (!downloadUrl) {
      console.error(`[ERROR] No download URL found for ${item.title}`);
      continue;
    }

    try {
      console.log(`Downloading ${item.id} from ${downloadUrl}...`);
      await downloadFile(downloadUrl, dest);
      const sizeKb = (fs.statSync(dest).size / 1024).toFixed(1);
      console.log(`[DOWNLOADED] ${item.id} -> ${sizeKb} KB`);
      successCount++;
      // Polite delay between downloads
      await new Promise(r => setTimeout(r, 600));
    } catch (err) {
      console.error(`[FAILED] ${item.id}:`, err.message);
    }
  }

  console.log(`\nDownload completed: ${successCount} / ${VILLAGE_IMAGE_MAPPING.length} villages processed.`);
}

main().catch(console.error);

