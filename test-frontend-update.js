import fetch from 'node-fetch';

async function testFrontendUpdate() {
  const payload = {
    id: "SFG-001",
    name: "ไส้กรอกไก่รมควัน 6 นิ้ว (จัมโบ้) TEST",
    batterConfig: '[{"ratio":100,"id":"BT-CK-STD"}]',
    fgs: '[{"name":"SMC ไส้กรอกไก่ ARO 1kg","weight":1,"sku":"FG-1001","pieces":20},{"name":"SMC ไส้กรอกไก่ 500g","sku":"FG-1002","weight":0.5,"pieces":10},{"sku":"FG-1003","name":"ไส้กรอกไก่จัมโบ้ (ถุงใส)","brand":"No Brand","pieces":0},{"sku":"FG-1004","name":"Test","pieces":0,"weight":1}]'
  };

  const data = JSON.stringify({
    url: "https://script.google.com/macros/s/AKfycbyC9XjmPZXr3Ufsj1cP6VDD_AnlDYLQG0btgxT_G6BkGX2fWMxsOiVfjszXrXuTfCDMSQ/exec",
    payload: { action: "update", sheet: "Product_Matrix", data: [payload] } 
  });

  console.log("Updating...");
  const updateResp = await fetch('http://localhost:3000/api/gas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: data
  });
  console.log(await updateResp.text());
}

testFrontendUpdate();
