import React from 'react';
import { TableStatus } from '../../../types/table';

interface Props {
  status: TableStatus;
}

const TableStatusBadge: React.FC<Props> = ({ status }) => {
  const getBadgeStyle = (status: TableStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'OCCUPIED':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'RESERVED':
        return 'bg-gray-50 text-gray-700 border-gray-200'; // The image uses gray for reserved
      case 'MAINTENANCE':
        return 'bg-gray-100 text-gray-600 border-gray-300'; // The image uses gray for maintenance with a tool
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getDotStyle = (status: TableStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-gray-400';
      case 'OCCUPIED':
        return 'bg-yellow-500';
      case 'RESERVED':
        return 'bg-gray-500';
      case 'MAINTENANCE':
        return ''; // Will render wrench icon instead of dot
      default:
        return 'bg-gray-400';
    }
  };

  const formatStatusLabel = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'Trống';
      case 'OCCUPIED': return 'Có khách';
      case 'RESERVED': return 'Đã đặt';
      case 'MAINTENANCE': return 'Bảo trì';
      default: return status;
    }
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-sm text-xs font-medium border ${getBadgeStyle(status)}`}>
      {status === 'MAINTENANCE' ? (
        <svg className="h-3 w-3 mr-1.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ) : (
        <span className={`h-1.5 w-1.5 rounded-full mr-2 ${getDotStyle(status)}`}></span>
      )}
      {formatStatusLabel(status)}
    </span>
  );
};

export default TableStatusBadge;
