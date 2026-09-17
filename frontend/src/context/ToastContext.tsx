import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useEffect } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const TOAST_CONFIG: Record<ToastType, { icon: typeof CheckCircle; bg: string; border: string; text: string; iconColor: string; progressColor: string }> = {
  success: {
    icon: CheckCircle,
    bg: 'bg-white',
    border: 'border-green-200',
    text: 'text-gray-800',
    iconColor: 'text-green-500',
    progressColor: 'bg-green-500',
  },
  error: {
    icon: AlertCircle,
    bg: 'bg-white',
    border: 'border-red-200',
    text: 'text-gray-800',
    iconColor: 'text-red-500',
    progressColor: 'bg-red-500',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-white',
    border: 'border-amber-200',
    text: 'text-gray-800',
    iconColor: 'text-amber-500',
    progressColor: 'bg-amber-500',
  },
  info: {
    icon: Info,
    bg: 'bg-white',
    border: 'border-blue-200',
    text: 'text-gray-800',
    iconColor: 'text-blue-500',
    progressColor: 'bg-blue-500',
  },
};

const ToastItemComponent = ({ toast, onRemove }: { toast: ToastItem; onRemove: (id: string) => void }) => {
  const config = TOAST_CONFIG[toast.type];
  const Icon = config.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div
      className={`${config.bg} ${config.border} border rounded-xl shadow-lg px-4 py-3 flex items-start gap-3 min-w-[320px] max-w-[420px] animate-slide-in-right relative overflow-hidden`}
    >
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gray-100">
        <div
          className={`h-full ${config.progressColor} opacity-60`}
          style={{
            animation: `toast-progress ${toast.duration}ms linear forwards`,
          }}
        />
      </div>

      <div className={`shrink-0 mt-0.5 ${config.iconColor}`}>
        <Icon size={20} />
      </div>
      <p className={`flex-1 text-sm ${config.text} leading-relaxed pr-2`}>
        {toast.message}
      </p>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 p-0.5 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-100"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3500) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { id, type, message, duration }]);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5">
          {toasts.map((toast) => (
            <ToastItemComponent key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </div>
      )}

      {/* Inline styles for animations */}
      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes toast-progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </ToastContext.Provider>
  );
};
