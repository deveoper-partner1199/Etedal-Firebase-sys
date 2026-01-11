'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { internalAxios } from '@/lib/firebase/axios';

interface LogoutButtonProps {
    className?: string;
    variant?: 'default' | 'icon-only';
}

export function LogoutButton({ className, variant = 'default' }: LogoutButtonProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(false);

    const handleLogout = async () => {
        if (isLoading) return;

        setIsLoading(true);
        try {
            // Call the logout API route (it should clear cookies server-side)
            await internalAxios.post(
                '/api/auth/logout',
                {
                    withCredentials: true,
                },
                {
                    withCredentials: true,
                }
            );

            // Attempt to clear local storage/session storage as extra precaution
            if (typeof window !== 'undefined') {
                localStorage.clear();
                sessionStorage.clear();
            }

            // Optional: Try to clean client side cookies (will only work for accessible cookies)
            if (typeof document !== 'undefined') {
                // Here, you might want to remove any client accessible auth cookies if needed
                // Example for cookie deletion (adapt names accordingly)
                document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                document.cookie = 'auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            }

            // Redirect to login page
            router.push('/login');
        } catch (error) {
            console.error('Logout error:', error);
            // Even if there's an error, redirect to login
            router.push('/login');
        } finally {
            setIsLoading(false);
        }
    };

    if (variant === 'icon-only') {
        return (
            <button
                onClick={handleLogout}
                disabled={isLoading}
                className={cn(
                    'logout-btn-icon w-10 h-10 rounded-full bg-linear-to-br from-[#6cb499] to-[#03866d] text-white flex items-center justify-center text-lg font-bold shadow transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed',
                    className
                )}
                title='تسجيل الخروج'
            >
                {isLoading ? (
                    <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                ) : (
                    <LogOut className='w-5 h-5' />
                )}
            </button>
        );
    }

    return (
        <button
            onClick={handleLogout}
            disabled={isLoading}
            className={cn(
                'logout-btn flex items-center gap-2.5 px-5 py-2.5 text-white font-bold rounded-xl transition-all duration-300 ease-in-out shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none',
                'bg-linear-to-r from-[#ff4d4d] via-[#ff6666] to-[#ff9999]',
                'hover:brightness-110 hover:-translate-y-0.5 hover:shadow-xl',
                'active:translate-y-0',
                className
            )}
            style={{
                boxShadow: isLoading ? '0 4px 15px rgba(255, 77, 77, 0.3)' : '0 4px 15px rgba(255, 77, 77, 0.3)',
            }}
        >
            {isLoading ? (
                <>
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                    <span>جاري الخروج...</span>
                </>
            ) : (
                <>
                    <LogOut className='w-4 h-4' />
                    <span>خروج</span>
                </>
            )}
        </button>
    );
}
