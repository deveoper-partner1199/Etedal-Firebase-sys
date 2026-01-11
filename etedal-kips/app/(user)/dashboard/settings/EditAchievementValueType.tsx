'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogHeader, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { AchievementValueType } from '@/hooks/use-achievement-value-types';
import { useAchievementValueTypes } from '@/hooks/use-achievement-value-types';
import { Toast } from '@/components/ui/toast';

const typeSchema = z.object({
    name: z.string().min(1, 'يجب إدخال اسم النوع').max(50, 'اسم النوع طويل جداً').trim(),
});

type TypeFormValues = z.infer<typeof typeSchema>;

interface EditAchievementValueTypeProps {
    type: AchievementValueType;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export default function EditAchievementValueType({
    type,
    open,
    onOpenChange,
    onSuccess,
}: EditAchievementValueTypeProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
    const { achievementValueTypes } = useAchievementValueTypes();

    const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
        setToast({ message, type });
    };

    const form = useForm<TypeFormValues>({
        resolver: zodResolver(typeSchema),
        defaultValues: {
            name: type.name || '',
        },
    });

    // Update form when type changes
    useEffect(() => {
        if (type) {
            form.reset({
                name: type.name || '',
            });
        }
    }, [type, form]);

    const onSubmit = async (data: TypeFormValues) => {
        if (!db) {
            showToast('Firebase غير مهيأ', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            // Check if name already exists (excluding current type)
            const existingType = achievementValueTypes.find((t) => t.name === data.name.trim() && t.id !== type.id);
            if (existingType) {
                showToast('اسم النوع موجود مسبقاً', 'error');
                setIsSubmitting(false);
                return;
            }

            const typeRef = doc(db, 'achievementValueTypes', type.id);
            await updateDoc(typeRef, {
                name: data.name.trim(),
                updatedAt: new Date(),
            });

            form.reset();
            onOpenChange(false);
            showToast('تم تحديث النوع بنجاح', 'success');
            onSuccess?.();
        } catch (error) {
            console.error('Error updating achievement value type:', error);
            showToast('حدث خطأ أثناء تحديث نوع القيمة', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='font-cairo max-w-2xl'>
                <DialogHeader>
                    <DialogTitle className='text-start text-dark-green text-xl font-bold'>تعديل نوع القيمة</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6 mt-5'>
                        <FormField
                            control={form.control}
                            name='name'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className='text-sm font-bold text-gray-600'>اسم النوع *</FormLabel>
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
                                    onOpenChange(false);
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
                                        جاري التحديث...
                                    </>
                                ) : (
                                    'تحديث'
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
