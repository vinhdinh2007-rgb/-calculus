import { readFileSync, existsSync } from 'fs';
import { resolve, basename } from 'path';


// Read .env manually
const envPath = resolve('.env');
const envContent = readFileSync(envPath, 'utf-8');
const env = Object.fromEntries(
  envContent
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; })
);

const { VITE_INSFORGE_BASE_URL, VITE_INSFORGE_ANON_KEY } = env;
const BASE = VITE_INSFORGE_BASE_URL;
const TOKEN = VITE_INSFORGE_ANON_KEY;
const BUCKET = 'images';
const FILE_PATH = resolve('public', 'bkfc.png');

async function upload() {
  if (!existsSync(FILE_PATH)) { console.error('File not found:', FILE_PATH); process.exit(1); }

  const buffer = readFileSync(FILE_PATH);
  const filename = basename(FILE_PATH);
  const size = buffer.length;

  console.log(`\n📦 File: ${filename} (${size} bytes)`);
  console.log(`🔗 Backend: ${BASE}\n`);

  // Step 1: Get upload strategy
  console.log('Step 1: Getting upload strategy...');
  const stratRes = await fetch(`${BASE}/api/storage/buckets/${BUCKET}/upload-strategy`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ filename, contentType: 'image/png', size }),
  });

  const strat = await stratRes.json();
  console.log('Strategy response:', JSON.stringify(strat, null, 2));

  if (!stratRes.ok) {
    console.error('❌ Failed to get upload strategy:', strat);
    process.exit(1);
  }

  // Step 2: Upload the file
  console.log('\nStep 2: Uploading file...');

  if (strat.method === 'direct') {
    // Local storage — PUT with multipart/form-data to the uploadUrl
    const uploadUrl = strat.uploadUrl.startsWith('http') ? strat.uploadUrl : `${BASE}${strat.uploadUrl}`;
    const form = new FormData();
    form.set('file', new Blob([buffer], { type: 'image/png' }), filename);

    const upRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${TOKEN}` },
      body: form,
    });
    const upBody = await upRes.text();
    console.log('Upload status:', upRes.status);
    console.log('Upload response:', upBody);

  } else if (strat.method === 'presigned') {
    // S3 — POST with multipart/form-data to the presigned URL including all fields
    const form = new FormData();
    for (const [k, v] of Object.entries(strat.fields)) {
      form.set(k, v);
    }
    form.set('file', new Blob([buffer], { type: 'image/png' }), filename);

    const upRes = await fetch(strat.uploadUrl, {
      method: 'POST',
      body: form,
    });
    console.log('S3 Upload status:', upRes.status);

    if (strat.confirmRequired) {
      console.log('\nStep 3: Confirming upload...');
      const confirmUrl = `${BASE}${strat.confirmUrl}`;
      const confRes = await fetch(confirmUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ size, contentType: 'image/png' }),
      });
      const confBody = await confRes.json();
      console.log('Confirm status:', confRes.status);
      console.log('Result:', JSON.stringify(confBody, null, 2));
    }
  }
}

upload().catch(console.error);
