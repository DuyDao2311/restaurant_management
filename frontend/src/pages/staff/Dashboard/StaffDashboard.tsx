import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Clock, UtensilsCrossed, Users, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

interface DashboardStats {
  todaysOrders: number;
  pendingOrders: number;
  availableTables: number;
  occupiedTables: number;
}

const StaffDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Mock API call to fetch dashboard statistics
    const fetchStats = async () => {
      try {
        setLoading(true);
        // FIXME: Replace with actual API call when available
        // const response = await dashboardService.getStaffStats();
        // setStats(response.data);
        
        // Simulating API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data
        setStats({
          todaysOrders: 24,
          pendingOrders: 6,
          availableTables: 12,
          occupiedTables: 8
        });
      } catch (err) {
        setError('Không thể tải dữ liệu bảng điều khiển. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statsCards = [
    {
      title: "Today's Orders",
      value: stats?.todaysOrders || 0,
      icon: ShoppingCart,
      color: "bg-blue-50 text-blue-600",
      trend: "+3 from yesterday"
    },
    {
      title: "Pending Orders",
      value: stats?.pendingOrders || 0,
      icon: Clock,
      color: "bg-amber-50 text-amber-600",
      trend: "Needs attention"
    },
    {
      title: "Available Tables",
      value: stats?.availableTables || 0,
      icon: UtensilsCrossed,
      color: "bg-emerald-50 text-emerald-600",
      trend: "Out of 20 total"
    },
    {
      title: "Occupied Tables",
      value: stats?.occupiedTables || 0,
      icon: Users,
      color: "bg-purple-50 text-purple-600",
      trend: "Currently serving"
    }
  ];

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-100 rounded-xl text-center">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.full_name?.split(' ')[0] || 'Staff'}! 👋
        </h1>
        <p className="text-gray-500 mt-1">Here is the current overview of the restaurant operations.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {loading ? (
          // Loading Skeletons
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="w-10 h-10 bg-gray-100 rounded-full"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-2/3"></div>
            </div>
          ))
        ) : !stats ? (
          // Empty State
          <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-2xl border border-gray-100 border-dashed">
            No data available.
          </div>
        ) : (
          // Data Cards
          statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{stat.title}</p>
                    <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <Icon size={20} />
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {stat.trend}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/staff/tables')}
            className="group flex items-center justify-between p-5 bg-white border border-gray-200 rounded-2xl hover:border-blue-300 hover:shadow-sm transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
                <UtensilsCrossed size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">View Tables</h3>
                <p className="text-sm text-gray-500">Manage table statuses and seating</p>
              </div>
            </div>
            <ArrowRight size={20} className="text-gray-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" />
          </button>

          <button
            onClick={() => navigate('/staff/orders')}
            className="group flex items-center justify-between p-5 bg-white border border-gray-200 rounded-2xl hover:border-amber-300 hover:shadow-sm transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-100 transition-colors">
                <ShoppingCart size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">View Orders</h3>
                <p className="text-sm text-gray-500">Process and manage active orders</p>
              </div>
            </div>
            <ArrowRight size={20} className="text-gray-300 group-hover:text-amber-500 transform group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
