import { useNotification } from '../../../context/NotificationContext';
import NotificationItem from '../../../components/common/NotificationItem';
import { Bell, Loader2 } from 'lucide-react';
import { useState } from 'react';

const NotificationsPage = () => {
  const { 
    notifications, 
    loading, 
    markAllAsRead, 
    unreadCount, 
    filter, 
    setFilter,
    hasMore,
    loadMore
  } = useNotification();
  
  const [loadingMore, setLoadingMore] = useState(false);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await loadMore();
    setLoadingMore(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
          >
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        {/* Filters */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === 'ALL' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilter('UNREAD')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
              filter === 'UNREAD' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Chưa đọc
            {unreadCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                filter === 'UNREAD' ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-700'
              }`}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* List */}
        {loading && notifications.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
            <p>Đang tải thông báo...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center mb-4">
              <Bell size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Không có thông báo</h3>
            <p className="text-gray-500">
              {filter === 'UNREAD' ? 'Bạn không có thông báo nào chưa đọc.' : 'Bạn chưa có thông báo nào.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notif) => (
              <NotificationItem key={notif.id} notification={notif} />
            ))}
          </div>
        )}
        
        {/* Load More */}
        {hasMore && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/30 text-center">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore || loading}
              className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
              {loadingMore ? 'Đang tải...' : 'Xem thêm'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
