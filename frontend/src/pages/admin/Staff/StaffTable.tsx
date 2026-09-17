import { Edit, Eye, Lock, Unlock, Trash2, MoreVertical } from 'lucide-react';
import { Staff } from '../../../services/staffService';
import { useState, useRef, useEffect } from 'react';

interface StaffTableProps {
  staffList: Staff[];
  onView: (staff: Staff) => void;
  onEdit: (staff: Staff) => void;
  onToggleStatus: (staff: Staff) => void;
  onDelete: (staff: Staff) => void;
}

const StaffTable = ({ staffList, onView, onEdit, onToggleStatus, onDelete }: StaffTableProps) => {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="overflow-x-auto min-h-[300px]">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-4 font-medium">STT</th>
            <th className="px-6 py-4 font-medium">Họ và tên</th>
            <th className="px-6 py-4 font-medium">Email</th>
            <th className="px-6 py-4 font-medium">SĐT</th>
            <th className="px-6 py-4 font-medium">Trạng thái</th>
            <th className="px-6 py-4 font-medium">Ngày tạo</th>
            <th className="px-6 py-4 font-medium text-center">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {staffList.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                Không tìm thấy Staff phù hợp
              </td>
            </tr>
          ) : (
            staffList.map((staff, index) => (
              <tr key={staff.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                <td className="px-6 py-4 font-medium text-gray-900">{staff.full_name}</td>
                <td className="px-6 py-4 text-gray-500">{staff.email || '-'}</td>
                <td className="px-6 py-4 text-gray-500">{staff.phone}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      staff.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {staff.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng hoạt động'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500">{formatDate(staff.created_at)}</td>
                <td className="px-6 py-4 text-center relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === staff.id ? null : staff.id);
                    }}
                    className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {openMenuId === staff.id && (
                    <div
                      ref={menuRef}
                      className="absolute right-6 top-10 w-48 bg-white rounded-md shadow-lg border border-gray-100 z-10 py-1"
                    >
                      <button
                        onClick={() => {
                          setOpenMenuId(null);
                          onView(staff);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Eye size={16} /> Xem chi tiết
                      </button>
                      <button
                        onClick={() => {
                          setOpenMenuId(null);
                          onEdit(staff);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Edit size={16} /> Chỉnh sửa
                      </button>
                      <button
                        onClick={() => {
                          setOpenMenuId(null);
                          onToggleStatus(staff);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 ${
                          staff.status === 'ACTIVE' ? 'text-amber-600' : 'text-green-600'
                        }`}
                      >
                        {staff.status === 'ACTIVE' ? (
                          <><Lock size={16} /> Khóa tài khoản</>
                        ) : (
                          <><Unlock size={16} /> Mở khóa</>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setOpenMenuId(null);
                          onDelete(staff);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 size={16} /> Xóa
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default StaffTable;
