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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Tags,
    TagsTrigger,
    TagsValue,
    TagsContent,
    TagsInput,
    TagsList,
    TagsEmpty,
    TagsGroup,
    TagsItem,
} from '@/components/ui/shadcn-io/tags';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { User } from '@/hooks/use-users';
import { useDepartments } from '@/hooks/use-departments';

const userSchema = z.object({
    name: z.string().min(1, 'يجب إدخال الاسم').trim(),
    email: z.string().email('البريد الإلكتروني غير صحيح'),
    password: z.string().optional(),
    departmentIds: z.array(z.string()).min(1, 'يجب اختيار إدارة واحدة على الأقل'),
    role: z.enum(['manager', 'user']),
});

type UserFormValues = z.infer<typeof userSchema>;

interface EditUserProps {
    user: User;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export default function EditUser({ user, open, onOpenChange, onSuccess }: EditUserProps) {
    const [tagsOpen, setTagsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { departments } = useDepartments();

    const userDeptIds = user.departmentIds || (user.departmentId ? [user.departmentId] : []);

    const form = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            name: user.name || '',
            email: user.email || '',
            password: '',
            departmentIds: userDeptIds,
            role: (user.role as 'manager' | 'user') || 'user',
        },
    });

    // Update form when user changes
    useEffect(() => {
        if (user) {
            const userDeptIds = user.departmentIds || (user.departmentId ? [user.departmentId] : []);
            form.reset({
                name: user.name || '',
                email: user.email || '',
                password: '',
                departmentIds: userDeptIds,
                role: (user.role as 'manager' | 'user') || 'user',
            });
        }
    }, [user, form]);

    const selectedDepartments = form.watch('departmentIds');

    const onSubmit = async (data: UserFormValues) => {
        if (!db) {
            alert('Firebase غير مهيأ');
            return;
        }

        setIsSubmitting(true);
        try {
            const updateData: any = {
                name: data.name.trim(),
                departmentIds: data.departmentIds,
                role: data.role,
                updatedAt: new Date(),
            };

            // Only update password if provided
            if (data.password && data.password.trim()) {
                updateData.password = data.password.trim();
            }

            const userRef = doc(db, 'users', user.id);
            await updateDoc(userRef, updateData);

            form.reset();
            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            console.error('Error updating user:', error);
            alert('حدث خطأ أثناء تحديث المستخدم');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleDepartment = (deptId: string) => {
        const currentDepts = form.getValues('departmentIds');
        const newDepts = currentDepts.includes(deptId)
            ? currentDepts.filter((id) => id !== deptId)
            : [...currentDepts, deptId];
        form.setValue('departmentIds', newDepts, { shouldValidate: true });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='font-cairo max-w-2xl'>
                <DialogHeader>
                    <DialogTitle className='text-start text-dark-green text-xl font-bold'>تعديل مستخدم</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6 mt-5'>
                        <FormField
                            control={form.control}
                            name='name'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className='text-sm font-bold text-gray-600'>الاسم *</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            className='w-full h-auto py-2.5 bg-[#f9f9f9]'
                                            placeholder='أدخل اسم المستخدم...'
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name='email'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className='text-sm font-bold text-gray-600'>
                                        البريد الإلكتروني *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            type='email'
                                            className='w-full h-auto py-2.5 bg-gray-100'
                                            disabled
                                        />
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
                                    <FormLabel className='text-sm font-bold text-gray-600'>
                                        كلمة المرور الجديدة (اختياري)
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            type='password'
                                            className='w-full h-auto py-2.5 bg-[#f9f9f9]'
                                            placeholder='اتركه فارغاً للتجاهل'
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name='departmentIds'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className='text-sm font-bold text-gray-600'>الإدارات *</FormLabel>
                                    <FormControl>
                                        <Tags
                                            open={tagsOpen}
                                            onOpenChange={setTagsOpen}
                                            value={selectedDepartments.join(',')}
                                        >
                                            <TagsTrigger className='py-2.5 bg-[#f9f9f9]' placeholder='اختر الإدارات...'>
                                                {selectedDepartments.map((deptId) => {
                                                    const dept = departments.find((d) => d.id === deptId);
                                                    return (
                                                        <TagsValue
                                                            key={deptId}
                                                            onRemove={() => toggleDepartment(deptId)}
                                                        >
                                                            {dept?.name || deptId}
                                                        </TagsValue>
                                                    );
                                                })}
                                            </TagsTrigger>
                                            <TagsContent>
                                                <TagsInput placeholder='ابحث عن إدارة...' />
                                                <TagsList>
                                                    <TagsEmpty>لا توجد إدارات</TagsEmpty>
                                                    <TagsGroup>
                                                        {departments.map((dept) => {
                                                            const isSelected = selectedDepartments.includes(dept.id);
                                                            return (
                                                                <TagsItem
                                                                    key={dept.id}
                                                                    value={dept.id}
                                                                    onSelect={() => {
                                                                        toggleDepartment(dept.id);
                                                                    }}
                                                                    className='cursor-pointer'
                                                                >
                                                                    <div className='flex items-center justify-between w-full'>
                                                                        <span>{dept.name}</span>
                                                                        {isSelected && (
                                                                            <span className='text-dark-green'>✓</span>
                                                                        )}
                                                                    </div>
                                                                </TagsItem>
                                                            );
                                                        })}
                                                    </TagsGroup>
                                                </TagsList>
                                            </TagsContent>
                                        </Tags>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name='role'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className='text-sm font-bold text-gray-600'>الصلاحية *</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className='w-full h-auto! py-3! bg-[#f9f9f9]'>
                                                <SelectValue placeholder='اختر الصلاحية...' />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent
                                            className='w-(--radix-select-trigger-width)'
                                            align='start'
                                            position='popper'
                                        >
                                            <SelectItem value='manager'>مدير</SelectItem>
                                            <SelectItem value='user'>مستخدم</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                                        جاري الحفظ...
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
