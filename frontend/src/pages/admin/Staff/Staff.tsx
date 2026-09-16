import { useState, useEffect } from 'react';
import { Search, Plus, Filter, Loader2 } from 'lucide-react';
import staffService, { Staff, Pagination } from '../../../services/staffService';
import StaffTable from './StaffTable';
import StaffModal from './StaffModal';
import StaffDetailModal from './StaffDetailModal';
import PaginationComponent from '../../../components/common/Pagination';

const StaffPage = () => {
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
        alert('Cập nhật Staff thành công');
      } else {
        await staffService.createStaff(data);
        alert('Tạo Staff thành công');
      }
      setIsFormModalOpen(false);
      fetchStaff();
    } catch (err: any) {
      throw err; // Let modal handle error display
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (staff: Staff) => {
    const action = staff.status === 'ACTIVE' ? 'khóa' : 'mở khóa';
    if (!window.confirm(`Bạn có chắc muốn ${action} tài khoản này?`)) return;

    try {
      const newStatus = staff.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const res = await staffService.updateStaffStatus(staff.id, newStatus);
      if (res.success) {
        alert(res.message);
        fetchStaff();
      }
    } catch (err) {
      alert(`Lỗi khi ${action} tài khoản`);
    }
  };

  const handleDelete = async (staff: Staff) => {
    if (!window.confirm('Bạn có chắc muốn xóa Staff này?')) return;

    try {
      const res = await staffService.deleteStaff(staff.id);
      if (res.success) {
        alert(res.message || 'Xóa Staff thành công');
        fetchStaff();
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Lỗi khi xóa Staff';
      alert(errorMsg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Staff</h1>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors shadow-sm text-sm font-medium"
        >
          <Plus size={18} />
          Thêm Staff
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
            placeholder="Tìm kiếm Staff (Tên, Email, SĐT)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={18} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm rounded-md"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
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
        <>
          <StaffTable
            staffList={staffList}
            onView={handleOpenDetailModal}
            onEdit={handleOpenEditModal}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDelete}
          />

          {/* Pagination */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="mb-4 sm:mb-0">
              Hiển thị <span className="font-semibold text-gray-900">{staffList.length === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)}</span> trên tổng số <span className="font-semibold text-gray-900">{pagination.total}</span> nhân viên
            </div>
            {pagination.total_pages > 0 && (
              <PaginationComponent
                currentPage={pagination.page}
                totalPages={pagination.total_pages}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </>
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
    </div>
  );
};

export default StaffPage;
