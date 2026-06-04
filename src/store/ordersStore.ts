import { useState, useEffect } from 'react';
import { GASService } from '../services/GoogleAppsScriptService';
import { MOCK_ORDERS as initialMockOrders } from '../data/mockOrders';

type Order = any;

class OrdersStore {
  private orders: Order[] = [];
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
      const response = await GASService.read('Orders_Production');
      if (response && response.status === 'success') {
        const gasOrders = response.data?.items || [];
        
        if (gasOrders.length === 0 && !this.isLoaded) {
          // If no data, try to fetch from Orders_PL as fallback, or seed it
          await this.seedMockOrders();
        } else {
          this.orders = gasOrders.sort((a: any, b: any) => String(a.id).localeCompare(String(b.id)));
          this.isLoaded = true;
          this.listeners.forEach(l => l());
        }
      }
    } catch (error) {
      console.warn("GAS Read Error, fallback to local:", error);
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
      // Find the difference/new ones theoretically, or just overwrite/update
      // For now we'll do an update operation on GAS for all resolved orders
      const updates = resolvedOrders.map(o => ({...o}));
      await GASService.update('Orders_Production', updates);
    } catch (error) {
       console.error("GAS Update Error:", error);
    }
  }

  async updateOrder(id: string, updates: Partial<Order>) {
    // Optimistic UI update
    const currentOrder = this.orders.find(o => o.id === id);
    if (!currentOrder) return;

    this.orders = this.orders.map(o => o.id === id ? { ...o, ...updates } : o);
    localStorage.setItem('prod_orders', JSON.stringify(this.orders));
    this.listeners.forEach(l => l());

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
      await GASService.update('Orders_Production', [updatedItem]);
    } catch (error) {
       console.error("GAS Single Update Error:", error);
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
