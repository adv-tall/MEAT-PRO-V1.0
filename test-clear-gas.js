import fetch from 'node-fetch';

async function clearGAS() {
  const data = JSON.stringify({
    url: "https://script.google.com/macros/s/AKfycbyC9XjmPZXr3Ufsj1cP6VDD_AnlDYLQG0btgxT_G6BkGX2fWMxsOiVfjszXrXuTfCDMSQ/exec",
    payload: { action: "sync", sheet: "Std_Process_Time", data: [] } 
  });

  const response = await fetch('http://localhost:3000/api/gas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: data
  });
  const result = await response.json();
  console.log("GAS Clear Result:", result);
}

clearGAS();
