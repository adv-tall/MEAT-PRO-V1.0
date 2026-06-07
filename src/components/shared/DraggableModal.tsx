import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Draggable from 'react-draggable';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface DraggableModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string | React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  hideHeader?: boolean;
  hideDefaultHeader?: boolean;
  hideCloseButton?: boolean;
  width?: string;
}

export const DraggableModal: React.FC<DraggableModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className = '', 
  headerClassName = '',
  hideHeader = false,
  hideDefaultHeader = false,
  hideCloseButton = false,
  width
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const shouldHideHeader = hideHeader || hideDefaultHeader;
  const containerClass = width || 'max-w-lg';

  // In iframes, a dragged item can get "stuck" to the cursor if the mouse is released outside the frame.
  // react-draggable usually handles this with window mouseup listeners, but sometimes bounds="parent" breaks it.
  // We remove bounds and simplify the DOM structure to prevent transform conflicts with framer-motion.
  const content = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#212c46]/60 backdrop-blur-sm overflow-hidden" 
             onPointerDown={(e) => {
                 // Close when clicking the backdrop
                 if (e.target === e.currentTarget) onClose(); 
             }}>
          {/* @ts-ignore */}
          <Draggable nodeRef={nodeRef} handle=".drag-handle" cancel="button, input, select, textarea, .no-drag">
            <div ref={nodeRef} className={`absolute w-full ${containerClass} pointer-events-auto`} style={{ zIndex: 10000 }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`bg-white rounded-[24px] w-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col max-h-[90vh] relative ${className}`}
              >
                {!shouldHideHeader && (
                  <div className={`drag-handle cursor-move flex justify-between items-center p-4 md:p-6 pb-4 ${headerClassName}`}>
                    <div className="text-[#212c46] font-black uppercase tracking-widest text-sm md:text-[13px] flex-1 pointer-events-none flex items-center gap-2">{title}</div>
                    {!hideCloseButton && (
                      <button onPointerDown={(e) => e.stopPropagation()} onClick={onClose} className="text-[#7a8b95] hover:text-[#a94228] transition-colors rounded-full hover:bg-gray-100 p-1 shrink-0 z-10 cursor-pointer">
                        <X size={18} />
                      </button>
                    )}
                  </div>
                )}
                {shouldHideHeader && !hideDefaultHeader && (
                  <div className="drag-handle absolute top-0 left-0 right-0 h-16 z-10 cursor-move flex justify-end items-start pt-4 px-4 pointer-events-none">
                    {!hideCloseButton && (
                      <button onPointerDown={(e) => e.stopPropagation()} onClick={onClose} className="text-[#7a8b95] hover:text-[#a94228] transition-colors rounded-full hover:bg-gray-100/50 p-1 z-10 cursor-pointer backdrop-blur-md pointer-events-auto">
                        <X size={20} />
                      </button>
                    )}
                  </div>
                )}
                <div className="overflow-y-auto w-full flex-1 min-h-0 px-4 md:px-6 pb-6" style={{ overscrollBehavior: 'contain' }}>
                  {children}
                </div>
              </motion.div>
            </div>
          </Draggable>
        </div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
};
