'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'warning';
    duration?: number;
    onClose?: () => void;
}

export function Toast({ message, type = 'success', duration = 4000, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => {
                onClose?.();
            }, 300);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    if (!isVisible) return null;

    return (
        <div
            className={cn(
                'fixed top-6 left-6 z-50 px-6 py-3 rounded-lg text-sm shadow-lg transition-all duration-300',
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2',
                type === 'success' &&
                    'bg-[#eafbf5] text-[var(--login-dark-green)] border border-[var(--login-main-green)]',
                type === 'error' && 'bg-red-50 text-red-900 border border-red-200',
                type === 'warning' && 'bg-yellow-50 text-yellow-900 border border-yellow-200'
            )}
        >
            {message}
        </div>
    );
}
