const fs = require('fs');
const path = require('path');
const https = require('https');

const outDir = path.join(__dirname, '..', 'assets', 'audio');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const baseUrl = 'https://archive.org/download/100ClassicalMusicMasterpieces/';
const tracks = [
  {
    remote: '1698 Pachelbel , Canon in D.mp3',
    local: 'canon_in_d.mp3',
    title: 'Canon in D (Giai Điệu Tình Yêu Bất Hủ)',
    artist: 'Johann Pachelbel (Piano & Strings)'
  },
  {
    remote: '1847 Liszt - Liebestraum No.3 in A flat.mp3',
    local: 'liebestraum_love_dream.mp3',
    title: 'Liebestraum No. 3 (Giấc Mộng Tình Yêu)',
    artist: 'Franz Liszt (Piano Solo)'
  },
  {
    remote: "1801 Beethoven- 'Moonlight' Sonata, 1st movement.mp3",
    local: 'moonlight_sonata.mp3',
    title: 'Moonlight Sonata (Ánh Trăng Dịu Êm)',
    artist: 'L.V. Beethoven (Piano Solo)'
  },
  {
    remote: '1810 Beethoven- Fur Elise.mp3',
    local: 'fur_elise.mp3',
    title: 'Für Elise (Dành Cho Nàng Thơ)',
    artist: 'L.V. Beethoven (Piano Solo)'
  }
];

function downloadTrack(track) {
  return new Promise((resolve, reject) => {
    const dest = path.join(outDir, track.local);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 100000) {
      console.log(`✓ ${track.local} already downloaded (${(fs.statSync(dest).size / 1024 / 1024).toFixed(2)} MB)`);
      return resolve(dest);
    }

    const encoded = encodeURIComponent(track.remote);
    const fileUrl = baseUrl + encoded;
    console.log(`Downloading ${track.title} -> ${track.local}...`);

    const file = fs.createWriteStream(dest);
    https.get(fileUrl, res => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        https.get(res.headers.location, redirectRes => {
          redirectRes.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log(`✓ Downloaded ${track.local} (${(fs.statSync(dest).size / 1024 / 1024).toFixed(2)} MB)`);
            resolve(dest);
          });
        }).on('error', err => {
          fs.unlinkSync(dest);
          reject(err);
        });
      } else if (res.statusCode === 200) {
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✓ Downloaded ${track.local} (${(fs.statSync(dest).size / 1024 / 1024).toFixed(2)} MB)`);
          resolve(dest);
        });
      } else {
        reject(new Error(`HTTP ${res.statusCode}`));
      }
    }).on('error', err => {
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}

(async () => {
  for (const t of tracks) {
    try {
      await downloadTrack(t);
    } catch (e) {
      console.error(`Failed to download ${t.local}:`, e.message);
    }
  }
  console.log('Finished downloading playlist tracks!');
})();
