import { useState, useEffect } from 'react';
import { GASService } from '../services/GoogleAppsScriptService';
import { MOCK_ORDERS as initialMockOrders } from '../data/mockOrders';
import { db } from '../services/firebaseConfig';
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { logSystemActivity } from '../services/logger';

type Order = any;

class OrdersStore {
  private orders: Order[] = initialMockOrders;
  private listeners: Set<() => void> = new Set();
  private isLoaded: boolean = false;
  private isLoading: boolean = false;

  constructor() {
    this.initGASListener();
  }

  private async initGASListener() {
    if (this.isLoading) return;
    this.isLoading = true;

    try {
      const fbSnapshot = await getDocs(collection(db, 'Orders_Production'));
      let fbData: any[] = [];
      if (!fbSnapshot.empty) {
        fbData = fbSnapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      }

      let gasOrders: any[] = [];
      try {
          const response = await GASService.read('Orders_Production');
          if (response && response.status === 'success') {
             gasOrders = response.data?.items || [];
          }
      } catch (gasErr) {
          console.error(`GAS read failed for Orders_Production:`, gasErr);
      }

      let mergedData = [...fbData];
      let needsFbSync = false;
      let needsGasSync = false;

      // Add missing from GAS to mergedData
      gasOrders.forEach((item: any) => {
         if (!mergedData.find(m => m.id === item.id)) {
            mergedData.push(item);
            needsFbSync = true;
         }
      });

      if (mergedData.length === 0 && !this.isLoaded) {
        await this.seedMockOrders();
      } else {
        this.orders = mergedData.sort((a: any, b: any) => String(a.id).localeCompare(String(b.id)));
        this.isLoaded = true;
        
        // Sync missing
        if (needsFbSync) {
           for(const item of this.orders) {
               if(item.id) setDoc(doc(db, 'Orders_Production', item.id), item).catch(console.error);
           }
        }
        
        this.listeners.forEach(l => l());
      }
    } catch (error) {
      console.warn("Read Error, fallback to local:", error);
      const stored = localStorage.getItem('prod_orders');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          this.orders = parsed.length > 0 ? parsed : initialMockOrders;
        } catch (e) {
          this.orders = initialMockOrders;
        }
      } else {
        this.orders = initialMockOrders;
      }
      this.isLoaded = true;
      this.listeners.forEach(l => l());
    } finally {
      this.isLoading = false;
    }
  }

  private async seedMockOrders() {
    this.isLoaded = true;
    console.log("Seeding mock orders to Google Sheets...");
    try {
      const isoNow = new Date().toISOString();
      const itemsToSeed = initialMockOrders.map(o => ({
          ...o,
          createdAt: isoNow,
          updatedAt: isoNow
      }));

      // For speed, just take the first 100 to avoid GAS timeout
      const chunk = itemsToSeed.slice(0, 100);
      
      for(const item of chunk) {
         if (item.id) setDoc(doc(db, 'Orders_Production', item.id), item).catch(console.error);
      }

      await GASService.write('Orders_Production', chunk);
      console.log(`Seeded ${chunk.length} mock orders to Sheets`);
      this.orders = chunk;
    } catch (e) {
      console.warn("Error seeding to GAS:", e);
      this.orders = initialMockOrders.slice(0, 50);
    }
    
    // Also save locally
    localStorage.setItem('prod_orders', JSON.stringify(this.orders));
    this.listeners.forEach(l => l());
  }

  public async triggerForceSeed() {
    await this.seedMockOrders();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getOrders() {
    return this.orders;
  }

  get isDemo() {
    try {
      const savedUserStr = localStorage.getItem('user');
      if (savedUserStr) {
        const u = JSON.parse(savedUserStr);
        return u.employeeId === 'DEMO';
      }
    } catch(e) {}
    return false;
  }

  async setOrders(newOrdersArg: Order[] | ((prev: Order[]) => Order[])) {
    let resolvedOrders: Order[];
    if (typeof newOrdersArg === 'function') {
      resolvedOrders = newOrdersArg(this.orders);
    } else {
      resolvedOrders = newOrdersArg;
    }

    // Optimistic UI update
    this.orders = resolvedOrders;
    localStorage.setItem('prod_orders', JSON.stringify(this.orders));
    this.listeners.forEach(l => l());

    if (this.isDemo) {
      console.log('DEMO user bypassed order write (setOrders)');
      return;
    }

    try {
      const updates = resolvedOrders.map(o => ({...o}));
      for(const update of updates) {
          if(update.id) {
              setDoc(doc(db, 'Orders_Production', update.id), update).catch(console.error);
          }
      }
      await GASService.update('Orders_Production', updates);
    } catch (error) {
       console.error("Update Error:", error);
    }
  }

  async updateOrder(id: string, updates: Partial<Order>) {
    // Optimistic UI update
    const currentOrder = this.orders.find(o => o.id === id);
    if (!currentOrder) return;

    this.orders = this.orders.map(o => o.id === id ? { ...o, ...updates } : o);
    localStorage.setItem('prod_orders', JSON.stringify(this.orders));
    this.listeners.forEach(l => l());

    if (updates.status && updates.status !== currentOrder.status) {
        try {
            const userStr = localStorage.getItem('user');
            const currentUser = userStr ? JSON.parse(userStr) : null;
            logSystemActivity(
                currentUser,
                'Orders_Production',
                'STATUS_CHANGE',
                `Changed status of batch/order ${id} from "${currentOrder.status}" to "${updates.status}"`
            );
        } catch (err) {}
    }

    if (this.isDemo) {
      console.log(`DEMO user bypassed order update (${id})`);
      return;
    }

    try {
      const isoNow = new Date().toISOString();
      const updatedItem = {
        ...currentOrder,
        ...updates,
        updatedAt: isoNow
      };
      if (updatedItem.id) {
          updateDoc(doc(db, 'Orders_Production', updatedItem.id), updatedItem).catch(console.error);
      }
      await GASService.update('Orders_Production', [updatedItem]);
    } catch (error) {
       console.error("Single Update Error:", error);
    }
  }
}

export const ordersStore = new OrdersStore();

export function useSharedOrders() {
  const [orders, setOrders] = useState(ordersStore.getOrders());

  useEffect(() => {
    return ordersStore.subscribe(() => setOrders(ordersStore.getOrders()));
  }, []);

  return [orders, ordersStore.setOrders.bind(ordersStore), ordersStore.updateOrder.bind(ordersStore)] as const;
}
