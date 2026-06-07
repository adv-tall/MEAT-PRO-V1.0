import fetch from 'node-fetch';

async function testGASRead() {
  const data = JSON.stringify({
    url: "https://script.google.com/macros/s/AKfycbyC9XjmPZXr3Ufsj1cP6VDD_AnlDYLQG0btgxT_G6BkGX2fWMxsOiVfjszXrXuTfCDMSQ/exec",
    payload: { action: "read", sheet: "Product_Matrix" } 
  });

  const response = await fetch('http://localhost:3000/api/gas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: data
  });
  const result = await response.json();
  
  const items = typeof result.data.items === 'string' ? JSON.parse(result.data.items) : result.data.items;
  const sfg = items.find(i => i.id === 'SFG-001');
  console.log(sfg);
}

testGASRead();
