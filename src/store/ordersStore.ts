import { useState, useEffect } from 'react';

// Shared database implementation to simulate real-time updates across components
type Order = any; // Assuming any structure the app uses for now

import { MOCK_ORDERS as initialMockOrders } from '../data/mockOrders';

class OrdersStore {
  private orders: Order[];
  private listeners: Set<() => void>;

  constructor() {
    this.listeners = new Set();
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

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getOrders() {
    return this.orders;
  }

  setOrders(newOrders: Order[]) {
    this.orders = newOrders;
    localStorage.setItem('prod_orders', JSON.stringify(this.orders));
    this.listeners.forEach(l => l());
  }

  updateOrder(id: string, updates: Partial<Order>) {
    this.orders = this.orders.map(o => o.id === id ? { ...o, ...updates } : o);
    localStorage.setItem('prod_orders', JSON.stringify(this.orders));
    this.listeners.forEach(l => l());
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
