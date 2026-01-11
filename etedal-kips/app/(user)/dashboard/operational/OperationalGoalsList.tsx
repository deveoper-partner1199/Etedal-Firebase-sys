'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOperationalGoals } from '@/hooks/use-operational-goals';
import { useDepartments } from '@/hooks/use-departments';
import OperationalGoalCard from './OperationalGoalCard';

interface OperationalGoalsFilter {
    search: string;
    departmentId: string;
}

export default function OperationalGoalsList() {
    const { goals, loading, error } = useOperationalGoals();
    const { departments } = useDepartments();
    const [filters, setFilters] = useState<OperationalGoalsFilter>({
        search: '',
        departmentId: '',
    });

    const departmentsMap = useMemo(() => {
        const map: Record<string, string> = {};
        departments.forEach((dept) => {
            map[dept.id] = dept.name;
        });
        return map;
    }, [departments]);

    const filteredGoals = useMemo(() => {
        return goals.filter((g) => {
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

            const matchDept = !filters.departmentId || g.departmentId === filters.departmentId;

            return matchSearch && matchDept;
        });
    }, [goals, filters, departmentsMap]);

    const handleFilterChange = (key: keyof OperationalGoalsFilter, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    if (loading) {
        return (
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                {[...Array(3)].map((_, idx) => (
                    <div key={idx} className='card fadein flex flex-col gap-2 p-6 animate-pulse'>
                        <div className='h-4 bg-gray-200 rounded w-3/4 mb-2'></div>
                        <div className='h-4 bg-gray-200 rounded w-1/2'></div>
                    </div>
                ))}
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
        <div className='space-y-6'>
            {/* Filters */}
            <div className='flex flex-col md:flex-row gap-3'>
                <Input
                    type='text'
                    placeholder='بحث بالاسم...'
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className='w-full md:w-1/3'
                />

                <Select
                    value={filters.departmentId || 'all'}
                    onValueChange={(value) => handleFilterChange('departmentId', value === 'all' ? '' : value)}
                >
                    <SelectTrigger className='w-full md:w-1/4'>
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
            </div>

            {/* Goals Grid */}
            {filteredGoals.length > 0 ? (
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                    {filteredGoals.map((goal) => (
                        <OperationalGoalCard key={goal.id} goal={goal} />
                    ))}
                </div>
            ) : (
                <div className='text-gray-400 col-span-3 p-12 text-center'>
                    لا توجد أهداف تشغيلية تطابق الفلاتر المحددة
                </div>
            )}
        </div>
    );
}

