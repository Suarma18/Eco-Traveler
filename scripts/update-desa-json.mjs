import fs from 'node:fs';
import path from 'node:path';

const CREDITS = {
  'desa-pemuteran': 'Foto: Ennio morricone (Wikimedia Commons, CC BY-SA 3.0)',
  'desa-sudaji': 'Foto: Nyoman Gita Astadi (Wikimedia Commons, CC BY-SA 4.0)',
  'desa-sidemen': 'Foto: Paul Arps (Wikimedia Commons, CC BY 2.0)',
  'desa-penglipuran': 'Foto: Balou46 (Wikimedia Commons, CC BY-SA 4.0)',
  'desa-blimbingsari': 'Foto: Pangeran Kurchilds (Wikimedia Commons, CC0)',
  'desa-munduk': 'Foto: Stefan Fussan (Wikimedia Commons, CC BY-SA 3.0)',
  'desa-les': 'Foto: ronnie.muhadi (Wikimedia Commons, CC BY-SA 3.0)',
  'desa-sembiran': 'Foto: Wikimedia Commons (CC BY-SA 3.0)',
  'desa-pejarakan': 'Foto: Chafidwahyu (Wikimedia Commons, CC BY-SA 4.0)',
  'desa-ambengan': 'Foto: LBM1948 (Wikimedia Commons, CC BY-SA 4.0)',
  'desa-gobleg': 'Foto: Stefan Fussan (Wikimedia Commons, CC BY-SA 3.0)',
  'desa-tenganan': 'Foto: Kresnanta (Wikimedia Commons, CC BY-SA 4.0)',
  'desa-amed-purwakerti': 'Foto: Wawansatriawan bali (Wikimedia Commons, CC BY-SA 4.0)',
  'desa-tulamben': 'Foto: Andrepiazza (Wikimedia Commons, CC BY-SA 3.0)',
  'desa-sibetan': 'Foto: Adimelali Bali (Wikimedia Commons, CC BY-SA 3.0)',
  'desa-budakeling': 'Foto: Chinamoonroll (Wikimedia Commons, CC BY-SA 4.0)',
  'desa-muncan': 'Foto: Anggabuana (Wikimedia Commons, CC BY-SA 4.0)',
  'desa-timbrah': 'Foto: Giri Wijayanto (Wikimedia Commons, CC BY-SA 4.0)',
  'desa-trunyan': 'Foto: Wikimedia Commons (CC BY-SA 3.0)',
  'desa-undisan': 'Foto: Wikimedia Commons (CC BY-SA 3.0)',
  'desa-batur-selatan': 'Foto: Uwe Aranas (Wikimedia Commons, CC BY-SA 3.0)',
  'desa-ekasari': 'Foto: Budibudz (Flickr / Wikimedia Commons, CC BY 2.0)',
  'desa-medewi': 'Foto: ahmad yudi (Panoramio / Wikimedia Commons, CC BY-SA 3.0)',
  'desa-gumbrih': 'Foto: Paroki Santa Maria Ratu Gumbrih (Wikimedia Commons, CC BY-SA 4.0)',
  'desa-jatiluwih': 'Foto: Stefan Fussan (Wikimedia Commons, CC BY-SA 3.0)',
  'desa-wongaya-gede': 'Foto: MajaK. (Panoramio / Wikimedia Commons, CC BY 3.0)',
  'desa-taro': 'Foto: Stefan Fussan (Wikimedia Commons, CC BY-SA 4.0)',
  'desa-carangsari': 'Foto: Ni Putu Novsa Dewi (Wikimedia Commons, CC BY-SA 4.0)'
};

const filePath = path.resolve('data/desa-wisata.json');
const dataset = JSON.parse(fs.readFileSync(filePath, 'utf8'));

for (const village of dataset) {
  if (CREDITS[village.id]) {
    village.image = `/img/villages/${village.id}.jpg`;
    village.imageCredit = CREDITS[village.id];
  } else {
    console.warn(`Missing credit for ${village.id}`);
  }
}

fs.writeFileSync(filePath, JSON.stringify(dataset, null, 2) + '\n', 'utf8');
console.log(`Updated ${dataset.length} villages in ${filePath}`);

