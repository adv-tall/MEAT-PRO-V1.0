import http from 'http';

const data = JSON.stringify({
  url: "https://script.google.com/macros/s/AKfycbyC9XjmPZXr3Ufsj1cP6VDD_AnlDYLQG0btgxT_G6BkGX2fWMxsOiVfjszXrXuTfCDMSQ/exec",
  payload: { action: "read", sheet: "Master_Item" }
});

const req = http.request(
  'http://localhost:3000/api/gas',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  },
  (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      console.log('Status code:', res.statusCode);
      console.log('Body:', rawData);
    });
  }
);
req.on('error', (e) => console.error('Error:', e.message));
req.write(data);
req.end();
