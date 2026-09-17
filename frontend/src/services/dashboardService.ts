import api from './api';

export interface DashboardStats {
  total_tables: number;
  today_orders: number;
  today_reservations: number;
  today_revenue: number;
}

export interface RevenueChartItem {
  date: string;
  day_label: string;
  revenue: number;
  is_today: boolean;
}

export interface RevenueSummary {
  total_7_days: number;
  growth_percent: number;
  start_date: string;
  end_date: string;
  chart: RevenueChartItem[];
}

export interface RecentActivity {
  type: 'reservation' | 'order' | 'payment';
  time: string | null;
  title: string;
  description: string;
  status: string;
}

export interface DashboardData {
  today: string;
  stats: DashboardStats;
  revenue_summary: RevenueSummary;
  recent_activities: RecentActivity[];
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardData;
}

export const dashboardService = {
  getDashboard: async (targetDate?: string): Promise<DashboardResponse> => {
    const params = targetDate ? { target_date: targetDate } : {};
    const response = await api.get('/admin/dashboard', { params });
    return response.data;
  },
};
