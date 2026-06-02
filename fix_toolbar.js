import fs from 'fs';
import path from 'path';

function getFiles(dir, fileList = []) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, fileList);
    } else {
      if (filePath.endsWith('.tsx') && filePath.includes('pages')) {
        fileList.push(filePath);
      }
    }
  });
  return fileList;
}

const files = getFiles('src/pages');
files.forEach(f => {
  if (f.includes('Home')) return;
  let content = fs.readFileSync(f, 'utf8');
  let original = content;

  // Find <input> tags and add className if they don't have font-table
  content = content.replace(/<input[^>]+className=\"([^\"]+)\"[^>]*>/g, (match, className) => {
    if (!className.includes('table-font-override')) {
      return match.replace(className, className + ' table-font-override');
    }
    return match;
  });

  // Find <select> tags
  content = content.replace(/<select[^>]+className=\"([^\"]+)\"[^>]*>/g, (match, className) => {
    if (!className.includes('table-font-override')) {
      return match.replace(className, className + ' table-font-override');
    }
    return match;
  });

  // Find buttons that might be above tables (all buttons for simplicity? "ปุ่มต่างๆ ที่อยู่ในส่วนเหนือตาราง" - actually almost all buttons are above table except pagination and actions).
  // Table action buttons already have .sys-table-action-btn. Pagination has .sys-table-pagination.
  content = content.replace(/<button[^>]+className=\"([^\"]+)\"[^>]*>/g, (match, className) => {
    if (!className.includes('table-font-override') && !className.includes('sys-table-action') && !className.includes('pagination')) {
      return match.replace(className, className + ' table-font-override');
    }
    return match;
  });

  if (content !== original) {
    fs.writeFileSync(f, content, 'utf8');
  }
});
console.log('Fixed toolbars');
