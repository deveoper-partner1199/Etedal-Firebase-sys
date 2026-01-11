'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogHeader, DialogTrigger, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, X } from 'lucide-react';
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
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useStrategicGoals } from '@/hooks/use-strategic-goals';
import { useDepartments } from '@/hooks/use-departments';
import { useAchievementValueTypes } from '@/hooks/use-achievement-value-types';
import { Toast } from '@/components/ui/toast';
import IconPicker from '@/components/icon-picker';

interface Period {
    year: string;
    quarter: string;
    target: number;
    achieved: number;
    achievedTypeId: string;
}

const operationalGoalSchema = z.object({
    goal: z.string().min(1, 'يجب إدخال نص الهدف').trim(),
    strategicGoalId: z.string().min(1, 'يجب اختيار الهدف الاستراتيجي'),
    departmentId: z.string().min(1, 'يجب اختيار الإدارة'),
    indicator: z.string().min(1, 'يجب إدخال المؤشر').trim(),
    trackingMethod: z.enum(['weekly', 'direct']),
    weight: z.string(),
    excludeFromCalculation: z.boolean(),
    isReverse: z.boolean(),
    calculationMethod: z.string(),
    displayOnGeneral: z.boolean(),
    displayOnOperational: z.boolean(),
    icon: z.string(),
    periods: z
        .array(
            z.object({
                year: z.string().min(1),
                quarter: z.string().min(1),
                target: z.number().min(0),
                achieved: z.number().min(0),
                achievedTypeId: z.string().min(1),
            })
        )
        .min(1, 'يجب إضافة فترة زمنية واحدة على الأقل'),
});

type OperationalGoalFormValues = z.infer<typeof operationalGoalSchema>;

export default function AddOperationalGoal() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedQuarters, setSelectedQuarters] = useState<string[]>([]);
    const [tagsOpen, setTagsOpen] = useState(false);
    const [iconPickerOpen, setIconPickerOpen] = useState(false);

    const { goals: strategicGoals } = useStrategicGoals();
    const { departments } = useDepartments();
    const { achievementValueTypes } = useAchievementValueTypes();

    const form = useForm<OperationalGoalFormValues>({
        resolver: zodResolver(operationalGoalSchema),
        defaultValues: {
            goal: '',
            strategicGoalId: '',
            departmentId: '',
            indicator: '',
            trackingMethod: 'weekly',
            weight: '',
            excludeFromCalculation: false,
            isReverse: false,
            calculationMethod: '',
            displayOnGeneral: true,
            displayOnOperational: true,
            icon: 'fa-tasks',
            periods: [],
        },
    });

    const {
        fields: periodFields,
        append: appendPeriod,
        remove: removePeriod,
    } = useFieldArray({
        control: form.control,
        name: 'periods',
    });

    const selectedStrategicGoalId = form.watch('strategicGoalId');
    const excludeFromCalculation = form.watch('excludeFromCalculation');

    // Get available years from selected strategic goal
    const availableYears = useMemo(() => {
        if (!selectedStrategicGoalId) return [];
        const strategicGoal = strategicGoals.find((g) => g.id === selectedStrategicGoalId);
        if (!strategicGoal) return [];
        return Array.isArray(strategicGoal.years) ? strategicGoal.years : [];
    }, [selectedStrategicGoalId, strategicGoals]);

    const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
        setToast({ message, type });
    };

    const handleAddPeriod = () => {
        if (!selectedYear) {
            showToast('يجب اختيار سنة أولاً', 'error');
            return;
        }
        if (selectedQuarters.length === 0) {
            showToast('يجب اختيار ربع واحد على الأقل', 'error');
            return;
        }

        selectedQuarters.forEach((quarter) => {
            // Check if period already exists
            const exists = form.getValues('periods').some((p) => p.year === selectedYear && p.quarter === quarter);
            if (!exists) {
                appendPeriod({
                    year: selectedYear,
                    quarter,
                    target: 0,
                    achieved: 0,
                    achievedTypeId: achievementValueTypes[0]?.id || '',
                });
            }
        });

        setSelectedQuarters([]);
    };

    const toggleQuarter = (quarter: string) => {
        setSelectedQuarters((prev) =>
            prev.includes(quarter) ? prev.filter((q) => q !== quarter) : [...prev, quarter]
        );
    };

    const onSubmit = async (data: OperationalGoalFormValues) => {
        if (!db) {
            showToast('Firebase غير مهيأ', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const strategicGoal = strategicGoals.find((g) => g.id === data.strategicGoalId);
            const displayOptions: string[] = [];
            if (data.displayOnGeneral) displayOptions.push('general');
            if (data.displayOnOperational) displayOptions.push('operational');

            const progress = data.periods.map((period) => {
                const periodData: any = {
                    year: period.year,
                    quarter: period.quarter,
                    target: period.target,
                    achieved: period.achieved || 0,
                    achievedTypeId: period.achievedTypeId,
                    trackingMethod: data.trackingMethod,
                };

                // Initialize weeks for weekly tracking
                if (data.trackingMethod === 'weekly') {
                    periodData.weeks = Array.from({ length: 13 }, (_, i) => ({ week: i + 1, achieved: 0 }));
                    periodData.weeklyTotalAchieved = 0;
                }

                return periodData;
            });

            const goalData = {
                goal: data.goal.trim(),
                strategicGoalId: data.strategicGoalId,
                strategicGoalText: strategicGoal?.goal || '',
                departmentId: data.departmentId,
                indicator: data.indicator.trim(),
                trackingMethod: data.trackingMethod,
                weight: data.excludeFromCalculation ? 0 : parseFloat(data.weight || '0'),
                excludeFromCalculation: data.excludeFromCalculation,
                isReverse: data.isReverse,
                calculationMethod: data.calculationMethod || '',
                displayOptions,
                icon: data.icon,
                progress,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            await addDoc(collection(db, 'operationalGoals'), goalData);

            form.reset();
            setSelectedYear('');
            setSelectedQuarters([]);
            setDialogOpen(false);
            showToast('تم إضافة الهدف بنجاح', 'success');
        } catch (error) {
            console.error('Error adding operational goal:', error);
            showToast('حدث خطأ أثناء إضافة الهدف', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                    <Button
                        type='button'
                        className='w-fit flex justify-center items-center gap-2 py-2 px-4 rounded-lg text-md font-bold text-white bg-[linear-gradient(to_right,var(--login-main-green),var(--login-dark-green))] shadow-[0_2px_12px_var(--login-shadow-button)] hover:brightness-110 hover:shadow-lg transition-all'
                    >
                        <Plus className='w-4 h-4' />
                        إضافة هدف
                    </Button>
                </DialogTrigger>
                <DialogContent className='font-cairo w-full lg:min-w-4xl max-h-[90vh] overflow-y-auto'>
                    <DialogHeader>
                        <DialogTitle className='text-start text-dark-green text-xl font-bold'>
                            إضافة هدف تشغيلي
                        </DialogTitle>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6 mt-5'>
                            {/* Section 1: Basic Information */}
                            <div className='border-b pb-6'>
                                <h4 className='font-bold text-md mb-3 text-gray-700'>1. المعلومات الأساسية</h4>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                                    <FormField
                                        control={form.control}
                                        name='strategicGoalId'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className='text-sm font-bold text-gray-600'>
                                                    الهدف الاستراتيجي *
                                                </FormLabel>
                                                <Select
                                                    onValueChange={(value) => {
                                                        field.onChange(value);
                                                        setSelectedYear('');
                                                    }}
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder='اختر الهدف الاستراتيجي' />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent
                                                        position='popper'
                                                        className='w-(--radix-select-trigger-width)'
                                                    >
                                                        {strategicGoals.map((goal) => {
                                                            const yearsDisplay = Array.isArray(goal.years)
                                                                ? goal.years.join(', ')
                                                                : '';
                                                            return (
                                                                <SelectItem key={goal.id} value={goal.id}>
                                                                    {goal.goal}{' '}
                                                                    {yearsDisplay ? `(${yearsDisplay})` : ''}
                                                                </SelectItem>
                                                            );
                                                        })}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name='departmentId'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className='text-sm font-bold text-gray-600'>
                                                    الإدارة *
                                                </FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder='اختر الإدارة' />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent
                                                        position='popper'
                                                        className='w-(--radix-select-trigger-width)'
                                                    >
                                                        {departments.map((dept) => (
                                                            <SelectItem key={dept.id} value={dept.id}>
                                                                {dept.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name='goal'
                                    render={({ field }) => (
                                        <FormItem className='mb-4'>
                                            <FormLabel className='text-sm font-bold text-gray-600'>
                                                نص الهدف *
                                            </FormLabel>
                                            <div className='flex items-start gap-3'>
                                                <FormControl className='flex-1'>
                                                    <Textarea
                                                        {...field}
                                                        rows={3}
                                                        className='w-full'
                                                        placeholder='أدخل نص الهدف...'
                                                    />
                                                </FormControl>
                                                <div className='flex flex-col items-center gap-2'>
                                                    <FormField
                                                        control={form.control}
                                                        name='icon'
                                                        render={({ field: iconField }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <div className='flex flex-col items-center gap-2'>
                                                                        <Button
                                                                            type='button'
                                                                            variant='outline'
                                                                            onClick={() => setIconPickerOpen(true)}
                                                                            className='w-24 h-full flex flex-col items-center justify-center border border-gray-300 rounded-lg hover:border-(--login-main-green) transition'
                                                                        >
                                                                            <i
                                                                                className={`fa-solid ${
                                                                                    iconField.value || 'fa-tasks'
                                                                                } text-2xl text-slate-500`}
                                                                            ></i>
                                                                            <span className='text-xs mt-1'>
                                                                                اختر أيقونة
                                                                            </span>
                                                                        </Button>
                                                                    </div>
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Section 2: Indicator and Measurement */}
                            <div className='border-b pb-6'>
                                <h4 className='font-bold text-md mb-3 text-gray-700'>2. المؤشر والقياس</h4>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                                    <FormField
                                        control={form.control}
                                        name='indicator'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className='text-sm font-bold text-gray-600'>
                                                    المؤشر *
                                                </FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder='أدخل المؤشر...' />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name='trackingMethod'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className='text-sm font-bold text-gray-600'>
                                                    طريقة المتابعة *
                                                </FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent
                                                        position='popper'
                                                        className='w-(--radix-select-trigger-width)'
                                                    >
                                                        <SelectItem value='weekly'>تجميع أسبوعي</SelectItem>
                                                        <SelectItem value='direct'>إدخال مباشر للفترة</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name='weight'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className='text-sm font-bold text-gray-600'>
                                                    الوزن *
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type='number'
                                                        step='0.01'
                                                        disabled={excludeFromCalculation}
                                                        placeholder='أدخل الوزن...'
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name='calculationMethod'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className='text-sm font-bold text-gray-600'>
                                                    طريقة حساب المؤشر (اختياري)
                                                </FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder='أدخل طريقة الحساب...' />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className='flex items-center gap-6'>
                                    <FormField
                                        control={form.control}
                                        name='excludeFromCalculation'
                                        render={({ field }) => (
                                            <FormItem className='flex flex-row items-center space-x-2 space-x-reverse'>
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={(checked) => {
                                                            field.onChange(checked);
                                                            if (checked) {
                                                                form.setValue('weight', '');
                                                            }
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormLabel className='text-sm font-bold text-gray-600 cursor-pointer'>
                                                    بدون وزن
                                                </FormLabel>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name='isReverse'
                                        render={({ field }) => (
                                            <FormItem className='flex flex-row items-center space-x-2 space-x-reverse'>
                                                <FormControl>
                                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                                <FormLabel className='text-sm font-bold text-gray-600 cursor-pointer'>
                                                    هدف عكسي (الأقل أفضل)
                                                </FormLabel>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Section 3: Display Options */}
                            <div className='border-b pb-6'>
                                <h4 className='font-bold text-md mb-3 text-gray-700'>3. خيارات العرض</h4>
                                <div className='flex items-center gap-6'>
                                    <FormField
                                        control={form.control}
                                        name='displayOnGeneral'
                                        render={({ field }) => (
                                            <FormItem className='flex flex-row items-center space-x-2 space-x-reverse'>
                                                <FormControl>
                                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                                <FormLabel className='text-sm font-bold text-gray-600 cursor-pointer flex items-center gap-1.5'>
                                                    <i className='fa-solid fa-gauge-high'></i> الشاشة العامة
                                                </FormLabel>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name='displayOnOperational'
                                        render={({ field }) => (
                                            <FormItem className='flex flex-row items-center space-x-2 space-x-reverse'>
                                                <FormControl>
                                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                                <FormLabel className='text-sm font-bold text-gray-600 cursor-pointer flex items-center gap-1.5'>
                                                    <i className='fa-solid fa-list-check'></i> الأداء التشغيلي
                                                </FormLabel>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Section 4: Time Periods */}
                            <div>
                                <h4 className='font-bold text-md mb-3 text-gray-700'>4. الفترات الزمنية</h4>
                                <div className='mb-4 space-y-3'>
                                    <div className='flex gap-3'>
                                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                                            <SelectTrigger className='flex-1'>
                                                <SelectValue placeholder='اختر السنة' />
                                            </SelectTrigger>
                                            <SelectContent
                                                position='popper'
                                                className='w-(--radix-select-trigger-width)'
                                            >
                                                {availableYears.map((year) => (
                                                    <SelectItem key={year} value={year}>
                                                        {year}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Tags
                                            open={tagsOpen}
                                            onOpenChange={setTagsOpen}
                                            value={selectedQuarters.join(',')}
                                        >
                                            <TagsTrigger
                                                placeholder='اختر الأرباع...'
                                                className='flex-1 cursor-pointer h-auto py-3 bg-[#f9f9f9]'
                                            >
                                                {selectedQuarters.map((q) => (
                                                    <TagsValue key={q} onRemove={() => toggleQuarter(q)}>
                                                        {q === 'Q1'
                                                            ? 'الربع الأول'
                                                            : q === 'Q2'
                                                            ? 'الربع الثاني'
                                                            : q === 'Q3'
                                                            ? 'الربع الثالث'
                                                            : 'الربع الرابع'}
                                                    </TagsValue>
                                                ))}
                                            </TagsTrigger>
                                            <TagsContent>
                                                <TagsInput placeholder='ابحث...' />
                                                <TagsList>
                                                    <TagsEmpty>لا توجد أرباع</TagsEmpty>
                                                    <TagsGroup>
                                                        {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => {
                                                            const isSelected = selectedQuarters.includes(q);
                                                            return (
                                                                <TagsItem
                                                                    key={q}
                                                                    value={q}
                                                                    onSelect={() => toggleQuarter(q)}
                                                                    className='cursor-pointer'
                                                                >
                                                                    <div className='flex items-center justify-between w-full'>
                                                                        <span>
                                                                            {q === 'Q1'
                                                                                ? 'الربع الأول'
                                                                                : q === 'Q2'
                                                                                ? 'الربع الثاني'
                                                                                : q === 'Q3'
                                                                                ? 'الربع الثالث'
                                                                                : 'الربع الرابع'}
                                                                        </span>
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

                                        <Button type='button' onClick={handleAddPeriod} className='shrink-0'>
                                            <Plus className='h-4 w-4 mr-2' />
                                            إضافة فترة
                                        </Button>
                                    </div>
                                </div>

                                <div className='space-y-3'>
                                    {periodFields.length === 0 ? (
                                        <div className='text-center py-6 text-gray-400 bg-gray-50 rounded-lg'>
                                            لم يتم إضافة أي فترات زمنية بعد
                                        </div>
                                    ) : (
                                        periodFields.map((field, index) => (
                                            <div
                                                key={field.id}
                                                className='border border-gray-200 rounded-lg p-4 space-y-3'
                                            >
                                                <div className='flex justify-between items-center'>
                                                    <span className='font-medium'>
                                                        {form.watch(`periods.${index}.year`)} - الربع{' '}
                                                        {form.watch(`periods.${index}.quarter`).replace('Q', '')}
                                                    </span>
                                                    <Button
                                                        type='button'
                                                        variant='ghost'
                                                        size='icon-sm'
                                                        onClick={() => removePeriod(index)}
                                                        className='text-red-500 hover:text-red-700'
                                                    >
                                                        <X className='h-4 w-4' />
                                                    </Button>
                                                </div>

                                                <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                                                    <FormField
                                                        control={form.control}
                                                        name={`periods.${index}.target`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className='text-sm text-gray-600'>
                                                                    المستهدف
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        {...field}
                                                                        type='number'
                                                                        step='0.01'
                                                                        value={field.value || ''}
                                                                        onChange={(e) =>
                                                                            field.onChange(
                                                                                parseFloat(e.target.value) || 0
                                                                            )
                                                                        }
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name={`periods.${index}.achievedTypeId`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className='text-sm text-gray-600'>
                                                                    نوع القيمة
                                                                </FormLabel>
                                                                <Select
                                                                    onValueChange={field.onChange}
                                                                    value={field.value}
                                                                >
                                                                    <FormControl>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder='اختر نوع القيمة' />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent
                                                                        position='popper'
                                                                        className='w-(--radix-select-trigger-width)'
                                                                    >
                                                                        {achievementValueTypes.map((type) => (
                                                                            <SelectItem key={type.id} value={type.id}>
                                                                                {type.name}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <DialogFooter className='gap-2'>
                                <Button
                                    type='button'
                                    variant='outline'
                                    onClick={() => {
                                        form.reset();
                                        setSelectedYear('');
                                        setSelectedQuarters([]);
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
                                        'إضافة الهدف'
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Icon Picker */}
            <IconPicker
                open={iconPickerOpen}
                onOpenChange={setIconPickerOpen}
                onSelect={(iconClass) => {
                    form.setValue('icon', iconClass);
                }}
                currentIcon={form.watch('icon')}
            />

            {/* Toast Notification */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </>
    );
}
