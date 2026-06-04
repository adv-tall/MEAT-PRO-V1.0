import { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  writeBatch 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../services/firebase';
import { MOCK_ORDERS as initialMockOrders } from '../data/mockOrders';

type Order = any;

class OrdersStore {
  private orders: Order[] = [];
  private listeners: Set<() => void> = new Set();
  private isLoaded: boolean = false;
  private unsubscribeFn: (() => void) | null = null;

  constructor() {
    this.initFirestoreListener();
  }

  private initFirestoreListener() {
    try {
      const colRef = collection(db, 'orders');
      this.unsubscribeFn = onSnapshot(colRef, (snapshot) => {
        const dbOrders: Order[] = [];
        snapshot.forEach((docSnap) => {
          dbOrders.push(docSnap.data() as Order);
        });

        if (dbOrders.length === 0 && !this.isLoaded) {
          // Empty remote database -> seed with mock orders if authenticated, else fallback to local/storage
          if (auth.currentUser) {
            this.seedMockOrders();
          } else {
            const stored = localStorage.getItem('prod_orders');
            if (stored) {
              try {
                this.orders = JSON.parse(stored);
              } catch (e) {
                this.orders = initialMockOrders;
              }
            } else {
              this.orders = initialMockOrders;
            }
            this.isLoaded = true;
            this.listeners.forEach(l => l());
          }
        } else {
          // Sort items by ID so they stay in precise lexicographical order
          this.orders = dbOrders.sort((a, b) => a.id.localeCompare(b.id));
          this.isLoaded = true;
          this.listeners.forEach(l => l());
        }
      }, (error) => {
        // Fallback to local storage if user gets permission denied during unauthenticated load
        console.warn("Firestore snapshot listener failed, using local fallback:", error);
        
        const stored = localStorage.getItem('prod_orders');
        if (stored) {
          try {
            this.orders = JSON.parse(stored);
          } catch (e) {
            this.orders = initialMockOrders;
          }
        } else {
          this.orders = initialMockOrders;
        }
        this.isLoaded = true;
        this.listeners.forEach(l => l());
        
        // Log the permission error to console for diagnostic purposes without crashing the entire React UI
        try {
          handleFirestoreError(error, OperationType.LIST, 'orders');
        } catch (diagnosticError) {
          console.error("Firestore Permission Notice / Diagnostic Log:", diagnosticError);
        }
      });
    } catch (e) {
      console.error("Failed to initialize Firestore listener:", e);
    }
  }

  private async seedMockOrders() {
    this.isLoaded = true;
    
    // Attempt Firestore persistence first
    try {
      const batch = writeBatch(db);
      const isoNow = new Date().toISOString();
      
      // Limit to 450 items to stay safely under Firestore's 500 batch limit
      const itemsToSeed = initialMockOrders.slice(0, 450);
      
      itemsToSeed.forEach((o) => {
        const docRef = doc(db, 'orders', o.id);
        const orderDoc = {
          id: o.id,
          sku: o.sku,
          name: o.name,
          qty: o.qty || 1,
          fgKg: o.fgKg || 0,
          sfgKg: o.sfgKg || 0,
          batterKg: o.batterKg || 0,
          batches: o.batches || 0,
          batchSize: o.batchSize || 100,
          customer: o.customer || '',
          deadline: o.deadline || '12:00',
          status: o.status || 'PLANNED',
          isReplacement: !!o.isReplacement,
          shift: o.shift || 'Morning',
          currentStep: o.currentStep || 'Entry',
          mixingCount: o.mixingCount !== undefined ? o.mixingCount : 0,
          formingCount: o.formingCount !== undefined ? o.formingCount : 0,
          cookingCount: o.cookingCount !== undefined ? o.cookingCount : 0,
          coolingCount: o.coolingCount !== undefined ? o.coolingCount : 0,
          cuttingCount: o.cuttingCount !== undefined ? o.cuttingCount : 0,
          packingCount: o.packingCount !== undefined ? o.packingCount : 0,
          whCount: o.whCount !== undefined ? o.whCount : 0,
          createdAt: isoNow,
          updatedAt: isoNow
        };
        batch.set(docRef, orderDoc);
      });
      
      await batch.commit();
      console.log(`Seeded ${itemsToSeed.length} mock orders successfully into Firestore`);
    } catch (err) {
      console.warn("Failsafe: error seeding mock orders (might be permission issue, using local fallback):", err);
      // Fallback locally
      const stored = localStorage.getItem('prod_orders');
      if (stored) {
        try {
          this.orders = JSON.parse(stored);
        } catch (e) {
          this.orders = initialMockOrders;
        }
      } else {
        this.orders = initialMockOrders;
      }
    }
    
    this.listeners.forEach(l => l());
  }

  // Force seed method to expose to UI
  public triggerForceSeed() {
    this.seedMockOrders();
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
      const batch = writeBatch(db);
      const isoNow = new Date().toISOString();
      
      resolvedOrders.forEach(o => {
        const docRef = doc(db, 'orders', o.id);
        const orderDoc = {
          id: o.id,
          sku: o.sku,
          name: o.name,
          qty: o.qty || 1,
          fgKg: o.fgKg || 0,
          sfgKg: o.sfgKg || 0,
          batterKg: o.batterKg || 0,
          deadline: o.deadline || '12:00',
          status: o.status || 'PLANNED',
          isReplacement: !!o.isReplacement,
          shift: o.shift || 'Morning',
          currentStep: o.currentStep || 'Entry',
          mixingCount: o.mixingCount !== undefined ? o.mixingCount : 0,
          formingCount: o.formingCount !== undefined ? o.formingCount : 0,
          cookingCount: o.cookingCount !== undefined ? o.cookingCount : 0,
          coolingCount: o.coolingCount !== undefined ? o.coolingCount : 0,
          cuttingCount: o.cuttingCount !== undefined ? o.cuttingCount : 0,
          packingCount: o.packingCount !== undefined ? o.packingCount : 0,
          whCount: o.whCount !== undefined ? o.whCount : 0,
          createdAt: o.createdAt || isoNow,
          updatedAt: isoNow
        };
        batch.set(docRef, orderDoc);
      });
      
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'orders');
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
      console.log(`DEMO user bypassed order update (orders/${id})`);
      return;
    }

    try {
      const docRef = doc(db, 'orders', id);
      const isoNow = new Date().toISOString();
      
      const fullUpdatedOrder = {
        ...currentOrder,
        ...updates,
        updatedAt: isoNow
      };
      
      await setDoc(docRef, fullUpdatedOrder, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
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
