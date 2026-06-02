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

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Remove border-[...], bg-[...], text-white etc. from <thead
  content = content.replace(/<thead[^>]*>/g, (match) => {
    let newMatch = match;
    newMatch = newMatch.replace(/bg-\[[^\]]+\]/g, '');
    newMatch = newMatch.replace(/border-(b(-[0-9]+|\[[^\]]+\])?)?/g, '');
    newMatch = newMatch.replace(/border-\[[^\]]+\]/g, '');
    newMatch = newMatch.replace(/text-white/g, '');
    newMatch = newMatch.replace(/text-\[[^\]]+\]/g, '');
    newMatch = newMatch.replace(/px-[0-9]+/g, '');
    newMatch = newMatch.replace(/py-[0-9]+/g, '');
    newMatch = newMatch.replace(/sys-table-header/g, '');
    
    // Strip any empty className=""
    newMatch = newMatch.replace(/className="\s*"/g, '');
    
    // Add our custom class
    if (newMatch.includes('className="')) {
      newMatch = newMatch.replace('className="', 'className="sys-table-header ');
    } else {
      newMatch = newMatch.replace('<thead', '<thead className="sys-table-header"');
    }
    
    // Clean up multiple spaces
    newMatch = newMatch.replace(/\s+/g, ' ');
    newMatch = newMatch.replace(/ \>/g, '>');
    return newMatch;
  });

  // Remove them from <tr inside thead
  const theadRegex = /<thead[\s\S]*?<\/thead>/g;
  content = content.replace(theadRegex, (theadContent) => {
    return theadContent.replace(/<tr[^>]*>/g, (trMatch) => {
      let newTr = trMatch;
      newTr = newTr.replace(/border-(b(-[0-9]+|\[[^\]]+\])?)?/g, '');
      newTr = newTr.replace(/border-\[[^\]]+\]/g, '');
      return newTr;
    });
  });

  // Remove them from <th
  content = content.replace(theadRegex, (theadContent) => {
    return theadContent.replace(/<th[^>]*>/g, (thMatch) => {
      let newTh = thMatch;
      newTh = newTh.replace(/py-[0-9\.]+/g, '');
      newTh = newTh.replace(/px-[0-9\.]+/g, '');
      newTh = newTh.replace(/border-(b(-[0-9]+|\[[^\]]+\])?)?/g, '');
      newTh = newTh.replace(/border-\[[^\]]+\]/g, '');
      newTh = newTh.replace(/bg-\[[^\]]+\]/g, '');
      newTh = newTh.replace(/text-\[[^\]]+\]/g, '');
      return newTh;
    });
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
  }
}
console.log('Tables fixed');
