import { useState, useEffect } from 'react';
import { GASService } from './GoogleAppsScriptService';

export function useCollection<T = any>(collectionName: string, initialSeedData?: T[]) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await GASService.read(collectionName);
      if (response && response.status === 'success') {
        const fetchedData: T[] = response.data?.items || [];
        
        if (fetchedData.length === 0 && initialSeedData && initialSeedData.length > 0) {
            console.log(`Seeding ${collectionName} with ${initialSeedData.length} items`);
            const chunk = initialSeedData.slice(0, 50).map(item => ({...item, createdAt: new Date().toISOString()}));
            try {
               await GASService.write(collectionName, chunk);
            } catch(e) {
               console.warn("GAS write failed, using local seed only");
            }
            setData(chunk as unknown as T[]);
        } else if (fetchedData.length > 0) {
            setData(fetchedData);
        } else {
            setData(initialSeedData || []);
        }
      }
    } catch (err: any) {
      console.error(`Error fetching ${collectionName} from GAS:`, err);
      setData(initialSeedData || []);
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
    
    // Generate a temporary ID for optimistic UI
    const tempId = `temp-${Date.now()}`;
    const newItem = { id: tempId, ...item, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as unknown as T;
    
    setData(prev => [...prev, newItem]);
    
    try {
      await GASService.write(collectionName, [newItem]);
      return { id: tempId };
    } catch(e) {
      console.error(`Failed to add item to ${collectionName}`, e);
      // Revert optimistic update ideally, but skipping for brevity
      throw e;
    }
  };

  const update = async (id: string, item: Partial<T>) => {
    if (isDemo()) {
      console.log(`DEMO user bypassed updateDoc on ${collectionName}/${id}`);
      return;
    }

    setData(prev => prev.map(d => (d as any).id === id ? { ...d, ...item, updatedAt: new Date().toISOString() } : d));

    try {
      await GASService.update(collectionName, [{ id, ...item, updatedAt: new Date().toISOString() }]);
    } catch(e) {
      console.error(`Failed to update item ${id} in ${collectionName}`, e);
      throw e;
    }
  };

  const remove = async (id: string) => {
    if (isDemo()) {
      console.log(`DEMO user bypassed deleteDoc on ${collectionName}/${id}`);
      return;
    }

    setData(prev => prev.filter(d => (d as any).id !== id));

    try {
      await GASService.delete(collectionName, [{ id }]);
    } catch(e) {
      console.error(`Failed to delete item ${id} from ${collectionName}`, e);
      throw e;
    }
  };

  const refresh = () => {
    fetchData();
  };

  return { data, loading, error, add, update, remove, refresh };
}

