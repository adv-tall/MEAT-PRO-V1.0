import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function SecurityGuard({ children }: { children: React.ReactNode }) {
  const [isScreenshotting, setIsScreenshotting] = useState(false);
  const { user } = useAuth();
  
  // Admin or Manager roles have permission to print/screenshot without blurring
  const hasPermission = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase().includes('manager');

  useEffect(() => {
    // Attempt to catch PrintScreen or common screenshot shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'PrintScreen' || 
        (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) || // Mac shortcuts
        (e.ctrlKey && e.key === 'p') // Print
      ) {
        setIsScreenshotting(true);
        // Unblur after a few seconds
        setTimeout(() => setIsScreenshotting(false), 3000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const blurClass = !hasPermission && isScreenshotting ? 'filter blur-xl select-none' : '';
  const printBlurClass = !hasPermission ? 'print:filter print:blur-xl print:select-none' : '';

  return (
    <div 
      className={`min-h-screen transition-all duration-200 ${blurClass} ${printBlurClass}`}
    >
      {!hasPermission && isScreenshotting && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/50 print:flex">
          <p className="text-2xl font-bold text-red-600 drop-shadow-md">
            Screen capture is disabled for security reasons.
          </p>
        </div>
      )}
      
      {/* Watermark only visible during print or screenshot */}
      {user && (
        <div className={`pointer-events-none fixed inset-0 z-50 overflow-hidden opacity-[0.04] mix-blend-multiply ${isScreenshotting ? 'block' : 'hidden print:block'}`}>
          <div className="flex h-[200%] w-[200%] -translate-x-1/4 -translate-y-1/4 -rotate-45 flex-wrap content-start">
            {Array.from({ length: 150 }).map((_, i) => (
              <div key={i} className="p-10 text-3xl font-bold text-black whitespace-nowrap">
                {`${user.name} (${user.employeeId})`}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
}
