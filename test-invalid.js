import fetch from 'node-fetch';

async function readGAS() {
  const data = JSON.stringify({
    url: "https://script.google.com/macros/s/AKfycbyC9XjmPZXr3Ufsj1cP6VDD_AnlDYLQG0btgxT_G6BkGX2fWMxsOiVfjszXrXuTfCDMSQ/exec",
    payload: { action: "read", sheet: "Std_Process_Time" } 
  });

  const response = await fetch('http://localhost:3000/api/gas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: data
  });
  const result = await response.json();
  
  let items = result.data.items;
  if (typeof items === 'string') items = JSON.parse(items);

  const invalidItems = items.filter(i => typeof i.id === 'object' || typeof i.name === 'object' || String(i.id).includes('Object'));
  console.log("Invalid items found:", invalidItems.length);
  console.log(JSON.stringify(invalidItems, null, 2));
}

readGAS();
