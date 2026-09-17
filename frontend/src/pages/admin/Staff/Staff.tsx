import { useState, useEffect } from 'react';
import { Search, Plus, Filter, Loader2 } from 'lucide-react';
import staffService, { Staff, Pagination } from '../../../services/staffService';
import StaffTable from './StaffTable';
import StaffModal from './StaffModal';
import StaffDetailModal from './StaffDetailModal';
import PaginationComponent from '../../../components/common/Pagination';
import { useToast } from '../../../context/ToastContext';
import ConfirmModal from '../../../components/common/ConfirmModal';

const StaffPage = () => {
  const { showToast } = useToast();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, total_pages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'primary';
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'primary',
    onConfirm: () => {}
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      setError('');
      const res = await staffService.getStaff(
        pagination.page,
        pagination.limit,
        debouncedSearch,
        statusFilter
      );
      if (res.success) {
        setStaffList(res.data.items);
        setPagination(res.data.pagination);
      }
    } catch (err: any) {
      setError('Không thể tải danh sách Staff. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [pagination.page, debouncedSearch, statusFilter]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleOpenAddModal = () => {
    setSelectedStaff(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (staff: Staff) => {
    setSelectedStaff(staff);
    setIsFormModalOpen(true);
  };

  const handleOpenDetailModal = (staff: Staff) => {
    setSelectedStaff(staff);
    setIsDetailModalOpen(true);
  };

  const handleSubmitForm = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (selectedStaff) {
        await staffService.updateStaff(selectedStaff.id, data);
        showToast('Cập nhật Staff thành công', 'success');
      } else {
        await staffService.createStaff(data);
        showToast('Tạo Staff thành công', 'success');
      }
      setIsFormModalOpen(false);
      fetchStaff();
    } catch (err: any) {
      throw err; // Let modal handle error display
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = (staff: Staff) => {
    const action = staff.status === 'ACTIVE' ? 'khóa' : 'mở khóa';
    setConfirmConfig({
      isOpen: true,
      title: 'Xác nhận trạng thái',
      message: `Bạn có chắc muốn ${action} tài khoản này?`,
      variant: staff.status === 'ACTIVE' ? 'warning' : 'primary',
      onConfirm: async () => {
        try {
          const newStatus = staff.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
          const res = await staffService.updateStaffStatus(staff.id, newStatus);
          if (res.success) {
            showToast(res.message, 'success');
            fetchStaff();
          }
        } catch (err) {
          showToast(`Lỗi khi ${action} tài khoản`, 'error');
        } finally {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleDelete = (staff: Staff) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc chắn muốn xóa Staff này?',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await staffService.deleteStaff(staff.id);
          if (res.success) {
            showToast(res.message || 'Xóa Staff thành công', 'success');
            fetchStaff();
          }
        } catch (err: any) {
          const errorMsg = err.response?.data?.message || 'Lỗi khi xóa Staff';
          showToast(errorMsg, 'error');
        } finally {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-normal text-slate-900 mb-2 flex items-center justify-between" style={{ fontFamily: '"Playfair Display", "Times New Roman", serif' }}>
          Quản Lý Nhân Viên
        </h1>
        <p className="text-gray-500 text-sm">
          Quản lý danh sách nhân viên và quyền truy cập
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 text-white px-5 py-2.5 rounded-lg transition-colors text-xs font-bold uppercase tracking-wider whitespace-nowrap w-full sm:w-auto"
            style={{ backgroundColor: '#B4975A' }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Thêm Staff
          </button>

          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#B4975A] focus:border-[#B4975A] sm:text-sm transition-colors"
              placeholder="Tìm kiếm Staff (Tên, Email, SĐT)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="w-full sm:w-auto border border-gray-200 rounded-lg text-sm px-4 py-2.5 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#B4975A] focus:border-[#B4975A] transition-colors cursor-pointer outline-none shadow-sm"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động (Active)</option>
            <option value="INACTIVE">Ngừng hoạt động (Inactive)</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center border border-red-100">
          {error}
        </div>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-gray-100">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin mb-4" />
          <p className="text-gray-500">Đang tải danh sách Staff...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <StaffTable
            staffList={staffList}
            onView={handleOpenDetailModal}
            onEdit={handleOpenEditModal}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDelete}
          />

          {/* Pagination */}
          <div className="bg-white px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between">
            <div className="mb-4 sm:mb-0">
              <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
                HIỂN THỊ <span className="font-bold text-gray-700">{staffList.length === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}</span> - <span className="font-bold text-gray-700">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> TRÊN TỔNG SỐ <span className="font-bold text-gray-700">{pagination.total}</span>
              </p>
            </div>
            {pagination.total_pages > 0 && (
              <PaginationComponent
                currentPage={pagination.page}
                totalPages={pagination.total_pages}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <StaffModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleSubmitForm}
        staff={selectedStaff}
        isLoading={isSubmitting}
      />

      <StaffDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        staff={selectedStaff}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        variant={confirmConfig.variant}
      />
    </div>
  );
};

export default StaffPage;
