import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, Search, ShoppingBag } from 'lucide-react';
import { menuService } from '../../../services/menuService';
import { tableService } from '../../../services/tableService';
import { orderService } from '../../../services/orderService';
import { MenuItem } from '../../../types';
import { RestaurantTable } from '../../../types/table';

interface CartItem extends MenuItem {
  quantity: number;
}

const StaffCreateOrder = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tablesData, menuData] = await Promise.all([
        tableService.getTables(),
        menuService.getAllMenuItems()
      ]);
      // Only show available tables or tables that can be ordered at
      const allTables = tablesData.data || [];
      setTables(allTables.filter(t => t.status === 'AVAILABLE'));
      setMenuItems(menuData || []);
    } catch (err) {
      console.error('Failed to fetch data', err);
      setError('Không thể tải danh sách bàn và thực đơn.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMenu = menuItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) && item.is_available
  );

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCreateOrder = async () => {
    if (!selectedTable) {
      alert("Vui lòng chọn một bàn.");
      return;
    }
    if (cart.length === 0) {
      alert("Vui lòng thêm món ăn vào giỏ hàng.");
      return;
    }

    setIsSubmitting(true);
    try {
      await orderService.createOrder({
        table_id: selectedTable,
        order_type: "STAFF",
        items: cart.map(item => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          note: ""
        }))
      });
      alert("Tạo đơn hàng thành công!");
      navigate('/staff/orders');
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.detail || "Tạo đơn hàng thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/staff/orders')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">Tạo Đơn Hàng Mới</h1>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden bg-gray-50">
        {/* Left Section: Tables & Menu */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200">
          
          {/* Table Selection */}
          <div className="p-4 bg-white border-b">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">1. Chọn Bàn</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {tables.map(table => (
                <button
                  key={table.id}
                  onClick={() => setSelectedTable(table.id)}
                  className={`flex flex-col items-center justify-center min-w-[80px] h-20 rounded-xl border-2 transition-all ${
                    selectedTable === table.id 
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md transform scale-105' 
                      : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg font-bold">{table.table_number}</span>
                  <span className="text-xs opacity-75">{table.status}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Menu Selection */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">2. Chọn Món</h2>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm món ăn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 text-center p-4 bg-red-50 rounded-lg">{error}</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredMenu.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => addToCart(item)}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all group"
                  >
                    <div className="h-32 bg-gray-100 relative overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">Không có ảnh</div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-gray-800 line-clamp-1">{item.name}</h3>
                      <p className="text-indigo-600 font-bold mt-1">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(item.price))}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Cart */}
        <div className="w-96 bg-white flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-10 relative">
          <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-800">Đơn Hàng Hiện Tại</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                <ShoppingBag className="w-16 h-16 opacity-20" />
                <p>Giỏ hàng trống</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-white border rounded-xl shadow-sm">
                    <div className="flex-1 pr-3">
                      <h4 className="font-medium text-gray-800 line-clamp-1 text-sm">{item.name}</h4>
                      <p className="text-indigo-600 font-semibold text-sm">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(item.price))}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-4 text-center font-medium text-sm">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 hover:bg-indigo-200 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-500">Tạm tính</span>
              <span className="text-xl font-bold text-gray-800">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}</span>
            </div>
            <button
              onClick={handleCreateOrder}
              disabled={isSubmitting || cart.length === 0 || !selectedTable}
              className={`w-full py-3 px-4 rounded-xl font-bold text-white shadow-lg transition-all transform ${
                isSubmitting || cart.length === 0 || !selectedTable 
                  ? 'bg-gray-400 cursor-not-allowed opacity-70' 
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/30 active:scale-95'
              }`}
            >
              {isSubmitting ? 'Đang tạo...' : 'Tạo Đơn Hàng'}
            </button>
            {!selectedTable && (
              <p className="text-red-500 text-xs text-center mt-2 font-medium">Vui lòng chọn bàn để tiếp tục.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffCreateOrder;
