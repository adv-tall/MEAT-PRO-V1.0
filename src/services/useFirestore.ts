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
      try {
          const response = await GASService.read(collectionName);
          if (response && response.status === 'success') {
             gasData = response.data?.items || [];
          }
      } catch (gasErr) {
          console.error(`GAS read failed for ${collectionName}:`, gasErr);
      }

      // 3. Merge data (prefer GAS, then Firebase, then seed)
      let mergedData: any[] = [];
      let itemsToSyncToFb: any[] = [];
      let itemsToSyncToGas: any[] = [];

      const mergedDataMap = new Map();

      // Ensure all GAS data makes it into our merged state (GAS is single source of truth for items actually saved)
      gasData.forEach((gasItem: any) => {
          const key = String(gasItem.id || gasItem.sku || Math.random()).trim();
          mergedDataMap.set(key, gasItem);
      });

      // Include Firebase data that might be missing from GAS and requires sync
      fbData.forEach(fbItem => {
         const key = String(fbItem.id || fbItem.sku || '').trim();
         
         const existsInGas = gasData.some(g => {
            if (g.id && fbItem.id && String(g.id).trim() === String(fbItem.id).trim()) return true;
            if (g.sku && fbItem.sku && String(g.sku).trim() === String(fbItem.sku).trim()) return true;
            return false;
         });
         
         if (!existsInGas && fbItem.id && fbItem.id.toString().trim() !== '') {
             if (!mergedDataMap.has(key)) {
                 mergedDataMap.set(key, fbItem);
             }
             itemsToSyncToGas.push(fbItem);
         }
      });

      // Find items in GAS that are missing in Firebase to sync back to Firebase
      gasData.forEach(gasItem => {
         const existsInFb = fbData.some(m => {
            if (m.id && gasItem.id && String(m.id).trim() === String(gasItem.id).trim()) return true;
            if (m.sku && gasItem.sku && String(m.sku).trim() === String(gasItem.sku).trim()) return true;
            return false;
         });
         
         if (!existsInFb) {
            itemsToSyncToFb.push(gasItem);
         } else {
             itemsToSyncToFb.push(gasItem); // Sync to override stale FB data
         }
      });
      
      mergedData = Array.from(mergedDataMap.values());

      // Merge initial seed data if missing
      if (initialSeedData && initialSeedData.length > 0) {
         initialSeedData.forEach((seedItem: any) => {
            const key = String(seedItem.id || seedItem.sku || '').trim();
            const exists = mergedData.some((m: any) => {
                if (m.id && seedItem.id && String(m.id).trim() === String(seedItem.id).trim()) return true;
                if (m.sku && seedItem.sku && String(m.sku).trim() === String(seedItem.sku).trim()) return true;
                return false;
            });
            if (!exists) {
                const itemToInsert = { ...seedItem, createdAt: new Date().toISOString() };
                mergedData.push(itemToInsert);
                itemsToSyncToFb.push(itemToInsert);
                itemsToSyncToGas.push(itemToInsert);
            }
         });
      }

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
                  let docId = String(item.id || item.sku || "").trim();
                  if (!docId) docId = Math.random().toString(36).substring(7);
                  await setDoc(doc(db, collectionName, docId), item);
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
    const itemId = (item as any).id || `temp-${Date.now()}`;
    const newItem = { ...item, id: itemId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as unknown as T;
    
    setData(prev => {
        const next = [...prev, newItem];
        localStorage.setItem(`gas_cache_${collectionName}`, JSON.stringify(next));
        return next;
    });

    if (isDemo()) {
      console.log(`DEMO user bypassed addDoc to ${collectionName}`);
      return { id: itemId }; // mock ref
    }
    
    try {
      // Create in Firebase
      await setDoc(doc(db, collectionName, itemId), newItem);
    } catch(e) {
      console.error(`Firebase add failed for ${collectionName}`, e);
    }

    try {
      // Create in GAS
      await GASService.write(collectionName, [newItem]);
      return { id: itemId };
    } catch(e) {
      console.error(`GAS add failed for ${collectionName}`, e);
      return { id: itemId }; // Do not throw, allow frontend to proceed
    }
  };

  const update = async (id: string, item: Partial<T>) => {
    const updatedItem = { ...item, updatedAt: new Date().toISOString() };
    setData(prev => {
        const next = prev.map(d => (d as any).id === id ? { ...d, ...updatedItem } : d);
        localStorage.setItem(`gas_cache_${collectionName}`, JSON.stringify(next));
        return next;
    });

    if (isDemo()) {
      console.log(`DEMO user bypassed updateDoc on ${collectionName}/${id}`);
      return;
    }

    try {
      // Update in Firebase
      if (id && String(id).trim() !== '') {
          await setDoc(doc(db, collectionName, String(id).trim()), updatedItem, { merge: true });
      }
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
    setData(prev => {
        const next = prev.filter(d => (d as any).id !== id);
        localStorage.setItem(`gas_cache_${collectionName}`, JSON.stringify(next));
        return next;
    });

    if (isDemo()) {
      console.log(`DEMO user bypassed deleteDoc on ${collectionName}/${id}`);
      return;
    }

    try {
      // Delete in Firebase
      if (id && String(id).trim() !== '') {
          await deleteDoc(doc(db, collectionName, String(id).trim()));
      }
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

