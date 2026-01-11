'use client';

import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOperationalGoals, OperationalGoal } from '@/hooks/use-operational-goals';
import { useDepartments } from '@/hooks/use-departments';
import { useAchievementValueTypes } from '@/hooks/use-achievement-value-types';
import GoalDetailsDialog from './GoalDetailsDialog';

interface TrackingFilter {
    search: string;
    departmentId: string;
    quarter: string;
    method: string;
    week: string;
}

interface TrackingTableProps {
    onGoalClick: (goal: OperationalGoal) => void;
}

export default function TrackingTable({ onGoalClick }: TrackingTableProps) {
    const { goals, loading, error } = useOperationalGoals();
    const { departments } = useDepartments();
    const { achievementValueTypes } = useAchievementValueTypes();
    const [filters, setFilters] = useState<TrackingFilter>({
        search: '',
        departmentId: '',
        quarter: '',
        method: '',
        week: '',
    });

    // Create maps for quick lookup
    const departmentsMap = useMemo(() => {
        const map: Record<string, string> = {};
        departments.forEach((dept) => {
            map[dept.id] = dept.name;
        });
        return map;
    }, [departments]);

    const achievementValueTypesMap = useMemo(() => {
        const map: Record<string, string> = {};
        achievementValueTypes.forEach((type) => {
            map[type.id] = type.name;
        });
        return map;
    }, [achievementValueTypes]);

    // Helper function to calculate achievement percentage
    const calculateAchievementPercent = (period: any, isReverse: boolean = false): number => {
        let achievedValue = 0;
        const trackingMethod = period.trackingMethod || 'weekly';

        if (trackingMethod === 'direct') {
            achievedValue = period.achieved || 0;
        } else {
            achievedValue =
                period.weeklyTotalAchieved !== undefined ? period.weeklyTotalAchieved : period.achieved || 0;
        }

        let percent = 0;
        const typeName = achievementValueTypesMap[period.achievedTypeId] || period.achievedType || '';

        if (typeName === 'نسبة مئوية') {
            const target = parseFloat(period.target) || 100;
            percent = (parseFloat(String(achievedValue)) / target) * 100;
        } else {
            const target = parseFloat(period.target);
            if (target > 0) {
                percent = (parseFloat(String(achievedValue)) / target) * 100;
            } else if (target === 0 && parseFloat(String(achievedValue)) >= 0) {
                percent = 100;
            } else {
                percent = 0;
            }
        }

        percent = isNaN(percent) ? 0 : percent;
        return percent > 500 ? 500 : percent;
    };

    // Helper function to get status color
    const getStatusColor = (percent: number, isReverse: boolean = false): string => {
        if (isReverse) percent = 100 - percent;
        if (percent < 50) return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800';
        if (percent >= 50 && percent <= 60) return 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800';
        if (percent > 60 && percent <= 79) return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800';
        return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800';
    };

    // Helper function to get absolute week number
    const getAbsoluteWeek = (quarter: string, relativeWeek: number): number => {
        const quarterIndex = parseInt(quarter.replace('Q', '')) - 1;
        return quarterIndex * 13 + relativeWeek;
    };

    // Filter goals based on filters
    const filteredGoals = useMemo(() => {
        return goals.filter((g) => {
            // 1. Search filter
            let matchSearch = true;
            if (filters.search) {
                const searchIn =
                    (g.goal || '') +
                    ' ' +
                    (g.strategicGoalText || '') +
                    ' ' +
                    (g.indicator || '') +
                    ' ' +
                    (departmentsMap[g.departmentId || ''] || '');
                matchSearch = searchIn.toLowerCase().includes(filters.search.toLowerCase());
            }

            // 2. Department filter
            const matchDept = !filters.departmentId || g.departmentId === filters.departmentId;

            // 3. Quarter filter
            const matchQuarter =
                !filters.quarter || (g.progress && g.progress.some((p) => p.quarter === filters.quarter));

            // 4. Method filter
            const goalMethod = g.trackingMethod || 'weekly';
            const matchMethod = !filters.method || goalMethod === filters.method;

            // 5. Week filter
            let matchWeek = true;
            if (filters.week && filters.method === 'weekly') {
                if (goalMethod !== 'weekly') {
                    matchWeek = false;
                } else {
                    const selectedWeek = parseInt(filters.week);
                    if (!g.progress) {
                        matchWeek = false;
                    } else {
                        matchWeek = g.progress.some((period) => {
                            if (filters.quarter && period.quarter !== filters.quarter) return false;

                            if (!period.weeks) return false;

                            return period.weeks.some((w) => {
                                if (filters.quarter && filters.quarter !== 'all') {
                                    return w.week === selectedWeek;
                                } else {
                                    return getAbsoluteWeek(period.quarter, w.week) === selectedWeek;
                                }
                            });
                        });
                    }
                }
            }

            return matchSearch && matchDept && matchQuarter && matchMethod && matchWeek;
        });
    }, [goals, filters, departmentsMap]);

    // Calculate average percentage for each goal
    const goalsWithPercentages = useMemo(() => {
        return filteredGoals.map((g) => {
            let totalPercent = 0;
            let count = 0;

            if (g.progress) {
                g.progress.forEach((period) => {
                    if (filters.quarter && period.quarter !== filters.quarter) return;
                    const percent = calculateAchievementPercent(period, g.isReverse || false);
                    totalPercent += percent;
                    count++;
                });
            }

            const avgPercent = count > 0 ? totalPercent / count : 0;
            const statusColor = getStatusColor(avgPercent, g.isReverse || false);

            return {
                ...g,
                avgPercent,
                statusColor,
            };
        });
    }, [filteredGoals, filters.quarter, achievementValueTypesMap]);

    // Update week options based on quarter and method
    const weekOptions = useMemo(() => {
        if (filters.method !== 'weekly') return [];

        const options: { value: string; label: string }[] = [{ value: 'all', label: 'كل الأسابيع' }];

        if (filters.quarter) {
            // Show 13 weeks for selected quarter
            for (let i = 1; i <= 13; i++) {
                options.push({ value: String(i), label: `الأسبوع ${i} (من الربع)` });
            }
        } else {
            // Show all 52 weeks
            for (let i = 1; i <= 52; i++) {
                options.push({ value: String(i), label: `الأسبوع ${i}` });
            }
        }

        return options;
    }, [filters.quarter, filters.method]);

    const handleFilterChange = (key: keyof TrackingFilter, value: string) => {
        setFilters((prev) => {
            const newFilters = { ...prev, [key]: value };
            // Reset week filter if method changes
            if (key === 'method' && value !== 'weekly' && value !== 'all') {
                newFilters.week = '';
            }
            return newFilters;
        });
    };

    if (loading) {
        return (
            <div className='flex items-center justify-center p-12'>
                <div className='text-gray-500'>جاري التحميل...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className='flex items-center justify-center p-12'>
                <div className='text-red-500'>حدث خطأ أثناء تحميل الأهداف: {error.message}</div>
            </div>
        );
    }

    return (
        <div className='space-y-4'>
            {/* Filters */}
            <div className='flex flex-col md:flex-row gap-3 flex-wrap'>
                <Input
                    type='text'
                    placeholder='بحث بالاسم...'
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className='w-full md:w-1/4'
                />

                <Select
                    value={filters.departmentId || 'all'}
                    onValueChange={(value) => handleFilterChange('departmentId', value === 'all' ? '' : value)}
                >
                    <SelectTrigger className='w-full md:w-1/5'>
                        <SelectValue placeholder='كل الإدارات' />
                    </SelectTrigger>
                    <SelectContent position='popper' className='w-(--radix-select-trigger-width)'>
                        <SelectItem value='all'>كل الإدارات</SelectItem>
                        {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.quarter || 'all'}
                    onValueChange={(value) => {
                        handleFilterChange('quarter', value === 'all' ? '' : value);
                        // Update week options when quarter changes
                    }}
                >
                    <SelectTrigger className='w-full md:w-1/5'>
                        <SelectValue placeholder='كل الأرباع' />
                    </SelectTrigger>
                    <SelectContent position='popper' className='w-(--radix-select-trigger-width)'>
                        <SelectItem value='all'>كل الأرباع</SelectItem>
                        <SelectItem value='Q1'>الربع الأول</SelectItem>
                        <SelectItem value='Q2'>الربع الثاني</SelectItem>
                        <SelectItem value='Q3'>الربع الثالث</SelectItem>
                        <SelectItem value='Q4'>الربع الرابع</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={filters.method || 'all'}
                    onValueChange={(value) => {
                        handleFilterChange('method', value === 'all' ? '' : value);
                    }}
                >
                    <SelectTrigger className='w-full md:w-1/5'>
                        <SelectValue placeholder='كل طرق المتابعة' />
                    </SelectTrigger>
                    <SelectContent position='popper' className='w-(--radix-select-trigger-width)'>
                        <SelectItem value='all'>كل طرق المتابعة</SelectItem>
                        <SelectItem value='weekly'>تجميع أسبوعي</SelectItem>
                        <SelectItem value='direct'>إدخال مباشر</SelectItem>
                    </SelectContent>
                </Select>

                {filters.method === 'weekly' && (
                    <Select
                        value={filters.week || 'all'}
                        onValueChange={(value) => handleFilterChange('week', value === 'all' ? '' : value)}
                    >
                        <SelectTrigger className='w-full md:w-1/6'>
                            <SelectValue placeholder='كل الأسابيع' />
                        </SelectTrigger>
                        <SelectContent position='popper' className='w-(--radix-select-trigger-width)'>
                            {weekOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            {/* Table */}
            <div className='rounded-md shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden bg-white'>
                <Table>
                    <TableHeader className='border-0! [&_tr]:border-0'>
                        <TableRow className='border-0'>
                            <TableHead className='bg-[linear-gradient(to_right,#eafbf5,#d8f7ec)] text-[#03866d] font-bold text-right p-4 border-0'>
                                #
                            </TableHead>
                            <TableHead className='bg-[linear-gradient(to_right,#eafbf5,#d8f7ec)] text-[#03866d] font-bold text-right p-4 border-0'>
                                الهدف الاستراتيجي
                            </TableHead>
                            <TableHead className='bg-[linear-gradient(to_right,#eafbf5,#d8f7ec)] text-[#03866d] font-bold text-right p-4 border-0'>
                                الهدف التشغيلي
                            </TableHead>
                            <TableHead className='bg-[linear-gradient(to_right,#eafbf5,#d8f7ec)] text-[#03866d] font-bold text-right p-4 border-0'>
                                المؤشر
                            </TableHead>
                            <TableHead className='bg-[linear-gradient(to_right,#eafbf5,#d8f7ec)] text-[#03866d] font-bold text-right p-4 border-0'>
                                الإدارة
                            </TableHead>
                            <TableHead className='bg-[linear-gradient(to_right,#eafbf5,#d8f7ec)] text-[#03866d] font-bold text-right p-4 border-0'>
                                النسبة
                            </TableHead>
                            <TableHead className='bg-[linear-gradient(to_right,#eafbf5,#d8f7ec)] text-[#03866d] font-bold text-right p-4 border-0'>
                                الإجراءات
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className='border-0'>
                        {goalsWithPercentages.length > 0 ? (
                            goalsWithPercentages.map((goal, idx) => (
                                <TableRow
                                    key={goal.id}
                                    className='bg-white border-0 hover:bg-[#f9f9f9] transition-colors'
                                >
                                    <TableCell className='p-4 text-wrap'>{idx + 1}</TableCell>
                                    <TableCell className='p-4 text-wrap'>{goal.strategicGoalText || ''}</TableCell>
                                    <TableCell className='p-4 text-wrap'>{goal.goal}</TableCell>
                                    <TableCell className='p-4 text-wrap'>{goal.indicator || ''}</TableCell>
                                    <TableCell className='p-4 text-wrap'>
                                        {goal.departmentId ? departmentsMap[goal.departmentId] : ''}
                                    </TableCell>
                                    <TableCell className='p-4 text-wrap'>
                                        <span className={`${goal.statusColor} rounded-full px-3 py-1`}>
                                            {goal.avgPercent.toFixed(1)}%
                                        </span>
                                    </TableCell>
                                    <TableCell className='p-4 text-wrap'>
                                        <Button
                                            variant='ghost'
                                            size='sm'
                                            onClick={() => onGoalClick(goal)}
                                            className='text-blue-500 hover:text-blue-700 hover:bg-blue-50'
                                        >
                                            <i className='fa-solid fa-eye mr-2'></i>
                                            للاستعراض والتعديل
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className='text-center py-6 text-gray-400'>
                                    لا توجد بيانات تطابق الفلاتر المحددة
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
