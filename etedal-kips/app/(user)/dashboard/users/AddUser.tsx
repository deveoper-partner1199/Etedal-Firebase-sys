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
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { FaUserPlus } from 'react-icons/fa6';
import { useDepartments } from '@/hooks/use-departments';

const userSchema = z.object({
    name: z.string().min(1, 'يجب إدخال الاسم').trim(),
    email: z.string().email('البريد الإلكتروني غير صحيح').toLowerCase(),
    password: z.string().min(1, 'يجب إدخال كلمة المرور'),
    departmentIds: z.array(z.string()).min(1, 'يجب اختيار إدارة واحدة على الأقل'),
    role: z.enum(['manager', 'user']),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function AddUser() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [tagsOpen, setTagsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { departments } = useDepartments();

    const form = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            departmentIds: [],
            role: 'user',
        },
    });

    const selectedDepartments = form.watch('departmentIds');

    const onSubmit = async (data: UserFormValues) => {
        if (!db) {
            alert('Firebase غير مهيأ');
            return;
        }

        setIsSubmitting(true);
        try {
            // Check if email already exists
            const emailLower = data.email.trim().toLowerCase();
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', emailLower));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                alert('البريد الإلكتروني موجود مسبقاً');
                setIsSubmitting(false);
                return;
            }

            // Add user to Firestore
            await addDoc(collection(db, 'users'), {
                name: data.name.trim(),
                email: emailLower,
                password: data.password,
                departmentIds: data.departmentIds,
                role: data.role,
                createdAt: new Date(),
            });

            form.reset();
            setDialogOpen(false);
        } catch (error) {
            console.error('Error adding user:', error);
            alert('حدث خطأ أثناء إضافة المستخدم');
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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button
                    type='button'
                    className='w-fit flex justify-center items-center gap-2 py-2 px-4 rounded-lg text-md font-bold text-white bg-[linear-gradient(to_right,var(--login-main-green),var(--login-dark-green))] shadow-[0_2px_12px_var(--login-shadow-button)] hover:brightness-110 hover:shadow-lg transition-all'
                >
                    <FaUserPlus className='w-4 h-4' />
                    إضافة مستخدم
                </Button>
            </DialogTrigger>
            <DialogContent className='font-cairo max-w-2xl'>
                <DialogHeader>
                    <DialogTitle className='text-start text-dark-green text-xl font-bold'>
                        إضافة مستخدم جديد
                    </DialogTitle>
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
                                            className='w-full h-auto py-2.5 bg-[#f9f9f9]'
                                            placeholder='أدخل البريد الإلكتروني...'
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
                                    <FormLabel className='text-sm font-bold text-gray-600'>كلمة المرور *</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            type='password'
                                            className='w-full h-auto py-2.5 bg-[#f9f9f9]'
                                            placeholder='أدخل كلمة المرور...'
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
                                            <TagsTrigger
                                                placeholder='اختر الإدارات...'
                                                className='cursor-pointer h-auto py-3 bg-[#f9f9f9]'
                                            >
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
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
        </Dialog>
    );
}
