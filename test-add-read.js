import fetch from 'node-fetch';

async function testAdd() {
  const addPayload = {
    id: "SFG-999",
    name: "ไส้กรอกไก่ (TEST NEW DATA) 1",
  };

  const data = JSON.stringify({
    url: "https://script.google.com/macros/s/AKfycbyC9XjmPZXr3Ufsj1cP6VDD_AnlDYLQG0btgxT_G6BkGX2fWMxsOiVfjszXrXuTfCDMSQ/exec",
    payload: { action: "write", sheet: "Product_Matrix", data: [addPayload] } 
  });

  console.log("Adding...");
  const addResp = await fetch('http://localhost:3000/api/gas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: data
  });
  console.log(await addResp.text());

  console.log("Reading...");
  const readData = JSON.stringify({
    url: "https://script.google.com/macros/s/AKfycbyC9XjmPZXr3Ufsj1cP6VDD_AnlDYLQG0btgxT_G6BkGX2fWMxsOiVfjszXrXuTfCDMSQ/exec",
    payload: { action: "read", sheet: "Product_Matrix" } 
  });
  const readResp = await fetch('http://localhost:3000/api/gas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: readData
  });
  const readJson = await readResp.json();
  const items = typeof readJson.data.items === 'string' ? JSON.parse(readJson.data.items) : readJson.data.items;
  console.log(items.find(i => i.id === 'SFG-999'));
}

testAdd();
