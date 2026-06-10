import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';

export const logSystemActivity = async (
    user: { name?: string, role?: string } | null,
    module: string,
    action: string,
    details: string,
    status: 'Success' | 'Failed' | 'Warning' = 'Success'
) => {
    try {
        await addDoc(collection(db, 'SystemLogs'), {
            timestamp: serverTimestamp(),
            name: user?.name || 'Anonymous',
            role: user?.role || 'Guest',
            ip: 'Application Action',
            module,
            action,
            details,
            status,
            userAgent: navigator.userAgent
        });
    } catch (e) {
        console.error('Failed to log system activity', e);
    }
};
