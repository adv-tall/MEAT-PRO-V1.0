/// <reference types="vite/client" />
import { ApiResponse } from '../types';

const SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || '';

// Output setup status for easy debugging
console.log('App initialization - GAS Backend URL configured:', !!SCRIPT_URL);

// Cache utility for static data
export const cache = {
  get: (key: string) => {
    const item = localStorage.getItem(`wms_cache_${key}`);
    if (!item) return null;
    const parsed = JSON.parse(item);
    if (Date.now() > parsed.expiry) {
      localStorage.removeItem(`wms_cache_${key}`);
      return null;
    }
    return parsed.data;
  },
  set: (key: string, data: any, ttlMinutes: number = 60) => {
    const expiry = Date.now() + ttlMinutes * 60 * 1000;
    localStorage.setItem(`wms_cache_${key}`, JSON.stringify({ data, expiry }));
  },
  clear: (key?: string) => {
    if (key) localStorage.removeItem(`wms_cache_${key}`);
    else {
      Object.keys(localStorage)
        .filter(k => k.startsWith('wms_cache_'))
        .forEach(k => localStorage.removeItem(k));
    }
  }
};

export const api = {
  post: async <T = any>(action: string, sheet?: string, data?: any, params?: { limit?: number, offset?: number }): Promise<ApiResponse<T>> => {
    // Intercept DEMO user writes
    const savedUserStr = localStorage.getItem('user');
    let isDemo = false;
    if (savedUserStr) {
      try {
        const u = JSON.parse(savedUserStr);
        if (u.employeeId === 'DEMO') isDemo = true;
      } catch(e) {}
    }

    if (isDemo && ['write', 'update', 'delete', 'sync'].includes(action)) {
      console.log(`DEMO user action '${action}' intercepted to localStorage:`, sheet, data);
      const cacheKey = `demo_db_${sheet}`;
      const existingStr = localStorage.getItem(cacheKey) || '[]';
      let existing = [];
      try { existing = JSON.parse(existingStr); } catch(e){}
      
      if (action === 'write') {
        if (Array.isArray(data)) {
            existing.push(...data);
        } else {
            if (data) existing.push(data);
        }
      } else if (action === 'update' || action === 'delete') {
         // for simplicity, demo user update/delete is mocked success without actual local logic
         console.log(`DEMO action ${action} mocked success.`);
      }
      localStorage.setItem(cacheKey, JSON.stringify(existing));
      return { status: 'success', message: `Saved locally for DEMO user (${action})`, data: existing } as any;
    }

    if (!SCRIPT_URL) {
      console.warn('VITE_APPS_SCRIPT_URL is not set. Using mock response.');
      return mockResponse(action, data);
    }
    
    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ action, sheet, data, ...params }),
      });
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
};

// Mock response for development if URL is not set
const mockResponse = async (action: string, data: any): Promise<ApiResponse> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  if (action === 'login') {
    const userUpper = (data.employeeId || '').toUpperCase();
    
    // DEMO
    if (userUpper === 'DEMO') {
      return {
        status: 'success',
        data: {
          id: 'DEMO',
          employeeId: 'DEMO',
          name: 'Demo Visitor',
          role: 'Viewer',
          email: 'demo@salepro.com',
          isDev: false,
          avatar: 'https://i.pravatar.cc/150?img=1',
          permissions: {}
        }
      };
    }
    
    // DEVELOPERS
    if (userUpper === 'DEV001' || userUpper === 'U001') {
      return {
        status: 'success',
        data: {
          id: 'DEV',
          employeeId: userUpper,
          name: 'System Developer',
          role: 'Administrator',
          email: 'dev@salepro.com',
          isDev: true,
          avatar: 'https://drive.google.com/thumbnail?id=1Z_fRbN9S4aA7OkHb3mlim_t60wIT4huY&sz=w400',
          permissions: { '*': [1, 2, 3, 4] }
        }
      };
    }

    // OPERATORS
    if (userUpper === 'OP001') {
      return {
        status: 'success',
        data: {
          id: 'OP',
          employeeId: userUpper,
          name: 'General Worker',
          role: 'Operator',
          email: 'operator@salepro.com',
          isDev: false,
          avatar: 'https://i.pravatar.cc/150?img=11',
          permissions: {
             'daily_board': [1,2,3,4], // full access
             'planning': [1] // viewer
          }
        }
      };
    }

    // PLANNERS
    if (userUpper === 'PL001') {
      return {
        status: 'success',
        data: {
          id: 'PL',
          employeeId: userUpper,
          name: 'Planning Supervisor',
          role: 'Planner',
          email: 'planner@salepro.com',
          isDev: false,
          avatar: 'https://i.pravatar.cc/150?img=5',
          permissions: {
             'planning': [1,2,3,4],
             'daily_board': [1,2,3,4]
          }
        }
      };
    }

    // UNREGISTERED EMPLOYEE CHECK
    // If not matching any registered users in Firestore later, we simulate here
    // For now, let's treat "GUEST" as an unregistered employee
    if (userUpper === 'GUEST') {
      return {
         status: 'success',
         data: {
            id: 'GUEST',
            employeeId: 'GUEST_999',
            name: 'Unregistered Employee',
            role: 'Employee',
            email: 'guest@salepro.com',
            isDev: false,
            avatar: 'https://i.pravatar.cc/150?img=2',
            permissions: {} // empty means viewer
         }
      }
    }

    return { status: 'error', message: 'User not found in system or incorrect password.' };
  }
  
  return { status: 'success', data: [] };
};
