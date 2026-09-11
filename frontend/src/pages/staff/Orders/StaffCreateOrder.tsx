import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, Search, ShoppingBag } from 'lucide-react';
import { menuService } from '../../../services/menuService';
import { tableService } from '../../../services/tableService';
import { orderService } from '../../../services/orderService';
import { tableSessionService } from '../../../services/tableSessionService';
import { MenuItem } from '../../../types';
import { RestaurantTable } from '../../../types/table';
import { TableSession } from '../../../types/table_session.types';

interface CartItem extends MenuItem {
  quantity: number;
  note?: string;
}

const StaffCreateOrder = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [activeSession, setActiveSession] = useState<TableSession | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

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
      // Staff should only order for OCCUPIED tables which have an ACTIVE session
      const allTables = tablesData.data || [];
      setTables(allTables.filter(t => t.status === 'OCCUPIED'));
      setMenuItems(menuData || []);
    } catch (err) {
      console.error('Failed to fetch data', err);
      setError('Không thể tải danh sách bàn và thực đơn.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTable = async (tableId: number) => {
    setSelectedTable(tableId);
    setActiveSession(null);
    setSessionError(null);
    setIsLoading(true);
    try {
      const session = await tableSessionService.getActiveSessionByTable(tableId);
      if (session && session.status === 'ACTIVE') {
        setActiveSession(session);
      } else {
        setSessionError('Bàn không có phiên hoạt động (ACTIVE).');
      }
    } catch (err: any) {
      console.error('Lỗi khi lấy phiên bàn:', err);
      setSessionError('Không tìm thấy phiên bàn đang hoạt động.');
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
      return [...prev, { ...item, quantity: 1, note: '' }];
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

  const updateItemNote = (id: number, note: string) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, note } : item));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCreateOrder = async () => {
    if (!activeSession) {
      alert("Bàn này chưa có phiên hoạt động.");
      return;
    }
    if (cart.length === 0) {
      alert("Vui lòng thêm món ăn vào giỏ hàng.");
      return;
    }

    setIsSubmitting(true);
    try {
      await orderService.createOrder({
        table_session_id: activeSession.id,
        note: orderNote,
        items: cart.map(item => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          note: item.note
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
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">1. Chọn Bàn (Đang phục vụ)</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {tables.length === 0 && !isLoading && (
                <p className="text-gray-500 text-sm">Không có bàn nào đang hoạt động (OCCUPIED).</p>
              )}
              {tables.map(table => (
                <button
                  key={table.id}
                  onClick={() => handleSelectTable(table.id)}
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
            
            {selectedTable && activeSession && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                <strong>Phiên hoạt động:</strong> #{activeSession.id} (Bắt đầu: {new Date(activeSession.started_at).toLocaleString()})
              </div>
            )}
            {selectedTable && sessionError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                {sessionError}
              </div>
            )}
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

            {isLoading && !tables.length ? (
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
                    onClick={() => activeSession ? addToCart(item) : alert('Vui lòng chọn bàn có phiên hoạt động trước')}
                    className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all group ${activeSession ? 'cursor-pointer hover:shadow-md hover:border-indigo-300' : 'opacity-50 cursor-not-allowed'}`}
                  >
                    <div className="h-32 bg-gray-100 relative overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className={`w-full h-full object-cover transition-transform duration-300 ${activeSession ? 'group-hover:scale-105' : ''}`} />
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
                  <div key={item.id} className="flex flex-col p-3 bg-white border rounded-xl shadow-sm gap-2">
                    <div className="flex items-center justify-between">
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
                    <input
                      type="text"
                      placeholder="Ghi chú (vd: ít cay, không hành...)"
                      value={item.note || ''}
                      onChange={(e) => updateItemNote(item.id, e.target.value)}
                      className="w-full text-xs p-2 border border-gray-200 rounded-md focus:border-indigo-400 focus:outline-none"
                    />
                  </div>
                ))}
                
                <div className="pt-3 border-t border-gray-100">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Ghi chú chung cho đơn:</label>
                  <textarea
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder="Mang món ra cùng nhau..."
                    className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    rows={2}
                  />
                </div>
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
              disabled={isSubmitting || cart.length === 0 || !activeSession}
              className={`w-full py-3 px-4 rounded-xl font-bold text-white shadow-lg transition-all transform ${
                isSubmitting || cart.length === 0 || !activeSession 
                  ? 'bg-gray-400 cursor-not-allowed opacity-70' 
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/30 active:scale-95'
              }`}
            >
              {isSubmitting ? 'Đang tạo...' : 'Tạo Đơn Hàng'}
            </button>
            {!activeSession && selectedTable && (
              <p className="text-red-500 text-xs text-center mt-2 font-medium">Bàn này chưa có phiên hoạt động hợp lệ.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffCreateOrder;
