import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'danger';

interface PgToastProps {
    type: ToastType;
    message: string;
    onUndo?: () => void;
    style?: React.CSSProperties;
    className?: string;
}

export const PgToast: React.FC<PgToastProps> = ({ type, message, onUndo, style, className }) => {
    const variants = {
        success: { border: 'var(--color-success-border)', accent: 'var(--color-success)', icon: <CheckCircle size={18} /> },
        info: { border: 'var(--color-info-border)', accent: 'var(--color-info)', icon: <AlertCircle size={18} /> },
        danger: { border: 'var(--color-danger-border)', accent: 'var(--color-danger)', icon: <AlertCircle size={18} /> }
    };
    const v = variants[type];

    return (
        <div
            className={`absolute flex items-center gap-3 bg-white rounded-[99px] px-5 py-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.1)] z-[9000] overflow-hidden min-w-[320px] max-w-[460px] [animation:slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)]${className ? ` ${className}` : ''}`}
            style={{ border: `1px solid ${v.border}`, ...style }}
        >
            {/* Accent Stripe */}
            <div className="w-1 h-5 rounded-sm flex-shrink-0" style={{ background: v.accent }} />

            {/* Icon */}
            <div className="flex items-center" style={{ color: v.accent }}>
                {v.icon}
            </div>

            {/* Message */}
            <span className="text-[0.875rem] font-medium text-primary flex-1">{message}</span>

            {/* Undo */}
            {onUndo && (
                <button
                    onClick={onUndo}
                    className="bg-none border-none border-l border-[var(--color-border)] pl-3 text-secondary text-[0.8125rem] font-medium cursor-pointer whitespace-nowrap"
                >
                    Undo
                </button>
            )}
            <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
        </div>
    );
};
