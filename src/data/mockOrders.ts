// --- MOCK DATABASE (55+ ITEMS) ---
export const FG_DATABASE: any[] = [
    { sku: 'FG-1001', name: 'ไส้กรอกไก่จัมโบ้ ARO 1kg', weight: 1.0 },
    { sku: 'FG-1002', name: 'ไส้กรอกไก่จัมโบ้ MAKRO 500g', weight: 0.5 },
    { sku: 'FG-1003', name: 'ไส้กรอกไก่จัมโบ้ (ถุงใส)', weight: 5.0 },
    { sku: 'FG-2001', name: 'ไส้กรอกคอกเทล ARO 1kg', weight: 1.0 },
    { sku: 'FG-2002', name: 'ไส้กรอกคอกเทล Betagro 500g', weight: 0.5 },
    { sku: 'FG-3001', name: 'ลูกชิ้นหมู ARO 1kg', weight: 1.0 },
    { sku: 'FG-3002', name: 'ลูกชิ้นหมู CJ 500g', weight: 0.5 },
    { sku: 'FG-3005', name: 'ลูกชิ้นปลาเยาวราช 500g', weight: 0.5 },
    { sku: 'FG-3010', name: 'ลูกชิ้นหมูปิ้ง AFM (แพ็ค 10 ไม้)', weight: 0.8 },
    { sku: 'FG-4001', name: 'โบโลน่าพริก MAKRO 1kg (Sliced)', weight: 1.0 },
    { sku: 'FG-4002', name: 'โบโลน่าพริก Betagro 200g (Sliced)', weight: 0.2 },
    { sku: 'FG-4005', name: 'แซนวิชแฮม 500g (Sliced)', weight: 0.5 },
    { sku: 'FG-AFM-001', name: 'ไส้กรอกแดงจัมโบ้ AFM 1kg', weight: 1.0 },
    { sku: 'FG-AFM-002', name: 'ลูกชิ้นปลา AFM 500g', weight: 0.5 },
    { sku: 'FG-AFM-003', name: 'โบโลน่าไก่พริก AFM 1kg', weight: 1.0 }
];

// --- MASSIVE ORDER GENERATOR ---
export const generateMockOrders = () => {
    const orders: any[] = [];
    let idCounter = 1;
    
    // Generate identical style of orders to match PL planning (150-250 tons per day) over -2 to +2 days
    for (let d = -2; d <= 2; d++) {
        const dateStr = new Date(Date.now() + d * 86400000).toISOString().split("T")[0];
        let dailyKg = 0;
        const targetDailyKg = Math.floor(Math.random() * 100000) + 150000;
        
        while (dailyKg < targetDailyKg) {
            const fg = FG_DATABASE[Math.floor(Math.random() * FG_DATABASE.length)];
            let itemKg = 0;
            if (fg.name.includes('AFM') || fg.sku.includes('AFM')) {
                itemKg = Math.floor(Math.random() * 10000) + 5000;
            } else {
                itemKg = Math.floor(Math.random() * 4000) + 1000;
            }
            
            const packs = Math.ceil(itemKg / fg.weight);
            const totalKg = packs * fg.weight;
            dailyKg += totalKg;
            
            const targetBatter = totalKg * 1.1;
            const batchSize = [80, 100, 120][Math.floor(Math.random() * 3)];
            const batches = Math.ceil(targetBatter / batchSize);
            
            const statusRaw = ["DRAFT", "CONFIRMED", "IN_PROCESS", "COMPLETED", "CANCELLED"][Math.floor(Math.random() * 5)];
            let status = statusRaw;
            let currentStep = 'Entry';
            
            const shift = ["Morning", "Afternoon", "Night"][Math.floor(Math.random() * 3)];
            let deadline = shift === 'Morning' ? '12:00' : (shift === 'Afternoon' ? '16:00' : '23:59');

            if (statusRaw === 'IN_PROCESS') {
                status = 'IN PROGRESS';
                currentStep = 'Mixing';
            } else if (statusRaw === 'COMPLETED') {
                status = 'COMPLETED';
                currentStep = 'WH'; // Warehouse
            } else if (statusRaw === 'CONFIRMED' || statusRaw === 'DRAFT') {
                // Planners set this to Draft or Confirmed. Production Planning needs to Approve it (Entry tab).
                currentStep = 'Entry'; 
            }

            const id = `PL-${dateStr.replace(/-/g, '').substring(2, 6)}-${String(idCounter++).padStart(4, "0")}`;

            orders.push({
                id,
                date: dateStr,
                sku: fg.sku,
                name: fg.name,
                qty: packs,
                fgKg: totalKg,
                sfgKg: totalKg,
                batterKg: Number(targetBatter.toFixed(2)),
                batches: batches,
                batchSize: batchSize,
                deadline,
                status,
                isReplacement: false,
                shift,
                currentStep,
                customer: ["Makro", "Lotus", "CPALL", "BJC", "Export-JP", "General Market", "AFM"][Math.floor(Math.random() * 7)]
            });
        }
    }

    return orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const MOCK_ORDERS = generateMockOrders();
