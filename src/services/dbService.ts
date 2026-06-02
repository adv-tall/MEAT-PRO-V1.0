export interface User {
  id?: number | string;
  name: string;
  position: string;
  email: string;
  avatar: string;
  permissions?: Record<string, number[]>;
  isDev?: boolean;
}

// Mock database service for storing user permissions
// In a real app, this would connect to a backend API or Firebase

const STORAGE_KEY = 'thaimungmee_users';

export const dbService = {
  getStatus: async () => {
    // Simulate checking connection
    return { connected: true };
  },

  getUserPermissions: async (): Promise<User[]> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return [];
    } catch (e) {
      console.error('Error reading from local storage', e);
      return [];
    }
  },

  saveUserPermission: async (user: User): Promise<void> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let users: User[] = stored ? JSON.parse(stored) : [];
      
      const existingIndex = users.findIndex(u => u.id === user.id || u.id?.toString() === (user as any).userId);
      
      if (existingIndex >= 0) {
        users[existingIndex] = { ...users[existingIndex], ...user };
      } else {
        users.push(user);
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Error saving to local storage', e);
      throw e;
    }
  }
};
