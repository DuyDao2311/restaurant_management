import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <div className="inline-flex items-center gap-1 bg-white px-2 py-1.5 rounded-full border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-8 h-8 flex items-center justify-center rounded-full text-blue-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
      >
        <ChevronLeft size={18} strokeWidth={2.5} />
      </button>
      
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`w-9 h-9 flex items-center justify-center rounded-full text-[15px] font-medium transition-colors ${
            p === currentPage
              ? 'bg-[#C19B6C] text-white shadow-sm'
              : 'text-slate-700 hover:bg-gray-50 bg-transparent'
          }`}
        >
          {p}
        </button>
      ))}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-8 h-8 flex items-center justify-center rounded-full text-blue-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
      >
        <ChevronRight size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default Pagination;
