import { useNavigate } from 'react-router-dom';
import {
  Table,
  ShoppingCart,
  CalendarDays,
  DollarSign,
  Utensils,
  ArrowRight,
} from 'lucide-react';
import StatCard from '../../../components/admin/StatCard.tsx';

// TODO: Replace mock data with real Dashboard API later.

interface Activity {
  id: number;
  time: string;
  message: string;
}

const stats = [
  { title: 'Total Tables', value: 20, icon: Table, description: 'Available tables' },
  { title: "Today's Orders", value: 35, icon: ShoppingCart, description: 'Orders today' },
  { title: 'Reservations', value: 12, icon: CalendarDays, description: 'Upcoming reservations' },
  { title: 'Revenue', value: '5,500,000đ', icon: DollarSign, description: "Today's revenue" },
];

const quickActions = [
  { label: 'Manage Menu', path: '/admin/menu', icon: Utensils },
  { label: 'Manage Tables', path: '/admin/tables', icon: Table },
  { label: 'Reservations', path: '/admin/reservations', icon: CalendarDays },
  { label: 'Orders', path: '/admin/orders', icon: ShoppingCart },
];

const recentActivities: Activity[] = [
  { id: 1, time: '10:30', message: 'New reservation received' },
  { id: 2, time: '10:15', message: 'Order #1024 created' },
  { id: 3, time: '09:45', message: 'Table T05 occupied' },
  { id: 4, time: '09:30', message: 'Payment #512 completed' },
  { id: 5, time: '09:00', message: 'Staff shift started' },
];

const DashboardPage = () => {
  const navigate = useNavigate();

  return (
    <div>
      {/* Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">
          Tổng quan hoạt động nhà hàng
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            description={stat.description}
          />
        ))}
      </div>

      {/* Quick Actions + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 text-left hover:bg-gray-50 hover:border-gray-300 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                    <Icon size={18} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 flex-1">
                    {action.label}
                  </span>
                  <ArrowRight
                    size={14}
                    className="text-gray-300 group-hover:text-gray-500 transition-colors"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          <ul className="space-y-3">
            {recentActivities.map((activity) => (
              <li key={activity.id} className="flex items-start gap-3">
                <span className="text-xs font-mono text-gray-400 w-12 flex-shrink-0 pt-0.5">
                  {activity.time}
                </span>
                <div className="flex-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block mr-2 align-middle" />
                  <span className="text-sm text-gray-600">
                    {activity.message}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
