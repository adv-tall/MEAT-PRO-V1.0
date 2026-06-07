import fetch from 'node-fetch';

async function testAddNoId() {
  const addPayload = {
    name: "New item NO ID",
  };

  const data = JSON.stringify({
    url: "https://script.google.com/macros/s/AKfycbyC9XjmPZXr3Ufsj1cP6VDD_AnlDYLQG0btgxT_G6BkGX2fWMxsOiVfjszXrXuTfCDMSQ/exec",
    payload: { action: "write", sheet: "Product_Matrix", data: [addPayload] } 
  });

  const addResp = await fetch('http://localhost:3000/api/gas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: data
  });
  console.log(await addResp.text());
}

testAddNoId();
