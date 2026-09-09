import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ShieldAlert, MoreVertical, Edit, UserX, UserCheck, Eye, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import userService, { User } from '../../../services/userService';
import roleService, { Role } from '../../../services/roleService';
import ChangeRoleModal from './ChangeRoleModal';
import ChangeStatusModal from './ChangeStatusModal';
import CustomerDetailModal from './CustomerDetailModal';

const CustomersPage = () => {
  const { user: currentUser } = useAuth();
  
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  // Modal states
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchData = async (page = 1) => {
    setIsLoading(true);
    setError('');
    try {
      const [usersRes, rolesRes] = await Promise.all([
        userService.getUsers(page, itemsPerPage),
        roleService.getRoles()
      ]);
      
      setUsers(usersRes.data);
      setTotalPages(Math.ceil(usersRes.total / itemsPerPage));
      setRoles(rolesRes.data);
      setCurrentPage(page);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải danh sách người dùng.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
  }, []);

  const getRoleName = (roleId: number) => {
    return roles.find(r => r.id === roleId)?.name || 'UNKNOWN';
  };

  // Client-side filtering
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Search
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        user.full_name.toLowerCase().includes(searchLower) ||
        user.phone.includes(searchLower) ||
        (user.email && user.email.toLowerCase().includes(searchLower));

      // Role filter
      const matchesRole = roleFilter === 'ALL' || getRoleName(user.role_id) === roleFilter;

      // Status filter
      const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter, roles]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchData(newPage);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
  };

  // Actions
  const openRoleModal = (user: User) => {
    setSelectedUser(user);
    setRoleModalOpen(true);
  };

  const openStatusModal = (user: User) => {
    setSelectedUser(user);
    setStatusModalOpen(true);
  };

  const openDetailModal = (user: User) => {
    setSelectedUser(user);
    setDetailModalOpen(true);
  };

  const handleRoleChange = async (userId: number, newRoleId: number) => {
    await userService.updateUser(userId, { role_id: newRoleId });
    await fetchData(currentPage); // Refresh current page
  };

  const handleStatusChange = async (userId: number, newStatus: 'ACTIVE' | 'INACTIVE') => {
    await userService.updateUser(userId, { status: newStatus });
    await fetchData(currentPage); // Refresh current page
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Khách hàng & Người dùng</h1>
        <p className="text-gray-500 mt-1">Quản lý tài khoản, phân quyền và trạng thái người dùng trong hệ thống.</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm theo Tên, SĐT, Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
            />
          </div>
          
          <div className="w-full md:w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm bg-white"
            >
              <option value="ALL">Tất cả quyền</option>
              {roles.map(r => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm bg-white"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Hoạt động (ACTIVE)</option>
              <option value="INACTIVE">Vô hiệu hóa (INACTIVE)</option>
              <option value="BLOCKED">Bị chặn (BLOCKED)</option>
            </select>
          </div>

          <button
            onClick={handleResetFilters}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center gap-2 md:w-auto"
          >
            <Filter size={16} />
            <span className="hidden lg:inline">Đặt lại</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded shadow-sm flex items-center gap-3">
          <ShieldAlert size={20} />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Thông tin</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Quyền</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Không tìm thấy tài khoản nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const roleName = getRoleName(user.role_id);
                  const isSelf = currentUser?.id === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-500">#{user.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-gray-100 to-gray-200 flex items-center justify-center text-gray-500 font-bold text-sm">
                            {user.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                              {user.full_name}
                              {isSelf && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500 uppercase tracking-wider">Bạn</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{user.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold
                          ${roleName === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 
                            roleName === 'STAFF' ? 'bg-blue-100 text-blue-800' : 
                            'bg-gray-100 text-gray-800'}`}
                        >
                          {roleName}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold
                          ${user.status === 'ACTIVE' ? 'text-emerald-700 bg-emerald-50' : 
                            'text-red-700 bg-red-50'}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                          {user.status === 'ACTIVE' ? 'Đang hoạt động' : 'Vô hiệu hóa'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openDetailModal(user)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye size={18} />
                          </button>
                          
                          <button
                            onClick={() => openRoleModal(user)}
                            disabled={isSelf}
                            className={`p-2 rounded-lg transition-colors ${
                              isSelf 
                                ? 'text-gray-300 cursor-not-allowed' 
                                : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                            }`}
                            title={isSelf ? "Không thể tự đổi quyền" : "Đổi quyền"}
                          >
                            <Edit size={18} />
                          </button>
                          
                          {user.status === 'ACTIVE' ? (
                            <button
                              onClick={() => openStatusModal(user)}
                              disabled={isSelf}
                              className={`p-2 rounded-lg transition-colors ${
                                isSelf 
                                  ? 'text-gray-300 cursor-not-allowed' 
                                  : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                              }`}
                              title={isSelf ? "Không thể tự khóa" : "Vô hiệu hóa"}
                            >
                              <UserX size={18} />
                            </button>
                          ) : (
                            <button
                              onClick={() => openStatusModal(user)}
                              disabled={isSelf}
                              className={`p-2 rounded-lg transition-colors ${
                                isSelf 
                                  ? 'text-gray-300 cursor-not-allowed' 
                                  : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={isSelf ? "Không thể tự kích hoạt" : "Kích hoạt"}
                            >
                              <UserCheck size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Trang {currentPage} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Trước
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ChangeRoleModal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        user={selectedUser}
        roles={roles}
        onConfirm={handleRoleChange}
      />
      
      <ChangeStatusModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        user={selectedUser}
        onConfirm={handleStatusChange}
      />

      <CustomerDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        user={selectedUser}
        roles={roles}
      />
    </div>
  );
};

export default CustomersPage;
