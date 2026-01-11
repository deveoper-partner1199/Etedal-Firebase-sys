'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogHeader, DialogTrigger, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAchievementValueTypes } from '@/hooks/use-achievement-value-types';
import { Toast } from '@/components/ui/toast';
import { FaPlus } from 'react-icons/fa6';

const typeSchema = z.object({
    name: z.string().min(1, 'يجب إدخال اسم النوع').max(50, 'اسم النوع طويل جداً').trim(),
});

type TypeFormValues = z.infer<typeof typeSchema>;

export default function AddAchievementValueType() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
    const { achievementValueTypes } = useAchievementValueTypes();

    const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
        setToast({ message, type });
    };

    const form = useForm<TypeFormValues>({
        resolver: zodResolver(typeSchema),
        defaultValues: {
            name: '',
        },
    });

    const onSubmit = async (data: TypeFormValues) => {
        if (!db) {
            showToast('Firebase غير مهيأ', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            // Check if name already exists
            if (achievementValueTypes.some((t) => t.name === data.name.trim())) {
                showToast('اسم النوع موجود مسبقاً', 'error');
                setIsSubmitting(false);
                return;
            }

            // Add achievement value type to Firestore
            await addDoc(collection(db, 'achievementValueTypes'), {
                name: data.name.trim(),
                createdAt: new Date(),
            });

            form.reset();
            setDialogOpen(false);
            showToast('تمت إضافة النوع بنجاح', 'success');
        } catch (error) {
            console.error('Error adding achievement value type:', error);
            showToast('حدث خطأ أثناء إضافة نوع القيمة', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button
                    type='button'
                    className='w-fit flex justify-center items-center gap-2 py-2 px-4 rounded-lg text-sm font-bold text-white bg-[linear-gradient(to_right,var(--login-main-green),var(--login-dark-green))] shadow-[0_2px_12px_var(--login-shadow-button)] hover:brightness-110 hover:shadow-lg transition-all'
                >
                    <FaPlus className='w-4 h-4' />
                    إضافة نوع
                </Button>
            </DialogTrigger>
            <DialogContent className='font-cairo max-w-2xl'>
                <DialogHeader>
                    <DialogTitle className='text-start text-dark-green text-xl font-bold'>
                        إضافة نوع قيمة جديد
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6 mt-5'>
                        <FormField
                            control={form.control}
                            name='name'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className='text-sm font-bold text-gray-600'>
                                        اسم النوع (مثال: نسبة مئوية، قيمة رقمية) *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            className='w-full h-auto py-2.5 bg-[#f9f9f9]'
                                            placeholder='أدخل اسم النوع...'
                                            maxLength={50}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className='gap-2'>
                            <Button
                                type='button'
                                variant='outline'
                                onClick={() => {
                                    form.reset();
                                    setDialogOpen(false);
                                }}
                                disabled={isSubmitting}
                            >
                                إلغاء
                            </Button>
                            <Button
                                type='submit'
                                disabled={isSubmitting}
                                className='bg-[linear-gradient(to_right,var(--login-main-green),var(--login-dark-green))] text-white hover:brightness-110'
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                        جاري الحفظ...
                                    </>
                                ) : (
                                    'إضافة'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>

            {/* Toast Notification */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </Dialog>
    );
}

