import React, { createContext, useContext, useState, useEffect } from 'react';

interface VisibilityContextType {
  visibility: Record<string, boolean>;
  setVisibility: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

const VisibilityContext = createContext<VisibilityContextType | undefined>(undefined);

export function VisibilityProvider({ children }: { children: React.ReactNode }) {
  const [visibility, setVisibility] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('module_visibility');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('module_visibility', JSON.stringify(visibility));
  }, [visibility]);

  return (
    <VisibilityContext.Provider value={{ visibility, setVisibility }}>
      {children}
    </VisibilityContext.Provider>
  );
}

export function useVisibility() {
  const context = useContext(VisibilityContext);
  if (context === undefined) {
    throw new Error('useVisibility must be used within a VisibilityProvider');
  }
  return context;
}
