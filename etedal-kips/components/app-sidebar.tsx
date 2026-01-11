'use client';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { Target, ListChecks, TrendingUp, Network, Users, Settings, User } from 'lucide-react';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from '@/components/ui/sidebar';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getUserProfile, UserProfile } from '@/lib/firebase/auth';

// Navigation items matching dashboard.html
const navItems = [
    {
        title: 'الأهداف الاستراتيجية',
        url: '/dashboard',
        icon: Target,
    },
    {
        title: 'الأهداف التشغيلية',
        url: '/dashboard/operational',
        icon: ListChecks,
    },
    {
        title: 'متابعة الإنجاز',
        url: '/dashboard/tracking',
        icon: TrendingUp,
    },
    {
        title: 'الإدارات',
        url: '/dashboard/departments',
        icon: Network,
    },
    {
        title: 'المستخدمون',
        url: '/dashboard/users',
        icon: Users,
    },
    {
        title: 'الإعدادات',
        url: '/dashboard/settings',
        icon: Settings,
    },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        const fetchUserProfile = async () => {
            const profile = await getUserProfile();
            setUserProfile(profile);
        };
        fetchUserProfile();
    }, []);

    // For matching: treat item as active if pathname starts with its url
    function isItemActive(url: string) {
        if (url === '/dashboard') {
            // Match exactly '/'
            return pathname === url || pathname === url + '/' || pathname === '/dashboard';
        }
        // If there's a trailing slash, still match
        return pathname.startsWith(url);
    }

    return (
        <Sidebar
            {...props}
            className='sidebar-gradient-bg font-cairo'
            style={{
                background: 'linear-gradient(140deg, #6cb499 0%, #03866d 90%)',
            }}
        >
            <SidebarHeader className='p-6 pb-0 flex flex-col items-center'>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size='lg' asChild className='h-auto bg-transparent hover:bg-transparent p-0'>
                            <div className='flex flex-col items-center'>
                                <div
                                    className='w-full h-auto rounded-2xl shadow-lg flex items-center justify-center p-0 transition-all hover:scale-105'
                                    style={{ boxShadow: '0 8px 30px rgba(108, 180, 153, 0.3)' }}
                                >
                                    <Image
                                        src='/logoW.png'
                                        alt='Logo'
                                        width={170}
                                        height={100}
                                        className='w-[170px] h-auto object-contain rounded-2xl'
                                    />
                                </div>
                                <div
                                    className='text-center text-white text-xl font-bold mt-3 mb-1 tracking-wide'
                                    style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', fontSize: '1.2rem' }}
                                >
                                    منصة إدارة الأداء
                                </div>
                                <div className='text-center font-semibold text-white/90' style={{ fontSize: '1rem' }}>
                                    لوحة التحكم الإدارية
                                </div>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent className='mt-4'>
                <SidebarGroup>
                    <SidebarMenu className='gap-2'>
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = isItemActive(item.url);
                            return (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={active}
                                        className={cn(
                                            'text-white p-[12px] hover:bg-white/10! hover:text-white text-base font-cairo transition gap-3 font-semibold h-auto active:bg-white/10 active:text-white',
                                            active && 'sidebar-active-nav bg-white/10 font-extrabold!'
                                        )}
                                        style={{ fontSize: '1rem' }}
                                    >
                                        <Link href={item.url} className='flex items-center gap-3'>
                                            <Icon className='w-5 h-5 shrink-0' />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className='mt-auto p-4 border-t border-white/10'>
                <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 rounded-full bg-linear-to-br from-[#6cb499] to-[#03866d] text-white flex items-center justify-center text-lg font-bold shadow'>
                        <User className='w-5 h-5' />
                    </div>
                    <div className='flex-1 min-w-0'>
                        <div className='font-bold text-white text-sm truncate'>
                            {userProfile?.name || userProfile?.email || '...'}
                        </div>
                        <div className='text-xs text-white/80 truncate max-w-[120px]'>
                            {userProfile?.email || '...'}
                        </div>
                    </div>
                </div>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
