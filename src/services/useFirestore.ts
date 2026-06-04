import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, doc, DocumentData } from 'firebase/firestore';
import { db } from './firebase';

export function useCollection<T = DocumentData>(collectionName: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(collection(db, collectionName));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      setData(fetchedData);
      setLoading(false);
    }, (err) => {
      console.error(`Error fetching ${collectionName}:`, err);
      setError(err);
      setLoading(false);
    });

    return () => unsubscribe();
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
    return await addDoc(collection(db, collectionName), item);
  };

  const update = async (id: string, item: Partial<T>) => {
    if (isDemo()) {
      console.log(`DEMO user bypassed updateDoc on ${collectionName}/${id}`);
      return;
    }
    const docRef = doc(db, collectionName, id);
    return await updateDoc(docRef, item as any);
  };

  const remove = async (id: string) => {
    if (isDemo()) {
      console.log(`DEMO user bypassed deleteDoc on ${collectionName}/${id}`);
      return;
    }
    const docRef = doc(db, collectionName, id);
    return await deleteDoc(docRef);
  };

  return { data, loading, error, add, update, remove };
}
