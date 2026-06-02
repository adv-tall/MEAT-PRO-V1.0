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

    if (isDemo && action === 'write') {
      console.log('DEMO user write intercepted to localStorage:', sheet, data);
      const cacheKey = `demo_db_${sheet}`;
      const existingStr = localStorage.getItem(cacheKey) || '[]';
      let existing = [];
      try { existing = JSON.parse(existingStr); } catch(e){}
      if (Array.isArray(data)) {
          existing.push(...data);
      } else {
          if (data) existing.push(data);
      }
      localStorage.setItem(cacheKey, JSON.stringify(existing));
      return { status: 'success', message: 'Saved locally for DEMO user', data: existing } as any;
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
    if ((data.employeeId === 'DEMO' && data.idCard === 'DEMO123456789') || 
        (data.employeeId === 'U001' && data.idCard === 'ADMIN12345678') ||
        (data.employeeId === 'DEV001' && data.idCard === '1234567890123')) {
      const isOperator = data.employeeId === 'DEMO';
      const isSuperAdmin = data.employeeId === 'DEV001';
      return {
        status: 'success',
        data: {
          id: isOperator ? '3' : (isSuperAdmin ? '1' : '2'),
          employeeId: data.employeeId,
          name: isOperator ? 'Demo Operator' : (isSuperAdmin ? 'Super Admin' : 'Demo Admin'),
          role: isOperator ? 'Viewer' : (isSuperAdmin ? 'Developer' : 'Administrator'),
          isDev: isSuperAdmin,
          avatar: 'https://drive.google.com/thumbnail?id=1Z_fRbN9S4aA7OkHb3mlim_t60wIT4huY&sz=w400',
          permissions: {
            canCreate: !isOperator,
            canEdit: !isOperator,
            canApprove: !isOperator,
            canVerify: !isOperator,
          }
        }
      };
    }
    return { status: 'error', message: 'Invalid credentials' };
  }
  
  return { status: 'success', data: [] };
};
