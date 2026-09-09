import React from 'react';
import { QrCode, Eye, Edit2 } from 'lucide-react';
import { RestaurantTable } from '../../../types/table';
import TableStatusBadge from '../../admin/Tables/TableStatusBadge';

interface StaffTableCardProps {
  table: RestaurantTable;
  onViewDetail: (table: RestaurantTable) => void;
  onUpdateStatus: (table: RestaurantTable) => void;
}

const StaffTableCard: React.FC<StaffTableCardProps> = ({ table, onViewDetail, onUpdateStatus }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
              BÀN
            </span>
            <h3 className="text-2xl font-black text-gray-900">{table.table_number}</h3>
          </div>
          <TableStatusBadge status={table.status} />
        </div>

        <div className="space-y-2 mt-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Sức chứa:</span>
            <span className="font-medium text-gray-900">{table.capacity} khách</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Khu vực:</span>
            <span className="font-medium text-gray-900">{table.location || '--'}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => onUpdateStatus(table)}
          className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
        >
          <Edit2 size={14} />
          Đổi Trạng Thái
        </button>
        <button
          onClick={() => onViewDetail(table)}
          className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors shadow-sm"
        >
          <QrCode size={14} />
          Chi Tiết / QR
        </button>
      </div>
    </div>
  );
};

export default StaffTableCard;
