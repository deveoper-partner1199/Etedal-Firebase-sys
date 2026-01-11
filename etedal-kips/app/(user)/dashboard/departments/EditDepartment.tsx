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
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Department } from '@/hooks/use-departments';
import { useDepartments } from '@/hooks/use-departments';

const departmentSchema = z.object({
    name: z.string().min(1, 'يجب إدخال اسم الإدارة').max(40, 'اسم الإدارة طويل جداً').trim(),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

interface EditDepartmentProps {
    department: Department;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export default function EditDepartment({ department, open, onOpenChange, onSuccess }: EditDepartmentProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { departments } = useDepartments();

    const form = useForm<DepartmentFormValues>({
        resolver: zodResolver(departmentSchema),
        defaultValues: {
            name: department.name || '',
        },
    });

    // Update form when department changes
    useEffect(() => {
        if (department) {
            form.reset({
                name: department.name || '',
            });
        }
    }, [department, form]);

    const onSubmit = async (data: DepartmentFormValues) => {
        if (!db) {
            alert('Firebase غير مهيأ');
            return;
        }

        setIsSubmitting(true);
        try {
            // Check if name already exists (excluding current department)
            const existingDept = departments.find(
                (d) => d.name === data.name.trim() && d.id !== department.id
            );
            if (existingDept) {
                alert('اسم الإدارة موجود مسبقاً');
                setIsSubmitting(false);
                return;
            }

            const departmentRef = doc(db, 'departments', department.id);
            await updateDoc(departmentRef, {
                name: data.name.trim(),
                updatedAt: new Date(),
            });

            form.reset();
            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            console.error('Error updating department:', error);
            alert('حدث خطأ أثناء تحديث الإدارة');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='font-cairo max-w-2xl'>
                <DialogHeader>
                    <DialogTitle className='text-start text-dark-green text-xl font-bold'>تعديل الإدارة</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6 mt-5'>
                        <FormField
                            control={form.control}
                            name='name'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className='text-sm font-bold text-gray-600'>اسم الإدارة *</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            className='w-full h-auto py-2.5 bg-[#f9f9f9]'
                                            placeholder='أدخل اسم الإدارة...'
                                            maxLength={40}
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
        </Dialog>
    );
}

