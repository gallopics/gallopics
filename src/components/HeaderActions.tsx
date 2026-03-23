import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Share2, MoreHorizontal } from 'lucide-react';

export interface ActionItem {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive';
}

interface MoreMenuProps {
    actions: ActionItem[];
}

export const MoreMenu: React.FC<MoreMenuProps> = ({ actions }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const updateCoords = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY + 8,
                left: rect.right + window.scrollX - 200 // Menu width is 200px
            });
        }
    };

    useLayoutEffect(() => {
        if (isOpen) {
            updateCoords();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (
                triggerRef.current && !triggerRef.current.contains(target) &&
                menuRef.current && !menuRef.current.contains(target)
            ) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsOpen(false);
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
            window.addEventListener('resize', updateCoords);
            window.addEventListener('scroll', updateCoords, true);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
            window.removeEventListener('resize', updateCoords);
            window.removeEventListener('scroll', updateCoords, true);
        };
    }, [isOpen]);

    return (
        <div className="relative">
            <button
                ref={triggerRef}
                className={[
                    'cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.2,0,0.2,1)] font-[inherit] text-[0.8125rem] font-medium bg-white border border-[var(--color-border)] text-[var(--color-text-primary)] w-11 h-11 p-0 rounded-full flex items-center justify-center hover:bg-[var(--ui-bg-subtle)] hover:border-[var(--color-border)] hover:scale-105 hover:shadow-[0_2px_4px_rgba(0,0,0,0.05)] hover:text-[var(--color-text-primary)] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-[var(--color-brand-primary)] focus-visible:outline-offset-2',
                    isOpen ? 'bg-[var(--ui-bg-subtle)] text-[var(--color-text-primary)]' : ''
                ].join(' ')}
                onClick={() => setIsOpen(!isOpen)}
                title="More actions"
            >
                <MoreHorizontal size={20} />
            </button>

            {isOpen && createPortal(
                <div
                    className="w-[200px] bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.12)] border border-[var(--color-border)] p-1.5 [transform-origin:top_right] animate-[dropdownFadeIn_0.15s_ease] absolute m-0 z-[10000]"
                    ref={menuRef}
                    style={{
                        top: coords.top,
                        left: coords.left,
                    }}
                >
                    {actions.map((action, index) => (
                        <button
                            key={index}
                            className={[
                                'flex items-center w-full px-3 py-2.5 text-[0.875rem] font-medium bg-none border-none rounded-lg cursor-pointer text-left transition-[background] duration-200',
                                action.variant === 'destructive'
                                    ? 'text-[var(--color-danger)] hover:bg-[var(--color-danger-tint)] hover:text-[var(--color-danger)]'
                                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--ui-bg-subtle)] hover:text-[var(--color-text-primary)]'
                            ].join(' ')}
                            onClick={() => {
                                action.onClick();
                                setIsOpen(false);
                            }}
                        >
                            {action.label}
                        </button>
                    ))}
                </div>,
                document.body
            )}
        </div>
    );
};

interface ShareIconButtonProps {
    url?: string;
}

export const ShareIconButton: React.FC<ShareIconButtonProps> = ({ url }) => {
    const [showToast, setShowToast] = useState(false);

    const handleShare = () => {
        const targetUrl = url || window.location.href;
        navigator.clipboard.writeText(targetUrl);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
    };

    return (
        <div className="relative flex items-center justify-center">
            <button
                className="cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.2,0,0.2,1)] font-[inherit] text-[0.8125rem] font-medium bg-white border border-[var(--color-border)] text-[var(--color-text-primary)] w-11 h-11 p-0 rounded-full flex items-center justify-center hover:bg-[var(--ui-bg-subtle)] hover:border-[var(--color-border)] hover:scale-105 hover:shadow-[0_2px_4px_rgba(0,0,0,0.05)] hover:text-[var(--color-text-primary)] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-[var(--color-brand-primary)] focus-visible:outline-offset-2"
                onClick={handleShare}
                title="Share"
                aria-label="Share page"
            >
                <Share2 size={20} />
            </button>
            <div className={[
                'absolute top-full left-1/2 -translate-x-1/2 bg-[var(--color-text-primary)] text-white px-3 py-1.5 rounded-[6px] text-[0.75rem] font-medium whitespace-nowrap pointer-events-none transition-[opacity,transform] duration-200 ease-in-out z-[100] shadow-[0_4px_12px_rgba(0,0,0,0.15)]',
                showToast ? 'opacity-100 translate-y-3' : 'opacity-0 translate-y-2'
            ].join(' ')}>
                Link copied
            </div>
        </div>
    );
};

export const ActionSeparator: React.FC = () => {
    return <div className="w-px h-6 bg-[var(--color-border)] mx-1" />;
};

export const ActionCluster: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <div className="flex items-center gap-3">{children}</div>;
};
