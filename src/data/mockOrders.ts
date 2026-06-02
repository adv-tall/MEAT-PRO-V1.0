// --- MOCK DATABASE (55+ ITEMS) ---
export const FG_DATABASE: any[] = [
    { sku: 'FG-AFM-001', name: 'ไส้กรอกแดงจัมโบ้ AFM 1kg', weight: 1.0 },
    { sku: 'FG-AFM-002', name: 'ลูกชิ้นปลา AFM 500g', weight: 0.5 },
    { sku: 'FG-AFM-003', name: 'โบโลน่าไก่พริก AFM 1kg', weight: 1.0 },
    { sku: 'FG-1001', name: 'ไส้กรอกไก่จัมโบ้ ARO 1kg', weight: 1.0 },
    { sku: 'FG-1002', name: 'ไส้กรอกคอกเทล CP 500g', weight: 0.5 },
];
for(let i=10; i<60; i++) {
    const brands = ['ARO', 'CP', 'BKP', 'SAVE', 'AFM', 'Generic'];
    FG_DATABASE.push({ sku: `FG-GEN-${i}`, name: `${brands[i % brands.length]} สินค้าทดสอบรายการที่ ${i}`, weight: (i % 2 === 0 ? 1.0 : 0.5) });
}

// --- MASSIVE ORDER GENERATOR ---
export const generateMockOrders = () => {
    const orders: any[] = [];
    let idCounter = 1;
    const todayStr = new Date().toISOString().split('T')[0].replace(/-/g, '').slice(2);
    const generateId = () => `${todayStr}-${String(idCounter++).padStart(3, '0')}`;

    // AFM Target 50T
    orders.push({ id: generateId(), sku: 'FG-AFM-001', name: 'ไส้กรอกแดงจัมโบ้ AFM 1kg', qty: 30000, fgKg: 30000, sfgKg: 30000, batterKg: 33000, deadline: '12:00', status: 'IN PROGRESS', isReplacement: false, shift: 'Morning', currentStep: 'Packing' });
    orders.push({ id: generateId(), sku: 'FG-AFM-002', name: 'ลูกชิ้นปลา AFM 500g', qty: 40000, fgKg: 20000, sfgKg: 20000, batterKg: 22000, deadline: '16:00', status: 'PLANNED', isReplacement: false, shift: 'Afternoon', currentStep: 'Mixing' });

    const shifts = ['Morning', 'Afternoon', 'Night'];
    const statuses = ['DRAFT', 'APPROVED', 'PLANNED', 'IN PROGRESS', 'COMPLETED'];
    for (let i = 0; i < 105; i++) {
        const fg = FG_DATABASE[Math.floor(Math.random() * FG_DATABASE.length)];
        const targetKg = Math.floor(Math.random() * 2500) + 500;
        const qty = Math.ceil(targetKg / fg.weight);
        const shift = shifts[Math.floor(Math.random() * shifts.length)];
        let deadline = shift === 'Morning' ? '12:00' : (shift === 'Afternoon' ? '16:00' : '23:59');
        let status = statuses[Math.floor(Math.random() * statuses.length)];
        orders.push({
            id: generateId(), sku: fg.sku, name: fg.name, qty, fgKg: qty * fg.weight, sfgKg: qty * fg.weight, batterKg: Number((qty * fg.weight * 1.1).toFixed(2)),
            deadline, status, isReplacement: Math.random() > 0.9, shift, currentStep: status === 'PLANNED' ? 'Queue' : (status === 'IN PROGRESS' ? 'Mixing' : 'Entry')
        });
    }
    return orders;
};

export const MOCK_ORDERS = generateMockOrders();
