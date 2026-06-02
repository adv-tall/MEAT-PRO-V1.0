const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/pages/*/index.tsx');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // 1. Container Card: rounded-3xl/2xl -> rounded-xl, and make sure it has 'animate-fadeIn'
  // Also add 'table-font' to the whole card or just the table. Let's add 'table-font' to the <table>
  content = content.replace(/rounded-3xl/g, 'rounded-xl');
  content = content.replace(/rounded-2xl/g, 'rounded-xl'); // Be careful, this replaces all 2xl.

  // 2. Data Table: thead border-b-2, th py-4 px-4, text-[12px]
  content = content.replace(/<thead[^>]*className="([^"]*)"/g, (match, classes) => {
    let newClasses = classes.replace(/border-b(?:-\[?[0-9px]+\]?)?/, '') + ' border-b-2';
    // Remove duplication
    const classArray = [...new Set(newClasses.split(/\s+/))];
    return `<thead className="${classArray.join(' ')}"`;
  });

  content = content.replace(/<th[^>]*className="([^"]*)"/g, (match, classes) => {
    let newClasses = classes
      .replace(/px-[468]/g, 'px-4')
      .replace(/py-[2345]/g, 'py-4')
      .replace(/text-\[10px\]|text-\[11px\]/, 'text-[12px]')
      .replace(/font-bold/g, 'font-black') // Ensure font-black if preferred
      .replace(/text-slate-500/, 'text-white') // or text-current
    
    // Add missing sizes if they were missing or replace them correctly
    if (!newClasses.includes('px-4')) newClasses += ' px-4';
    if (!newClasses.includes('py-4')) newClasses += ' py-4';
    if (!newClasses.includes('text-[')) newClasses += ' text-[12px]';

    return `<th className="${newClasses.trim()}"`;
  });

  // 3. Rows: td py-2.5 px-4, text-[12px]
  content = content.replace(/<td[^>]*className="([^"]*)"/g, (match, classes) => {
    let newClasses = classes
      .replace(/px-[468]/g, 'px-4')
      .replace(/py-[2-6](\.[5])?|py-\[?[0-9px]+\]?/g, '') // remove existing py
      .replace(/text-\[10px\]|text-\[11px\]/g, 'text-[12px]');

    newClasses += ' py-2.5';
    if (!newClasses.includes('px-4')) newClasses += ' px-4';

    return `<td className="${newClasses.trim().replace(/\s+/g, ' ')}"`;
  });

  // Also replace any span text inside td to be 12px, except badges
  // Badges usually have rounded-full or rounded-lg or px-2 py-0.5
  content = content.replace(/className="([^"]*)"/g, (match, classes) => {
    // If it's a badge-like class
    if (classes.includes('rounded-full') && classes.includes('px-2') && !classes.includes('w-8')) {
       return `className="${classes.replace(/text-\[10px\]|text-\[12px\]|text-xs/g, 'text-[11px]')}"`;
    }
    return match;
  });

  // 4. Action Buttons & Gap (w-8 h-8, gap-[1px])
  // Action buttons usually have 'sys-table-action-btn' or `w-8 h-8` or `w-[30px] h-[30px]` or `hover:bg-.*` inside a td
  content = content.replace(/gap-[246]/g, (match) => {
    // We only want to replace gaps in action groups, but standardizing some gaps might be okay.
    // Instead, let's look for action groups specifically: `flex justify-end items-center gap-*` or `flex items-center gap-*` inside td.
    return match; // Will handle manually in regex below
  });

  content = content.replace(/<td[^>]*>[\s\S]*?<div[^>]*className="([^"]*flex[^"]*gap-[^"]*)"/g, (match, classes) => {
    if (classes.includes('justify-center') || classes.includes('justify-end')) {
      return match.replace(/gap-[0-9](\.[0-9])?|gap-\[[^\]]*\]/g, 'gap-[1px]');
    }
    return match;
  });

  // Action buttons width and height
  content = content.replace(/className="([^"]*sys-table-action-btn[^"]*)"/g, (match, classes) => {
    return match.replace(/w-\[[^\]]+\]|h-\[[^\]]+\]|w-[0-9]+|h-[0-9]+/g, '').replace('sys-table-action-btn', 'sys-table-action-btn w-8 h-8')
      .replace(/\s+/g, ' ');
  });

  // 5. Pagination: py-3, border-t-[1.5px]
  // Usually pagination is `<div className="... flex justify-between items-center px-6 py-4 border-t ..."`
  content = content.replace(/<div className="([^"]*flex justify-between items-center[^"]*border-t[^"]*)"/g, (match, classes) => {
    let newClasses = classes
      .replace(/py-[0-9](\.[0-9])?|py-\[?[0-9px]+\]?/g, 'py-3')
      .replace(/border-t(?:-[[\]0-9px]+)?/g, 'border-t-[1.5px]')
      .replace(/bg-transparent|bg-slate-50|bg-\[[^\]]+\]/g, 'bg-white');
    return `<div className="${newClasses}"`;
  });

  // 6. Toolbar: (filter, search) bg-white, py-4
  // Usually it's above the table: `<div className="px-8 py-4 border-b border-[#eaeaec] bg-[#f8f9fa] ..."`
  // Let's replace bg-[#f8f9fa] with bg-white in the first div that has border-b inside a box.
  content = content.replace(/className="([^"]*border-b[^"]*flex flex-col md:flex-row[^"]*)"/g, (match, classes) => {
    let newClasses = classes
      .replace(/bg-\[[^\]]+\]|bg-slate-50/g, 'bg-white')
      .replace(/py-[0-9](\.[0-9])?|py-\[?[0-9px]+\]?/g, 'py-4')
      .replace(/px-[0-9](\.[0-9])?|px-\[?[0-9px]+\]?/g, 'px-4'); // standardise px-4
    return `<div className="${newClasses}"`;
  });

  // Add table-font to the table itself
  content = content.replace(/<table className="([^"]*)"/g, (match, classes) => {
    if (!classes.includes('table-font')) {
      return `<table className="${classes} table-font"`;
    }
    return match;
  });

  fs.writeFileSync(file, content, 'utf8');
}
console.log('Script executed');
