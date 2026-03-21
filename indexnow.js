// indexnow.js
const KEY = 'cb65241777f64e4981abd5cc4a8702be';

fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host: 'pdfsolver.app',
    key: KEY,
    keyLocation: `https://pdfsolver.app/${KEY}.txt`,
    urlList: [
      'https://pdfsolver.app/',
      'https://pdfsolver.app/image-requirements',
      'https://pdfsolver.app/merge',
      'https://pdfsolver.app/split',
      'https://pdfsolver.app/images-to-pdf',
      'https://pdfsolver.app/compress',
      'https://pdfsolver.app/privacy',
      'https://pdfsolver.app/terms',
    ]
  })
})
.then(r => {
  console.log('Status:', r.status);
  // 200 = success, 202 = accepted, 400 = bad request, 403 = forbidden (key file missing)
  return r.text();
})
.then(body => console.log('Response:', body || '(empty - this is normal on success)'))
.catch(err => console.error('Error:', err));