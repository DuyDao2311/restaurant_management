import { Construction } from 'lucide-react';

const CategoriesPage = () => (
  <div className="flex flex-col items-center justify-center py-20">
    <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mb-4">
      <Construction size={28} />
    </div>
    <h2 className="text-xl font-bold text-gray-900 mb-2">Category Management</h2>
    <p className="text-sm text-gray-500">Module này sẽ được triển khai ở bước tiếp theo.</p>
  </div>
);

export default CategoriesPage;
