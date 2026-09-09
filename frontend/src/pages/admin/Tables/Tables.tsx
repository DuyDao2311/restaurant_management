import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, ChevronDown, RefreshCw, Plus, MoreVertical, Trash2, Pencil, CheckCircle2, AlertCircle, QrCode } from 'lucide-react';
import { tableService } from '../../../services/tableService';
import { RestaurantTable } from '../../../types/table';
import TableStatusBadge from './TableStatusBadge';
import TableForm from './TableForm';

const TablesPage = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | undefined>(undefined);

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<RestaurantTable | undefined>(undefined);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification State
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 5000); // Auto hide after 5s
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
      setError('Không thể tải danh sách bàn.');
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

  const handleOpenCreateForm = () => {
    setFormMode('create');
    setSelectedTable(undefined);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (table: RestaurantTable) => {
    setFormMode('edit');
    setSelectedTable(table);
    setIsFormOpen(true);
  };

  const handleFormSuccess = (message: string) => {
    setIsFormOpen(false);
    showNotification('success', message);
    fetchTables();
  };

  const handleOpenDelete = (table: RestaurantTable) => {
    setTableToDelete(table);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!tableToDelete) return;
    setIsDeleting(true);
    try {
      const res = await tableService.deleteTable(tableToDelete.id);
      if (res.success) {
        showNotification('success', 'Xóa bàn thành công.');
        setIsDeleteModalOpen(false);
        fetchTables();
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 409) {
          showNotification('error', err.response.data.message || 'Không thể xóa bàn này vì đang có dữ liệu liên quan (đơn hàng, đặt bàn).');
        } else {
          showNotification('error', err.response?.data?.message || 'Có lỗi xảy ra khi xóa bàn.');
        }
      } else {
        showNotification('error', 'Có lỗi xảy ra khi xóa bàn.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50/50 relative">
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

      {/* Header Actions */}
      <div className="flex justify-between items-center bg-white p-4 rounded-md shadow-sm border border-gray-200 mb-4">

        <div className="flex items-center space-x-4 flex-1 max-w-2xl mr-4">
          <button
            onClick={handleOpenCreateForm}
            className="flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-bold rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black whitespace-nowrap uppercase"
          >
            <Plus className="h-5 w-5 mr-2" />
            Thêm bàn mới
          </button>
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Tìm kiếm mã bàn, số lượng khách..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative min-w-[200px]">
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md appearance-none border bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Trạng thái: Tất cả</option>
              <option value="AVAILABLE">Trống</option>
              <option value="OCCUPIED">Có khách</option>
              <option value="RESERVED">Đã đặt</option>
              <option value="MAINTENANCE">Bảo trì</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
          <button
            onClick={fetchTables}
            className="p-2 border border-gray-300 shadow-sm rounded-md text-gray-500 bg-white hover:bg-gray-50 focus:outline-none"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-md shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                  MÃ BÀN
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                  SỐ LƯỢNG KHÁCH
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                  KHU VỰC
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                  TRẠNG THÁI
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                  THAO TÁC
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {error ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-red-500">
                    <p className="mb-4">{error}</p>
                    <button
                      onClick={fetchTables}
                      className="px-4 py-2 bg-red-50 text-red-700 rounded-md border border-red-200 hover:bg-red-100 transition-colors"
                    >
                      Thử lại
                    </button>
                  </td>
                </tr>
              ) : tables.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                    {searchQuery || statusFilter ? 'Không tìm thấy bàn nào phù hợp với tìm kiếm.' : 'Không có dữ liệu bàn.'}
                  </td>
                </tr>
              ) : (
                tables.map((table) => (
                  <tr key={table.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xl font-serif font-bold text-gray-900">{table.table_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-700">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        {table.capacity} Khách
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {table.location || <span className="text-gray-400 italic">Chưa xếp</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <TableStatusBadge status={table.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <button
                          onClick={() => navigate(`/admin/tables/${table.id}`)}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="QR & Chi tiết"
                        >
                          <QrCode className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditForm(table)}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="Sửa"
                        >
                          <Pencil className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(table)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                        {/* <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="h-5 w-5" />
                        </button> */}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination - Dummy for now as API doesn't support pagination yet */}
        <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between mt-auto">
          <div>
            <p className="text-sm text-gray-600 uppercase tracking-wider">
              HIỂN THỊ <span className="font-medium">{tables.length > 0 ? 1 : 0}</span> - <span className="font-medium">{tables.length}</span> TRÊN TỔNG SỐ <span className="font-medium">{tables.length}</span> BÀN
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button disabled className="relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-200 bg-white text-sm font-medium text-gray-400">
                <span>&lt; Trước</span>
              </button>
              <button className="relative inline-flex items-center px-4 py-2 border text-sm font-medium z-10 bg-black text-white border-black">
                1
              </button>
              <button disabled className="relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-200 bg-white text-sm font-medium text-gray-400">
                <span>Sau &gt;</span>
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Table Form Modal */}
      {isFormOpen && (
        <TableForm
          mode={formMode}
          initialData={selectedTable}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsFormOpen(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && tableToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Xóa bàn</h3>
            <p className="text-sm text-gray-500 mb-6">
              Bạn có chắc chắn muốn xóa bàn <span className="font-bold text-gray-900">{tableToDelete.table_number}</span>?<br />
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-center gap-3 w-full">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none"
                disabled={isDeleting}
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? 'Đang xóa...' : 'Xóa bàn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TablesPage;
