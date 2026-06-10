import { useEffect } from 'react';
import { collection, onSnapshot, query, where, limit } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import Swal from 'sweetalert2';

export const useMachineAlert = () => {
  useEffect(() => {
    // Only query open breakdowns
    const q = query(
      collection(db, 'Machine_Breakdowns'),
      where('status', '==', 'Open'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          
          Swal.fire({
            title: 'CRITICAL MACHINERY ERROR',
            html: `
              <div style="text-align: left;">
                <p style="font-weight: bold; color: #932c2e;">Machine: ${data.machineName || data.machineId || 'Unknown'}</p>
                <p style="font-size: 12px; margin-top: 4px;">Problem: ${data.problem || 'N/A'}</p>
                <p style="font-size: 12px;">Reported By: ${data.reportedBy || 'N/A'}</p>
              </div>
            `,
            icon: 'error',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 10000,
            timerProgressBar: true,
            background: '#fff5f5',
            color: '#932c2e',
            iconColor: '#932c2e',
          });
        }
      });
    }, (error) => {
      console.warn('Machine Alert Snapshot Error:', error);
    });

    return () => unsubscribe();
  }, []);
};
