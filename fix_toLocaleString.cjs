const fs = require('fs');

const fixFile = (filePath) => {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace various .toLocaleString() calls with fallbacks to avoid TypeError
    // (var || 0).toLocaleString()
    content = content.replace(/\{item\.actualKg\.toLocaleString\(\)\}/g, '{(item.actualKg || 0).toLocaleString()}');
    content = content.replace(/\{item\.totalKg\.toLocaleString\(\)\}/g, '{(item.totalKg || 0).toLocaleString()}');
    content = content.replace(/\{item\.totalPacks\.toLocaleString\(\)\}/g, '{(item.totalPacks || 0).toLocaleString()}');

    // Also cost analysis
    content = content.replace(/monthlyVolumeData\.totalVolume\.toLocaleString\(\)/g, '(monthlyVolumeData?.totalVolume || 0).toLocaleString()');
    content = content.replace(/currentMonthCosts\.energy\.toLocaleString\(\)/g, '(currentMonthCosts?.energy || 0).toLocaleString()');
    content = content.replace(/currentMonthCosts\.labor\.toLocaleString\(\)/g, '(currentMonthCosts?.labor || 0).toLocaleString()');
    content = content.replace(/currentMonthCosts\.water\.toLocaleString\(\)/g, '(currentMonthCosts?.water || 0).toLocaleString()');
    content = content.replace(/item\.volume\.toLocaleString\(\)/g, '(item.volume || 0).toLocaleString()');
    
    // Fix item.energyCost
    content = content.replace(/item\.energyCost\.toLocaleString\(/g, '(item.energyCost || 0).toLocaleString(');
    content = content.replace(/item\.laborCost\.toLocaleString\(/g, '(item.laborCost || 0).toLocaleString(');
    content = content.replace(/item\.totalCategoryCost\.toLocaleString\(/g, '(item.totalCategoryCost || 0).toLocaleString(');
    content = content.replace(/totalMonthlyCost\.toLocaleString\(\)/g, '(totalMonthlyCost || 0).toLocaleString()');
    content = content.replace(/cat\.volumeKg\.toLocaleString\(\)/g, '(cat.volumeKg || 0).toLocaleString()');

    // PackingBoard
    content = content.replace(/p\.targetPacks\.toLocaleString\(\)/g, '(p.targetPacks || 0).toLocaleString()');
    content = content.replace(/p\.packedPacks\.toLocaleString\(\)/g, '(p.packedPacks || 0).toLocaleString()');
    content = content.replace(/p\.wipPacks\.toLocaleString\(\)/g, '(p.wipPacks || 0).toLocaleString()');
    content = content.replace(/availSfgQty\.toLocaleString\(\)/g, '(availSfgQty || 0).toLocaleString()');
    content = content.replace(/maxByStock\.toLocaleString\(\)/g, '(maxByStock || 0).toLocaleString()');
    content = content.replace(/planRemaining\.toLocaleString\(\)/g, '(planRemaining || 0).toLocaleString()');
    content = content.replace(/lot\.qty\.toLocaleString\(\)/g, '(lot.qty || 0).toLocaleString()');

    // DailyProdReport
    content = content.replace(/rep\.actualQty\.toLocaleString\(\)/g, '(rep.actualQty || 0).toLocaleString()');
    content = content.replace(/rep\.targetQty\.toLocaleString\(\)/g, '(rep.targetQty || 0).toLocaleString()');
    content = content.replace(/item\.value\.toLocaleString\(\)/g, '(item.value || 0).toLocaleString()');

    // PlanningPL
    content = content.replace(/totalBatches\.toLocaleString\(\)/g, '(totalBatches || 0).toLocaleString()');
    content = content.replace(/totalPacks\.toLocaleString\(\)/g, '(totalPacks || 0).toLocaleString()');
    content = content.replace(/completedCount\.toLocaleString\(\)/g, '(completedCount || 0).toLocaleString()');
    content = content.replace(/delayedCount\.toLocaleString\(\)/g, '(delayedCount || 0).toLocaleString()');

    // YieldAnalysis
    content = content.replace(/overallMetrics\.totalInput\.toLocaleString\(\)/g, '(overallMetrics?.totalInput || 0).toLocaleString()');
    content = content.replace(/overallMetrics\.totalOutput\.toLocaleString\(\)/g, '(overallMetrics?.totalOutput || 0).toLocaleString()');
    content = content.replace(/overallMetrics\.totalLoss\.toLocaleString\(\)/g, '(overallMetrics?.totalLoss || 0).toLocaleString()');
    content = content.replace(/b\.rawInputKg\.toLocaleString\(\)/g, '(b.rawInputKg || 0).toLocaleString()');


    fs.writeFileSync(filePath, content, 'utf8');
}

fixFile('src/pages/CostAnalysis/index.tsx');
fixFile('src/pages/PlanningPL/index.tsx');
fixFile('src/pages/MasterItem/index.tsx');
fixFile('src/pages/YieldAnalysis/index.tsx');
fixFile('src/pages/PackingBoard/index.tsx');
fixFile('src/pages/DailyProdReport/index.tsx');
