import React, { useRef, useEffect, useState } from 'react';
import { useNotifications, Notification } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, Check, Trash2, X, AlertCircle, AlertTriangle, ShieldCheck, Sparkles, Factory,
  Clock, CalendarClock, Box, CalendarDays, ExternalLink, Activity
} from 'lucide-react';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification, clearAll } = useNotifications();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'warn-qa' | 'info'>('all');

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Filter logic
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true;
    if (activeTab === 'critical') return n.severity === 'critical';
    if (activeTab === 'warn-qa') return n.severity === 'warning' || n.severity === 'qa';
    if (activeTab === 'info') return n.severity === 'info';
    return true;
  });

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          icon: <AlertCircle size={15} className="animate-bounce" />,
          bg: 'bg-red-50 border-red-100',
          textColor: 'text-red-700',
          iconColor: 'bg-red-500 text-white shadow-sm shadow-red-200'
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={15} />,
          bg: 'bg-amber-50 border-amber-100',
          textColor: 'text-amber-800',
          iconColor: 'bg-amber-500 text-white shadow-sm shadow-amber-100'
        };
      case 'qa':
        return {
          icon: <ShieldCheck size={15} />,
          bg: 'bg-sky-50 border-sky-100',
          textColor: 'text-sky-800',
          iconColor: 'bg-sky-500 text-white shadow-sm shadow-sky-100'
        };
      case 'info':
      default:
        return {
          icon: <Sparkles size={15} />,
          bg: 'bg-slate-50 border-slate-100',
          textColor: 'text-[#212c46]',
          iconColor: 'bg-[#212c46] text-white shadow-sm shadow-slate-200'
        };
    }
  };

  const handleAction = (n: Notification) => {
    markAsRead(n.id);
    onClose();
    if (n.actionLink) {
      navigate(n.actionLink);
    }
  };

  const formatDistance = (date: Date) => {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'JUST NOW';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="notification-center-dropdown-root" className="relative">
          <motion.div
            ref={dropdownRef}
            id="notification-center-panel"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-3 w-[450px] bg-white rounded-2xl border border-[#eaeaec] shadow-[0_20px_50px_rgba(33,44,70,0.2)] md:mr-0 z-50 overflow-hidden flex flex-col font-sans"
          >
            {/* Header */}
            <div id="notif-header" className="p-4 bg-[#212c46] text-white flex justify-between items-center relative">
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-[#d4af37] via-[#f59e0b] to-[#dc2626]"></div>
              <div className="flex items-center gap-2.5 mt-1">
                <Bell size={18} className="text-[#d4af37]" />
                <span className="text-[12px] font-black tracking-widest uppercase mt-0.5">Alert & Event Center</span>
                {unreadCount > 0 && (
                  <span className="bg-[#b91c1c] text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">
                    {unreadCount} NEW
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                {notifications.length > 0 && (
                  <button 
                    id="btn-mark-all-read"
                    onClick={markAllAsRead}
                    className="text-[10px] font-semibold text-gray-300 hover:text-white uppercase tracking-widest flex items-center gap-1.5 cursor-pointer hover:bg-white/10 px-2 py-1 rounded"
                    title="Mark all as read"
                  >
                    <Check size={12} strokeWidth={2.5} /> Mark read
                  </button>
                )}
                <button 
                  id="btn-clear-all"
                  onClick={clearAll}
                  className="text-gray-300 hover:text-red-300 cursor-pointer p-1 rounded"
                  title="Clear all notifications"
                >
                  <Trash2 size={13} />
                </button>
                <button 
                  onClick={onClose}
                  className="text-gray-400 hover:text-white cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Quick Filter tabs */}
            <div id="notif-tabs" className="flex border-b border-gray-100 bg-slate-50 px-2.5 py-2 gap-1.5 shrink-0">
              <button 
                id="notif-tab-all"
                onClick={() => setActiveTab('all')}
                className={`text-[9px] font-black uppercase tracking-widest py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'all' 
                    ? 'bg-[#212c46] text-white' 
                    : 'text-[#7a8b95] hover:bg-slate-200'
                }`}
              >
                ALL ({notifications.length})
              </button>
              <button 
                id="notif-tab-crit"
                onClick={() => setActiveTab('critical')}
                className={`text-[9px] font-black uppercase tracking-widest py-1.5 px-3 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === 'critical' 
                    ? 'bg-red-600 text-white' 
                    : 'text-red-500 hover:bg-red-50'
                }`}
              >
                CRITICAL ({notifications.filter(n => n.severity === 'critical').length})
              </button>
              <button 
                id="notif-tab-warn"
                onClick={() => setActiveTab('warn-qa')}
                className={`text-[9px] font-black uppercase tracking-widest py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'warn-qa' 
                    ? 'bg-[#b7a159] text-white' 
                    : 'text-[#b7a159] hover:bg-[#b7a159]/10'
                }`}
              >
                QUALITY & DELAYS ({notifications.filter(n => n.severity === 'warning' || n.severity === 'qa').length})
              </button>
              <button 
                id="notif-tab-info"
                onClick={() => setActiveTab('info')}
                className={`text-[9px] font-black uppercase tracking-widest py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'info' 
                    ? 'bg-sky-700 text-white' 
                    : 'text-sky-600 hover:bg-sky-50'
                }`}
              >
                PLANNING ({notifications.filter(n => n.severity === 'info').length})
              </button>
            </div>

            {/* Notifications Scroller container */}
            <div id="notif-scroller" className="max-h-[360px] overflow-y-auto divide-y divide-gray-100 flex flex-col">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center text-slate-400">
                  <ShieldCheck size={36} className="text-slate-300 stroke-[1.5] mb-2" />
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5">ALL QUIET ON CONSOLE</p>
                  <p className="text-[10px] text-slate-400">No signals matching your current filters resolved.</p>
                </div>
              ) : (
                filteredNotifications.map((n) => {
                  const s = getSeverityStyles(n.severity);
                  return (
                    <div 
                      key={n.id}
                      id={`notif-item-${n.id}`}
                      className={`p-3.5 hover:bg-slate-50/80 transition-colors flex gap-3 items-start relative ${
                        !n.isRead ? 'bg-gradient-to-r from-blue-50/30 to-transparent' : ''
                      }`}
                    >
                      {/* Active indicator bar */}
                      {!n.isRead && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-sky-500 shadow-[0_0_8px_#3b82f6]"></div>
                      )}

                      {/* Icon */}
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${s.iconColor}`}>
                        {s.icon}
                      </div>

                      {/* Info & Details */}
                      <div className="flex-1 flex flex-col gap-0.5 text-left min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <span className="text-[10px] font-black tracking-widest text-[#7a8b95] uppercase leading-none">
                            {n.category}
                          </span>
                          <span className="text-[9px] text-[#a2aeb6] font-bold tracking-wider shrink-0 uppercase">
                            {formatDistance(n.timestamp)}
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-[#212c46] tracking-tight leading-snug break-words uppercase">
                          {n.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-2.5 break-words">
                          {n.description}
                        </p>

                        <div className="flex items-center gap-2 mt-auto">
                          {n.actionLink && (
                            <button
                              onClick={() => handleAction(n)}
                              className="text-[10px] font-black uppercase text-[#3f809e] hover:text-[#2c5b73] tracking-widest flex items-center gap-1 cursor-pointer"
                            >
                              Go to Action <ExternalLink size={10} />
                            </button>
                          )}
                          {!n.isRead && (
                            <button
                              onClick={() => markAsRead(n.id)}
                              className="text-[10px] font-black uppercase text-gray-400 hover:text-slate-600 tracking-widest cursor-pointer ml-auto"
                            >
                              Mark Read
                            </button>
                          )}
                          <button
                            onClick={() => clearNotification(n.id)}
                            className="text-gray-300 hover:text-red-500 cursor-pointer ml-auto"
                            title="Remove alert"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer helper */}
            <div id="notif-footer" className="p-3 bg-slate-50 border-t border-gray-100 flex justify-between items-center text-[10px] tracking-wider text-slate-500 shrink-0 font-bold">
              <span>ACTIVE PIPELINE</span>
              <span className="text-emerald-600 flex items-center gap-1.5 font-bold uppercase tracking-widest">
                <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                SYSTEM LIVE & HEALTHY
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
