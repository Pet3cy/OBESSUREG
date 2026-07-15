import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps {
  toast: ToastMessage;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="text-brand-projects" size={20} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={20} />;
      case 'info':
      default:
        return <Info className="text-brand-policy" size={20} />;
    }
  };

  const getBgColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-brand-projects/10 border-brand-projects/30 text-emerald-800';
      case 'error':
        return 'bg-brand-membership/10 border-brand-membership/30 text-red-800';
      case 'info':
      default:
        return 'bg-brand-policy/10 border-brand-policy/30 text-brand-policy';
    }
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg pointer-events-auto animate-in slide-in-from-bottom-5 fade-in duration-300 max-w-sm w-full ${getBgColor()}`}>
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>
      <div className="flex-1 text-sm font-medium leading-relaxed">
        {toast.message}
        {toast.action && (
          <div className="mt-2">
            <button 
              onClick={() => {
                toast.action!.onClick();
                onClose();
              }}
              className="text-xs font-bold underline hover:opacity-80 transition-opacity"
            >
              {toast.action.label}
            </button>
          </div>
        )}
      </div>
      <button 
        onClick={onClose}
        className="flex-shrink-0 p-1 rounded-md hover:bg-black/5 transition-colors"
      >
        <X size={16} className="opacity-60" />
      </button>
    </div>
  );
};
