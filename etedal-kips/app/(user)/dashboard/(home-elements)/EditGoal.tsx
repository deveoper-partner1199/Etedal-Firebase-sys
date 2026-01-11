'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogHeader, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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
import { StrategicGoal } from '@/hooks/use-strategic-goals';

const strategicGoalSchema = z.object({
    goal: z.string().min(1, 'يجب إدخال نص الهدف').trim(),
    years: z.array(z.string()).min(1, 'يجب اختيار سنة واحدة على الأقل'),
});

type StrategicGoalFormValues = z.infer<typeof strategicGoalSchema>;

interface EditGoalProps {
    goal: StrategicGoal;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export default function EditGoal({ goal, open, onOpenChange, onSuccess }: EditGoalProps) {
    const [tagsOpen, setTagsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<StrategicGoalFormValues>({
        resolver: zodResolver(strategicGoalSchema),
        defaultValues: {
            goal: goal.goal || '',
            years: goal.years || [],
        },
    });

    // Update form when goal changes
    useEffect(() => {
        if (goal) {
            form.reset({
                goal: goal.goal || '',
                years: goal.years || [],
            });
        }
    }, [goal, form]);

    const selectedYears = form.watch('years');
    const currentYear = new Date().getFullYear();
    const availableYears = Array.from({ length: 6 }, (_, i) => String(currentYear + i));

    const onSubmit = async (data: StrategicGoalFormValues) => {
        if (!db) {
            alert('Firebase غير مهيأ');
            return;
        }

        setIsSubmitting(true);
        try {
            const goalRef = doc(db, 'strategicGoals', goal.id);
            await updateDoc(goalRef, {
                goal: data.goal.trim(),
                years: data.years,
                updatedAt: new Date(),
            });

            form.reset();
            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            console.error('Error updating strategic goal:', error);
            alert('حدث خطأ أثناء تحديث الهدف');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleYear = (year: string) => {
        const currentYears = form.getValues('years');
        const newYears = currentYears.includes(year) ? currentYears.filter((y) => y !== year) : [...currentYears, year];
        form.setValue('years', newYears, { shouldValidate: true });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='font-cairo max-w-2xl'>
                <DialogHeader>
                    <DialogTitle className='text-start text-dark-green text-xl font-bold'>
                        تعديل هدف استراتيجي
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6 mt-5'>
                        <FormField
                            control={form.control}
                            name='years'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className='text-md font-bold text-gray-600'>السنوات *</FormLabel>
                                    <FormControl>
                                        <Tags
                                            open={tagsOpen}
                                            onOpenChange={setTagsOpen}
                                            value={selectedYears.join(',')}
                                        >
                                            <TagsTrigger
                                                placeholder='اختر السنوات...'
                                                className='cursor-pointer h-auto py-3 bg-[#f9f9f9]'
                                            >
                                                {selectedYears.map((year) => (
                                                    <TagsValue key={year} onRemove={() => toggleYear(year)}>
                                                        {year}
                                                    </TagsValue>
                                                ))}
                                            </TagsTrigger>
                                            <TagsContent>
                                                <TagsInput placeholder='ابحث عن سنة...' />
                                                <TagsList>
                                                    <TagsEmpty>لا توجد سنوات</TagsEmpty>
                                                    <TagsGroup>
                                                        {availableYears.map((year) => {
                                                            const isSelected = selectedYears.includes(year);
                                                            return (
                                                                <TagsItem
                                                                    key={year}
                                                                    value={year}
                                                                    onSelect={() => {
                                                                        toggleYear(year);
                                                                    }}
                                                                    className='cursor-pointer'
                                                                >
                                                                    <div className='flex items-center justify-between w-full'>
                                                                        <span>{year}</span>
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
                            name='goal'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className='text-md font-bold text-gray-600'>نص الهدف *</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            rows={3}
                                            className='w-full bg-[#f9f9f9] min-h-24'
                                            placeholder='أدخل نص الهدف الاستراتيجي...'
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
