'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { HiOutlineMail, HiOutlineLockClosed } from 'react-icons/hi';
import { HiArrowRightOnRectangle } from 'react-icons/hi2';
import { loginUser, saveUserProfile } from '@/lib/firebase/auth';
import { Toast } from '@/components/ui/toast';

// Zod schema for login form
const loginSchema = z.object({
    email: z.string().min(1, 'البريد الإلكتروني مطلوب').email('البريد الإلكتروني غير صحيح'),
    password: z.string().min(1, 'كلمة المرور مطلوبة'),
    rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
            rememberMe: false,
        },
    });

    const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
        setToast({ message, type });
    };

    const onSubmit = async (data: LoginFormValues) => {
        setIsLoading(true);
        try {
            // Authenticate user with Firebase
            const userProfile = await loginUser({
                email: data.email,
                password: data.password,
            });

            // Save user profile to secure HTTP cookie
            await saveUserProfile(userProfile, data.rememberMe);

            // Show success message
            showToast('تم تسجيل الدخول بنجاح، جاري التوجيه...', 'success');

            // Get redirect path from query params or default to dashboard
            const redirectPath = '/dashboard';

            // Redirect after a short delay
            setTimeout(() => {
                router.push(redirectPath);
            }, 1200);
        } catch (error) {
            console.error('Login error:', error);
            const errorMessage = error instanceof Error ? error.message : 'فشل تسجيل الدخول. الرجاء المحاولة لاحقًا';
            showToast(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='login-container w-full bg-white rounded-2xl p-8 lg:p-10 shadow-[0_8px_36px_var(--login-shadow)]'>
            <div className='text-center mb-8'>
                <div className='mx-auto h-20 w-44 p-3 rounded-2xl flex items-center justify-center mb-5 shadow-md'>
                    <Image src='/logo.svg' alt='شعار الجمعية' width={152} height={80} className='object-contain' />
                </div>
                <h1 className='text-2xl font-bold mb-2 text-(--login-dark-green)'>مرحبًا بك</h1>
                <p className='text-(--login-text-gray)'>في منصّة اعتدال لإدارة الأهداف الاستراتيجيّة</p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
                    <FormField
                        control={form.control}
                        name='email'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className='text-sm font-medium text-(--login-text-gray)'>
                                    البريد الإلكتروني
                                </FormLabel>
                                <FormControl>
                                    <div className='relative'>
                                        <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-(--login-accent-taupe)'>
                                            <HiOutlineMail className='h-5 w-5' />
                                        </div>
                                        <Input
                                            type='email'
                                            placeholder='ادخل بريدك الإلكتروني'
                                            className='w-full px-4 pr-10 py-3 h-auto rounded-lg border-[1.5px] border-(--login-border-light) bg-(--login-bg-light) focus:border-(--login-main-green) focus:ring-2 focus:ring-(--login-focus-ring) focus:bg-white transition-all'
                                            {...field}
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name='password'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className='text-sm font-medium text-(--login-text-gray)'>
                                    كلمة المرور
                                </FormLabel>
                                <FormControl>
                                    <div className='relative'>
                                        <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-(--login-accent-taupe)'>
                                            <HiOutlineLockClosed className='h-5 w-5' />
                                        </div>
                                        <Input
                                            type='password'
                                            placeholder='ادخل كلمة المرور'
                                            className='w-full px-4 pr-10 py-3 rounded-lg border-[1.5px] h-auto border-(--login-border-light) bg-(--login-bg-light) focus:border-(--login-main-green) focus:ring-2 focus:ring-(--login-focus-ring) focus:bg-white transition-all'
                                            {...field}
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className='flex items-center justify-between'>
                        <FormField
                            control={form.control}
                            name='rememberMe'
                            render={({ field }) => (
                                <FormItem className='flex flex-row items-center space-x-2 space-x-reverse'>
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            className='border-(--login-accent-taupe) data-[state=checked]:bg-(--login-main-green) data-[state=checked]:border-(--login-main-green)'
                                        />
                                    </FormControl>
                                    <FormLabel className='text-sm cursor-pointer text-(--login-text-gray)'>
                                        تذكرني
                                    </FormLabel>
                                </FormItem>
                            )}
                        />
                        <div className='text-sm'>
                            {/* <a href="#" className="font-medium text-[#6cb499] hover:text-[#03866d]">نسيت كلمة المرور؟</a> */}
                        </div>
                    </div>

                    <Button
                        type='submit'
                        disabled={isLoading}
                        className='w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg text-lg font-medium text-white bg-[linear-gradient(to_right,var(--login-main-green),var(--login-dark-green))] shadow-[0_2px_12px_var(--login-shadow-button)] hover:brightness-110 hover:shadow-lg transition-all'
                    >
                        {isLoading ? (
                            <>
                                <div className='h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                                جاري التحميل...
                            </>
                        ) : (
                            <>
                                تسجيل الدخول
                                <HiArrowRightOnRectangle className='h-5 w-5' />
                            </>
                        )}
                    </Button>
                </form>
            </Form>

            {/* Toast Notification */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
