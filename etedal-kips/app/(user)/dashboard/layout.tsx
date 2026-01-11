import { AppSidebar } from '@/components/app-sidebar';
import { LogoutButton } from '@/components/LogoutButton';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                {/* <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4'>
                    <SidebarTrigger className='-ms-1' />
                    <Separator orientation='vertical' className='me-2 data-[orientation=vertical]:h-4' />
                </header> */}

                <header className='flex items-center font-cairo justify-between px-6 py-4 bg-white sticky top-0 z-10 shadow-[0_4px_20px_rgba(0,0,0,0.08)]'>
                    <div className='flex items-center gap-3'>
                        <SidebarTrigger className='-ms-1' />
                        <Separator orientation='vertical' className='me-2 data-[orientation=vertical]:h-4' />
                        <div>
                            <div id='mainTitle' className='text-xl md:text-2xl font-bold text-[#03866d]'>
                                منصة إدارة الأداء
                            </div>
                            <div id='mainSubtitle' className='text-xs md:text-sm text-gray-500 font-semibold'>
                                إدارة وتتبع الأهداف الاستراتيجية والتشغيلية
                            </div>
                        </div>
                    </div>
                    <div className='flex items-center gap-3'>
                        <LogoutButton />
                        {/* <img src="https://api.dicebear.com/8.x/initials/svg?seed=م.ع" alt="user" className="w-10 h-10 rounded-full border-2 border-[#6cb499] shadow hover:border-[#03866d] transition"> */}
                    </div>
                </header>
                <div className='flex flex-1 flex-col gap-4 font-cairo'>{children}</div>
            </SidebarInset>
        </SidebarProvider>
    );
}
