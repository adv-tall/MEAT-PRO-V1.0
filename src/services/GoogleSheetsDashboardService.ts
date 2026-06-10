import { api } from './api';

/**
 * Service to fetch data from Google Sheets API specifically for Production Boards and Analytics Dashboards
 */
export const GoogleSheetsDashboardService = {
  // Fetches tracking board data
  getTrackingBoardData: async () => {
    return await api.call('read', 'Orders_Production');
  },
  
  // Fetches performance analytics data
  getPerformanceAnalytics: async () => {
    return await api.call('read', 'Performance_Analytics');
  },
  
  // Update line statuses dynamically back to Sheets
  updateMachineStatus: async (machineId: string, statusData: any) => {
    return await api.call('update', 'Equipment_Registry', { id: machineId, ...statusData });
  }
};
