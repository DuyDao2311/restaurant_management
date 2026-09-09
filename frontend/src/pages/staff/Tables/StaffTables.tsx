import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronDown, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { tableService } from '../../../services/tableService';
import { RestaurantTable } from '../../../types/table';
import StaffTableCard from './StaffTableCard';
import StaffTableDetailModal from './StaffTableDetailModal';
import UpdateTableStatusModal from './UpdateTableStatusModal';

const StaffTables = () => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modals
  const [selectedTableForDetail, setSelectedTableForDetail] = useState<RestaurantTable | null>(null);
  const [selectedTableForStatus, setSelectedTableForStatus] = useState<RestaurantTable | null>(null);

  // Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const fetchTables = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await tableService.getTables({
        search: searchQuery || undefined,
        status: statusFilter || undefined,
      });
      if (response.success) {
        setTables(response.data || []);
      } else {
        setError('Không thể tải danh sách bàn.');
      }
    } catch (err) {
      console.error('Failed to load tables', err);
      setError('Lỗi kết nối. Không thể tải danh sách bàn.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTables();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, statusFilter]);

  const handleStatusUpdateSuccess = (message: string) => {
    setSelectedTableForStatus(null);
    showNotification('success', message);
    fetchTables();
  };

  // Thống kê nhanh
  const stats = useMemo(() => {
    return {
      total: tables.length,
      available: tables.filter(t => t.status === 'AVAILABLE').length,
      occupied: tables.filter(t => t.status === 'OCCUPIED').length,
    };
  }, [tables]);

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[60] p-4 rounded-md shadow-lg border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 max-w-sm ${notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium flex-1">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="opacity-70 hover:opacity-100 focus:outline-none">
            &times;
          </button>
        </div>
      )}

      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Table Management</h1>
          <p className="text-gray-500 mt-1">Monitor and manage restaurant tables.</p>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-3 w-full md:w-auto">
          <div className="flex-1 md:flex-none bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm text-center">
            <p className="text-xs font-semibold text-gray-400 uppercase">Tổng cộng</p>
            <p className="text-xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="flex-1 md:flex-none bg-green-50 px-4 py-3 rounded-xl border border-green-200 shadow-sm text-center">
            <p className="text-xs font-semibold text-green-600 uppercase">Đang Trống</p>
            <p className="text-xl font-bold text-green-700">{stats.available}</p>
          </div>
          <div className="flex-1 md:flex-none bg-yellow-50 px-4 py-3 rounded-xl border border-yellow-200 shadow-sm text-center">
            <p className="text-xs font-semibold text-yellow-600 uppercase">Có Khách</p>
            <p className="text-xl font-bold text-yellow-700">{stats.occupied}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
            placeholder="Tìm kiếm mã bàn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:min-w-[200px]">
            <select
              className="block w-full pl-3 pr-10 py-2.5 text-base font-medium text-gray-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg appearance-none border bg-white cursor-pointer transition-all hover:bg-gray-50"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="AVAILABLE">Trống</option>
              <option value="OCCUPIED">Có khách</option>
              <option value="RESERVED">Đã đặt</option>
              <option value="MAINTENANCE">Bảo trì</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>

          <button
            onClick={fetchTables}
            className="p-2.5 border border-gray-300 shadow-sm rounded-lg text-gray-500 bg-white hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            title="Tải lại"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin text-blue-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {error ? (
        <div className="bg-red-50 rounded-2xl border border-red-200 p-10 text-center flex flex-col items-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-bold text-red-800 mb-2">Lỗi Tải Dữ Liệu</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={fetchTables}
            className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm"
          >
            Thử lại
          </button>
        </div>
      ) : isLoading && tables.length === 0 ? (
        // Loading Skeleton Grid
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-pulse h-48 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className="h-8 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded-full w-20"></div>
              </div>
              <div className="space-y-3 mt-auto">
                <div className="h-4 bg-gray-100 rounded w-full"></div>
                <div className="h-4 bg-gray-100 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : tables.length === 0 ? (
        // Empty State
        <div className="bg-white rounded-2xl border border-gray-200 border-dashed p-16 text-center">
          <p className="text-gray-500 text-lg font-medium mb-4">
            {searchQuery || statusFilter ? 'Không tìm thấy bàn phù hợp với bộ lọc.' : 'Nhà hàng hiện chưa có dữ liệu bàn.'}
          </p>
          {(searchQuery || statusFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('');
              }}
              className="px-5 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Xóa Bộ Lọc
            </button>
          )}
        </div>
      ) : (
        // Data Grid
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {tables.map(table => (
            <StaffTableCard
              key={table.id}
              table={table}
              onViewDetail={(t) => setSelectedTableForDetail(t)}
              onUpdateStatus={(t) => setSelectedTableForStatus(t)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {selectedTableForDetail && (
        <StaffTableDetailModal
          table={selectedTableForDetail}
          onClose={() => setSelectedTableForDetail(null)}
        />
      )}

      {selectedTableForStatus && (
        <UpdateTableStatusModal
          table={selectedTableForStatus}
          onClose={() => setSelectedTableForStatus(null)}
          onSuccess={handleStatusUpdateSuccess}
        />
      )}
    </div>
  );
};

export default StaffTables;
