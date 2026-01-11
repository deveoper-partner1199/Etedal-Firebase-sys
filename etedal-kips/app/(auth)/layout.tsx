import type { ReactNode } from 'react';
import { FaCircleCheck } from 'react-icons/fa6';
import { HiOutlineLockClosed } from 'react-icons/hi';
import { TbBolt } from 'react-icons/tb';
import { FaRegCircleCheck } from 'react-icons/fa6';
import { HiOutlineUserGroup } from 'react-icons/hi2';

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className='min-h-screen flex flex-col lg:items-stretch lg:flex-row bg-neutral-50 font-tajawal'>
            {/* Right Section - Content (Login Form will be here) */}
            <div className='w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12'>
                <div className='w-full max-w-md'>{children}</div>
            </div>

            <div className='hero-section w-full lg:w-1/2 p-12 text-white hidden lg:flex flex-col justify-center relative bg-linear-to-br from-[#6cb499] to-[#03866d]'>
                <div className='relative z-10 max-w-2xl mx-auto'>
                    <div className='mb-12 animate-fade-in'>
                        <div className='h-24 w-24 bg-white/10 glass-effect rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg'>
                            <FaCircleCheck className='h-10 w-10 text-white' />
                        </div>
                        <h1 className='text-4xl font-extrabold text-center mb-4 leading-tight'>
                            منصّة اعتدال لإدارة الأهداف الاستراتيجيّة
                        </h1>
                        <p className='text-xl text-center opacity-90 max-w-lg mx-auto'>
                            أداة شاملة تمكِّن فريق عمل جمعية اعتدال من التخطيط الاستراتيجي وقياس أثر حفظ النعمة
                        </p>
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 animate-fade-in-delay-1'>
                        <div className='feature-card p-6 rounded-xl'>
                            <div className='flex items-start mb-3'>
                                <div className='bg-white/20 p-2 rounded-lg ml-4'>
                                    <FaRegCircleCheck className='h-5 w-5' />
                                </div>
                                <div>
                                    <h3 className='font-extrabold text-lg mb-1'>متابعة المؤشرات</h3>
                                    <p className='text-sm opacity-80 font-medium'>
                                        تابع تقدم أهدافك بسهولة مع لوحات تحكم تفاعلية
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className='feature-card p-6 rounded-xl'>
                            <div className='flex items-start mb-3'>
                                <div className='bg-white/20 p-2 rounded-lg ml-4'>
                                    <TbBolt className='h-6 w-6' />
                                </div>
                                <div>
                                    <h3 className='font-extrabold text-lg mb-1'>لوحات قياس ذكية</h3>
                                    <p className='text-sm opacity-80 font-medium'>رؤى فوريّة لمؤشرات أداء حفظ النعمة</p>
                                </div>
                            </div>
                        </div>
                        <div className='feature-card p-6 rounded-xl'>
                            <div className='flex items-start mb-3'>
                                <div className='bg-white/20 p-2 rounded-lg ml-4'>
                                    <HiOutlineLockClosed className='h-6 w-6' />
                                </div>
                                <div>
                                    <h3 className='font-extrabold text-lg mb-1'>أمان متكامل</h3>
                                    <p className='text-sm opacity-80 font-medium'>
                                        بياناتك محمية بأعلى معايير الأمان والخصوصية
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className='feature-card p-6 rounded-xl'>
                            <div className='flex items-start mb-3'>
                                <div className='bg-white/20 p-2 rounded-lg ml-4'>
                                    <HiOutlineUserGroup className='h-6 w-6' />
                                </div>
                                <div>
                                    <h3 className='font-extrabold text-lg mb-1'>عمل تشاركي</h3>
                                    <p className='text-sm opacity-80 font-medium'>
                                        تعاون مع فريقك لتحقيق الأهداف المشتركة بسهولة
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='mt-16 text-center animate-fade-in-delay-2'>
                        <div className='inline-flex items-center bg-white/10 glass-effect px-6 py-3 rounded-full'>
                            <TbBolt className='h-5 w-5 text-white mr-2' />
                            <p className='text-lg font-medium opacity-90'>
                                &quot;معًا لتحقيق رؤيتنا في حفظ النعمة بالاستراتيجيات الفعّالة&quot;
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @
            `}</style>
        </div>
    );
}
