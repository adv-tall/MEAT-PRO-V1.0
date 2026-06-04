const fs = require('fs');
let content = fs.readFileSync('src/pages/MasterItem/index.tsx', 'utf8');

content = content.replace(/\bcat:\s/g, 'category: ');
content = content.replace(/\bw:\s/g, 'weight: ');
content = content.replace(/\bcat\s*===/g, 'category ===');
content = content.replace(/item\.cat/g, 'item.category');
content = content.replace(/item\.w\b/g, 'item.weight');
content = content.replace(/formData\.cat/g, 'formData.category');
content = content.replace(/formData\.w/g, 'formData.weight');

fs.writeFileSync('src/pages/MasterItem/index.tsx', content, 'utf8');
