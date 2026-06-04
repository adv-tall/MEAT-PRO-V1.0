import { useState, useEffect } from 'react';
import { GASService } from './GoogleAppsScriptService';
import { db } from './firebaseConfig';
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const pendingSyncs = new Set<string>();

export function useCollection<T = any>(collectionName: string, initialSeedData?: T[]) {
  const [data, setData] = useState<T[]>(() => {
     try {
       const cached = localStorage.getItem(`gas_cache_${collectionName}`);
       if (cached && cached !== "[]") return JSON.parse(cached);
     } catch(e) {}
     return initialSeedData || [];
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch from Firebase first
      const fbSnapshot = await getDocs(collection(db, collectionName));
      let fbData: any[] = [];
      if (!fbSnapshot.empty) {
        fbData = fbSnapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      }

      // 2. Fetch from GAS
      let gasData: any[] = [];
      const response = await GASService.read(collectionName);
      if (response && response.status === 'success') {
         gasData = response.data?.items || [];
      }

      // 3. Merge data (prefer Firebase, then GAS, then seed)
      let mergedData = [...fbData];
      let needsFbSync = false;
      let itemsToSyncToGas: any[] = [];
      let itemsToSyncToFb: any[] = [];

      // Find items in Firebase that are missing in GAS
      fbData.forEach(fbItem => {
         const existsInGas = gasData.some(g => {
            if (g.id && String(g.id).trim() === String(fbItem.id).trim()) return true;
            if (g.sku && fbItem.sku && String(g.sku).trim() === String(fbItem.sku).trim()) return true;
            if (g.employeeId && fbItem.employeeId && String(g.employeeId).trim() === String(fbItem.employeeId).trim()) return true;
            return false;
         });
         
         if (!existsInGas) {
             itemsToSyncToGas.push(fbItem);
         }
      });

      // Find items in GAS that are missing in Firebase
      gasData.forEach(gasItem => {
         const existsInFb = fbData.some(m => {
            if (m.id && gasItem.id && String(m.id).trim() === String(gasItem.id).trim()) return true;
            if (m.sku && gasItem.sku && String(m.sku).trim() === String(gasItem.sku).trim()) return true;
            if (m.employeeId && gasItem.employeeId && String(m.employeeId).trim() === String(gasItem.employeeId).trim()) return true;
            return false;
         });
         
         if (!existsInFb) {
            mergedData.push(gasItem);
            itemsToSyncToFb.push(gasItem);
         }
      });

      // If still empty, use either cached data or initial seed data
      if (mergedData.length === 0) {
         try {
           const cached = localStorage.getItem(`gas_cache_${collectionName}`);
           if (cached && cached !== "[]") {
               mergedData = JSON.parse(cached);
           }
         } catch(e) {}
         
         if (mergedData.length === 0 && initialSeedData && initialSeedData.length > 0) {
             const chunk = initialSeedData.slice(0, 50).map(item => ({...item, createdAt: new Date().toISOString()}));
             mergedData = chunk;
             
             if (!pendingSyncs.has(collectionName)) {
                 pendingSyncs.add(collectionName);
                 itemsToSyncToFb = [...chunk];
                 itemsToSyncToGas = [...chunk];
             }
         }
      }

      setData(mergedData);
      localStorage.setItem(`gas_cache_${collectionName}`, JSON.stringify(mergedData));

      // Sync missing data back to Firebase
      if (itemsToSyncToFb.length > 0) {
         const syncKey = `sync_fb_${collectionName}`;
         if (!pendingSyncs.has(syncKey)) {
             pendingSyncs.add(syncKey);
             console.log(`Syncing ${itemsToSyncToFb.length} items to Firebase for ${collectionName}`);
             Promise.all(itemsToSyncToFb.map(async (item) => {
                try {
                  if (item.id) await setDoc(doc(db, collectionName, String(item.id)), item);
                } catch(e) { console.error("Firebase sync error", e); }
             })).finally(() => pendingSyncs.delete(syncKey));
         }
      }

      // Sync missing data back to GAS
      if (itemsToSyncToGas.length > 0) {
         const syncKey = `sync_gas_${collectionName}`;
         if (!pendingSyncs.has(syncKey)) {
             pendingSyncs.add(syncKey);
             console.log(`Syncing ${itemsToSyncToGas.length} items to GAS for ${collectionName}`);
             GASService.write(collectionName, itemsToSyncToGas)
                .catch(e => console.error("GAS sync error", e))
                .finally(() => pendingSyncs.delete(syncKey));
         }
      }

    } catch (err: any) {
      console.error(`Error fetching ${collectionName}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [collectionName]);

  const isDemo = () => {
    try {
      const savedUserStr = localStorage.getItem('user');
      if (savedUserStr) {
        const u = JSON.parse(savedUserStr);
        return u.employeeId === 'DEMO';
      }
    } catch(e) {}
    return false;
  };

  const add = async (item: Omit<T, 'id'>) => {
    if (isDemo()) {
      console.log(`DEMO user bypassed addDoc to ${collectionName}`);
      return { id: 'demo-' + Date.now() }; // mock ref
    }
    
    const tempId = `temp-${Date.now()}`;
    const newItem = { id: tempId, ...item, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as unknown as T;
    
    setData(prev => {
        const next = [...prev, newItem];
        localStorage.setItem(`gas_cache_${collectionName}`, JSON.stringify(next));
        return next;
    });
    
    try {
      // Create in Firebase
      await setDoc(doc(db, collectionName, tempId), newItem);
      // Create in GAS
      await GASService.write(collectionName, [newItem]);
      return { id: tempId };
    } catch(e) {
      console.error(`Failed to add item to ${collectionName}`, e);
      throw e;
    }
  };

  const update = async (id: string, item: Partial<T>) => {
    if (isDemo()) {
      console.log(`DEMO user bypassed updateDoc on ${collectionName}/${id}`);
      return;
    }

    const updatedItem = { ...item, updatedAt: new Date().toISOString() };
    setData(prev => {
        const next = prev.map(d => (d as any).id === id ? { ...d, ...updatedItem } : d);
        localStorage.setItem(`gas_cache_${collectionName}`, JSON.stringify(next));
        return next;
    });

    try {
      // Update in Firebase
      await updateDoc(doc(db, collectionName, id), updatedItem);
    } catch(e) {
      console.error(`Firebase update failed for ${id} in ${collectionName}`, e);
    }

    try {
      // Update in GAS
      await GASService.update(collectionName, [{ id, ...updatedItem }]);
    } catch(e) {
      console.error(`GAS update failed for ${id} in ${collectionName}`, e);
    }
  };

  const remove = async (id: string) => {
    if (isDemo()) {
      console.log(`DEMO user bypassed deleteDoc on ${collectionName}/${id}`);
      return;
    }

    setData(prev => {
        const next = prev.filter(d => (d as any).id !== id);
        localStorage.setItem(`gas_cache_${collectionName}`, JSON.stringify(next));
        return next;
    });

    try {
      // Delete in Firebase
      await deleteDoc(doc(db, collectionName, id));
    } catch(e) {
      console.error(`Firebase delete failed for ${id} in ${collectionName}`, e);
    }
    
    try {
      // Delete in GAS
      await GASService.delete(collectionName, [{ id }]);
    } catch(e) {
      console.error(`GAS delete failed for ${id} in ${collectionName}`, e);
    }
  };

  const refresh = () => {
    fetchData();
  };

  return { data, loading, error, add, update, remove, refresh };
}

