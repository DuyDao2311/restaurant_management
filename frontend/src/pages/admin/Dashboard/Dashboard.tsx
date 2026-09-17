import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Table,
  ShoppingCart,
  CalendarDays,
  CircleDollarSign,
  Utensils,
  ArrowRight,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import {
  dashboardService,
  type DashboardData,
  type RevenueChartItem,
  type RecentActivity,
} from '../../../services/dashboardService';

/* ================================================================
   HELPERS
   ================================================================ */

/** Định dạng số tiền VND: 5500000 -> "5.500.000" */
function formatVnd(amount: number): string {
  return amount.toLocaleString('vi-VN');
}

/** Tạo chuỗi ngày dd/MM: "2026-09-15" -> "15/09" */
function formatDateRange(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

/** Lấy giờ:phút từ ISO datetime */
function formatTime(iso: string | null): string {
  if (!iso) return '--:--';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Màu chấm tròn theo loại activity */
function getActivityDotColor(type: string): string {
  switch (type) {
    case 'reservation':
      return '#1a1a1a';
    case 'order':
      return '#d97706';
    case 'payment':
      return '#16a34a';
    default:
      return '#9ca3af';
  }
}

/* ================================================================
   QUICK ACTIONS CONFIG
   ================================================================ */

const quickActions = [
  {
    label: 'Quản lý Thực đơn',
    sub: 'Cập nhật món & giá',
    path: '/admin/menu',
    icon: Utensils,
  },
  {
    label: 'Quản lý Bàn',
    sub: 'Sơ đồ & tình trạng phòng',
    path: '/admin/tables',
    icon: Table,
  },
  {
    label: 'Lịch Đặt bàn',
    sub: 'Tiếp nhận & xếp bàn',
    path: '/admin/reservations',
    icon: CalendarDays,
  },
  {
    label: 'Đơn hàng (Orders)',
    sub: 'Theo dõi gọi món & bếp',
    path: '/admin/orders',
    icon: ShoppingCart,
  },
];

/* ================================================================
   CUSTOM CHART COMPONENTS
   ================================================================ */

/** Custom bar shape: thêm nhãn % lên đầu mỗi cột */
function CustomBarLabel(props: {
  x?: number;
  y?: number;
  width?: number;
  value?: number;
  maxRevenue?: number;
}) {
  const { x = 0, y = 0, width = 0, value = 0, maxRevenue = 1 } = props;
  if (value === 0) return null;
  const pct = ((value / maxRevenue) * 100).toFixed(1);
  return (
    <text
      x={x + width / 2}
      y={y - 8}
      textAnchor="middle"
      fontSize={11}
      fontWeight={500}
      fill="#78716c"
    >
      {pct}%
    </text>
  );
}

/** Custom tooltip cho biểu đồ */
function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: RevenueChartItem }[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-semibold text-gray-800">{item.day_label}</p>
      <p className="text-amber-700">{formatVnd(item.revenue)} đ</p>
    </div>
  );
}

/* ================================================================
   MAIN COMPONENT
   ================================================================ */

const DashboardPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await dashboardService.getDashboard(selectedDate);
      setData(res.data);
    } catch (err: unknown) {
      console.error('Dashboard fetch error:', err);
      setError('Không thể tải dữ liệu Dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [selectedDate]);

  /* ---------- Loading State ---------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-amber-600" size={36} />
      </div>
    );
  }

  /* ---------- Error State ---------- */
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-gray-500">{error ?? 'Dữ liệu không khả dụng'}</p>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const { stats, revenue_summary, recent_activities } = data;

  // Tìm giá trị max để tính %
  const maxRevenue = Math.max(...revenue_summary.chart.map((c) => c.revenue), 1);

  /* ---------- Format ngày hiển thị ---------- */
  const todayFormatted = (() => {
    const d = new Date(data.today);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  })();

  /* ================================================================
     RENDER
     ================================================================ */
  return (
    <div>
      {/* ==================== HEADER ==================== */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Dashboard
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Tổng quan hoạt động và hiệu suất vận hành nhà hàng
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm hover:border-amber-300 transition-colors focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500">
          <CalendarDays size={16} className="text-amber-600" />
          <input 
            type="date"
            value={selectedDate || data.today}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="outline-none bg-transparent text-gray-700 font-medium cursor-pointer"
          />
        </div>
      </div>

      {/* ==================== STAT CARDS ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCardCustom
          title="TỔNG SỐ BÀN"
          value={stats.total_tables}
          unit="bàn"
          icon={Table}
        />
        <StatCardCustom
          title="ĐƠN HÀNG HÔM NAY"
          value={stats.today_orders}
          unit="order"
          icon={ShoppingCart}
        />
        <StatCardCustom
          title="LƯỢT ĐẶT BÀN"
          value={stats.today_reservations}
          unit="bản đặt"
          icon={CalendarDays}
        />
        <StatCardCustom
          title="DOANH THU HÔM NAY"
          value={formatVnd(stats.today_revenue)}
          unit="đ"
          icon={CircleDollarSign}
          highlight
        />
      </div>

      {/* ==================== CHART + ACTIVITIES ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-start">
        <div className="flex flex-col gap-6">
          {/* --- Revenue Chart --- */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
          {/* Chart header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3
                className="text-base font-bold text-gray-900"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Doanh thu 7 ngày gần nhất
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Biểu đồ tăng trưởng doanh thu theo ngày (
                {formatDateRange(revenue_summary.start_date)} -{' '}
                {formatDateRange(revenue_summary.end_date)})
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                TỔNG 7 NGÀY
              </p>
              <p className="text-lg font-bold text-gray-900">
                {formatVnd(revenue_summary.total_7_days)}{' '}
                <span className="text-sm font-medium text-gray-500">đ</span>
              </p>
              <span
                className={`text-xs font-semibold ${
                  revenue_summary.growth_percent >= 0
                    ? 'text-green-600'
                    : 'text-red-500'
                }`}
              >
                {revenue_summary.growth_percent >= 0 ? '+' : ''}
                {revenue_summary.growth_percent}%
              </span>
            </div>
          </div>

          {/* Bar chart */}
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={revenue_summary.chart}
              margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f3f4f6"
              />
              <XAxis
                dataKey="day_label"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#d1d5db' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) =>
                  v >= 1000000
                    ? `${(v / 1000000).toFixed(1)}M`
                    : v >= 1000
                    ? `${(v / 1000).toFixed(0)}K`
                    : String(v)
                }
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Bar
                dataKey="revenue"
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                label={((props: any) => (
                  <CustomBarLabel
                    x={Number(props.x ?? 0)}
                    y={Number(props.y ?? 0)}
                    width={Number(props.width ?? 0)}
                    value={Number(props.value ?? 0)}
                    maxRevenue={maxRevenue}
                  />
                )) as never}
              >
                {revenue_summary.chart.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={entry.is_today ? '#292524' : '#d6d3d1'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          </div>

          {/* ==================== QUICK ACTIONS ==================== */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Thao tác nhanh
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Truy cập lối tắt đến các phân hệ quản lý trong yêu
                </p>
              </div>
              <span className="text-xs text-amber-700 font-semibold uppercase tracking-wider">
                LỐI TẮT NGHIỆP VỤ
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.path}
                    onClick={() => navigate(action.path)}
                    className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 text-left hover:bg-amber-50/50 hover:border-amber-200 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-gray-800 block">
                        {action.label}
                      </span>
                      <span className="text-xs text-gray-400 block">
                        {action.sub}
                      </span>
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-gray-300 group-hover:text-amber-600 transition-colors flex-shrink-0"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* --- Recent Activities --- */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3
                className="text-base font-bold text-gray-900"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Hoạt động gần đây
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Nhật ký sự kiện và đơn bàn theo thời gian thực
              </p>
            </div>
            <button
              onClick={fetchDashboard}
              className="text-xs text-amber-700 hover:text-amber-800 font-medium flex items-center gap-1 transition-colors"
            >
              <RefreshCw size={12} />
              Làm mới
            </button>
          </div>

          {recent_activities.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              Chưa có hoạt động nào
            </p>
          ) : (
            <ul className="space-y-0 divide-y divide-gray-100">
              {recent_activities.map((activity, idx) => (
                <ActivityRow key={idx} activity={activity} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

/* ================================================================
   SUB-COMPONENTS
   ================================================================ */

/** Stat Card sát với thiết kế UI */
function StatCardCustom({
  title,
  value,
  unit,
  icon: Icon,
  highlight,
}: {
  title: string;
  value: string | number;
  unit: string;
  icon: React.ComponentType<{ size?: number }>;
  highlight?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">
            {title}
          </p>
          <div className="flex items-baseline gap-1.5">
            <p
              className={`font-bold ${
                highlight ? 'text-2xl text-amber-800' : 'text-3xl text-gray-900'
              }`}
            >
              {value}
            </p>
            <p className="text-sm font-medium text-gray-500">{unit}</p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

/** Activity Row sát với thiết kế UI */
function ActivityRow({ activity }: { activity: RecentActivity }) {
  return (
    <li className="flex items-start gap-3 py-3">
      {/* Time */}
      <span className="text-xs font-mono text-gray-400 w-12 flex-shrink-0 pt-0.5 text-right">
        {formatTime(activity.time)}
      </span>

      {/* Dot */}
      <div className="flex-shrink-0 pt-1.5">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: getActivityDotColor(activity.type) }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 leading-snug">
          {activity.title}
        </p>
        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
          {activity.description}
        </p>
      </div>
    </li>
  );
}

export default DashboardPage;
