const fs = require('fs');
let content = fs.readFileSync('src/pages/MasterItem/index.tsx', 'utf8');

content = content.replace(/\bupdated:\s/g, 'updatedAt: ');
content = content.replace(/item\.updated\b/g, 'item.updatedAt');

fs.writeFileSync('src/pages/MasterItem/index.tsx', content, 'utf8');
