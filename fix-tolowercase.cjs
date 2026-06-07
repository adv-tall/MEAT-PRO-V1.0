const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            results.push(file);
        }
    });
    return results;
}

const files = walk('src/pages').filter(f => f.endsWith('.tsx'));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Pattern for o.name.toLowerCase() -> (o.name || "").toLowerCase()
    // It captures (\w+\.\w+) such as l.user or p.id
    const regex1 = /([A-Za-z0-9_]+\.[A-Za-z0-9_]+(?:\(\))?)\.toLowerCase\(\)/g;
    content = content.replace(regex1, (match, p1) => {
        // avoid double replacement like ((o.name || "") || "").toLowerCase()
        if (p1.includes(' || ')) return match;
        // avoid strings like "some".toLowerCase()
        if (p1.startsWith('"') || p1.startsWith("'")) return match;
        changed = true;
        return `(${p1} || "").toLowerCase()`;
    });

    // Pattern for variable.toLowerCase() like searchQuery.toLowerCase() -> (searchQuery || "").toLowerCase()
    const regex2 = /([A-Za-z0-9_]+)\.toLowerCase\(\)/g;
    content = content.replace(regex2, (match, p1) => {
        if (p1 === 'String' || p1.includes(' || ')) return match;
        if (p1.startsWith('"') || p1.startsWith("'")) return match;
        changed = true;
        return `(${p1} || "").toLowerCase()`;
    });


    if (changed) {
        // Just write logic to safely handle if we introduced ((searchQuery || "") || "")
        content = content.replace(/\(\((.*?)\s*\|\|\s*""\)\s*\|\|\s*""\)/g, "($1 || \"\")");
        fs.writeFileSync(file, content);
        console.log("Fixed", file);
    }
});
