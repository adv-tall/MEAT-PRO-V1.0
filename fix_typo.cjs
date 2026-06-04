const fs = require('fs');
let content = fs.readFileSync('src/pages/MasterItem/index.tsx', 'utf8');

content = content.replace(/item\.categoryegory/g, 'item.category');
content = content.replace(/item\.weighteight/g, 'item.weight');
content = content.replace(/formData\.categoryegory/g, 'formData.category');
content = content.replace(/formData\.weighteight/g, 'formData.weight');

fs.writeFileSync('src/pages/MasterItem/index.tsx', content, 'utf8');
