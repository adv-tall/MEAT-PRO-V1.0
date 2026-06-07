import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Error parsing user from localStorage", e);
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const logToFirebase = async (action: string, userData: User) => {
    if (userData.employeeId === 'DEMO') return;
    try {
      await addDoc(collection(db, 'accessLogs'), {
        action,
        employeeId: userData.employeeId,
        name: userData.name,
        role: userData.role,
        userAgent: navigator.userAgent,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      // Fallback
      console.warn("Failed to log to Firebase, rule issue?", e);
    }
  };

  const login = (userData: User) => {
    setUser(userData);
    // Log login activity to Realtime Firebase
    logToFirebase('LOGIN', userData);

    api.post('write', 'AccessLogs', [{
      timestamp: new Date().toISOString(),
      action: 'LOGIN',
      employeeId: userData.employeeId,
      name: userData.name,
      role: userData.role,
      userAgent: navigator.userAgent
    }]).catch(console.error);
  };

  const logout = () => {
    if (user) {
      // Log logout activity to Realtime Firebase
      logToFirebase('LOGOUT', user);

      api.post('write', 'AccessLogs', [{
        timestamp: new Date().toISOString(),
        action: 'LOGOUT',
        employeeId: user.employeeId,
        name: user.name,
        role: user.role,
        userAgent: navigator.userAgent
      }]).catch(console.error);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
