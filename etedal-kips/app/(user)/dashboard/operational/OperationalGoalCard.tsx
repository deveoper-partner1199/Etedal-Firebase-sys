'use client';

import { useState, useEffect, useMemo } from 'react';
import { OperationalGoal, PeriodProgress } from '@/hooks/use-operational-goals';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Pencil, Trash2, Info } from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getUserProfile } from '@/lib/firebase/auth';
import { useDepartments } from '@/hooks/use-departments';
import { useAchievementValueTypes } from '@/hooks/use-achievement-value-types';
import EditOperationalGoal from './EditOperationalGoal';
import { Toast } from '@/components/ui/toast';

interface OperationalGoalCardProps {
    goal: OperationalGoal;
    onUpdate?: () => void;
}

export default function OperationalGoalCard({ goal, onUpdate }: OperationalGoalCardProps) {
    const { departments } = useDepartments();
    const { achievementValueTypes } = useAchievementValueTypes();
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isManager, setIsManager] = useState(false);
    const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
    const [calculationMethodDialogOpen, setCalculationMethodDialogOpen] = useState(false);

    const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
        setToast({ message, type });
    };

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

    useEffect(() => {
        const checkPermissions = async () => {
            try {
                const userProfile = await getUserProfile();
                const manager = userProfile?.role === 'manager' || userProfile?.role === 'مدير';
                setIsManager(manager);
            } catch (error) {
                console.error('Error checking permissions:', error);
            } finally {
                setIsCheckingPermissions(false);
            }
        };
        checkPermissions();
    }, []);

    const calculateAchievementPercent = (period: PeriodProgress, isReverse: boolean = false): number => {
        let achievedValue = 0;
        const trackingMethod = goal.trackingMethod || 'weekly';

        if (trackingMethod === 'direct') {
            achievedValue = period.achieved || 0;
        } else {
            achievedValue =
                period.weeklyTotalAchieved !== undefined ? period.weeklyTotalAchieved : period.achieved || 0;
        }

        let percent = 0;
        const typeName = achievementValueTypesMap[period.achievedTypeId || ''] || period.achievedType || '';

        if (typeName === 'نسبة مئوية') {
            const target = parseFloat(String(period.target)) || 100;
            percent = (parseFloat(String(achievedValue)) / target) * 100;
        } else {
            const target = parseFloat(String(period.target));
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

    const getProgressColor = (percent: number, isReverse: boolean = false): string => {
        if (isReverse) percent = 100 - percent;
        if (percent < 50) return 'bg-red-500';
        if (percent >= 50 && percent <= 60) return 'bg-orange-500';
        if (percent > 60 && percent <= 79) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getPeriodColorClasses = (color: string): { bg: string; text: string } => {
        switch (color) {
            case 'red':
                return { bg: 'bg-red-100', text: '' };
            case 'orange':
                return { bg: 'bg-orange-100', text: '' };
            case 'yellow':
                return { bg: 'bg-yellow-100', text: '' };
            case 'green':
                return { bg: 'bg-green-100', text: '' };
            default:
                return { bg: 'bg-gray-100', text: '' };
        }
    };

    const getStatusColor = (percent: number, isReverse: boolean = false): string => {
        if (isReverse) percent = 100 - percent;
        if (percent < 50) return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800';
        if (percent >= 50 && percent <= 60) return 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800';
        if (percent > 60 && percent <= 79) return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800';
        return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800';
    };

    const periodsSummary = useMemo(() => {
        if (!goal.progress || goal.progress.length === 0) return [];

        return goal.progress
            .sort((a, b) => (a.year + a.quarter).localeCompare(b.year + b.quarter))
            .map((period) => {
                const percent = calculateAchievementPercent(period, goal.isReverse || false);
                const color = getProgressColor(percent, goal.isReverse || false);
                return {
                    year: period.year,
                    quarter: period.quarter.replace('Q', ''),
                    percent: Math.round(percent),
                    color: color.replace('bg-', '').replace('-500', ''),
                };
            });
    }, [goal.progress, goal.isReverse, achievementValueTypesMap]);

    const avgPercent = useMemo(() => {
        if (!goal.progress || goal.progress.length === 0) return 0;
        let totalPercent = 0;
        let count = 0;
        goal.progress.forEach((period) => {
            const percent = calculateAchievementPercent(period, goal.isReverse || false);
            totalPercent += percent;
            count++;
        });
        return count > 0 ? totalPercent / count : 0;
    }, [goal.progress, goal.isReverse, achievementValueTypesMap]);

    const progressColor = getProgressColor(avgPercent, goal.isReverse || false);
    const statusColor = getStatusColor(avgPercent, goal.isReverse || false);
    const reverseText = goal.isReverse ? '↪️ ' : '';
    const deptName = goal.departmentId ? departmentsMap[goal.departmentId] : '';
    const displayOptions = (goal as any).displayOptions || [];

    const handleDelete = async () => {
        if (!db) {
            showToast('Firebase غير مهيأ', 'error');
            return;
        }

        setIsDeleting(true);
        try {
            const goalRef = doc(db, 'operationalGoals', goal.id);
            await deleteDoc(goalRef);
            setDeleteDialogOpen(false);
            showToast('تم حذف الهدف بنجاح', 'success');
            onUpdate?.();
        } catch (error) {
            console.error('Error deleting operational goal:', error);
            showToast('حدث خطأ أثناء حذف الهدف', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    if (isCheckingPermissions) {
        return (
            <Card className='card fadein flex flex-col gap-2 p-6'>
                <div className='animate-pulse'>
                    <div className='h-4 bg-gray-200 rounded w-3/4 mb-2'></div>
                    <div className='h-4 bg-gray-200 rounded w-1/2'></div>
                </div>
            </Card>
        );
    }

    return (
        <>
            <Card className='card  flex hover:-translate-y-1.5 border border-neutral-50 hover:border-dark-green flex-col gap-2 p-6 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all duration-300'>
                <div className='flex justify-between items-start mb-1'>
                    <span className='text-xs font-bold text-[#03866d] bg-[#eafbf5] px-3 py-1 rounded-full'>
                        {deptName || '\u00A0'}
                    </span>
                    {reverseText && <span className='reverse-indicator'>{reverseText}</span>}
                </div>

                <div className='flex items-start gap-3'>
                    <i className={`fa-solid ${goal.icon || 'fa-tasks'} text-2xl text-slate-400 mt-1`}></i>
                    <div className='flex-1'>
                        <div className='font-bold text-base md:text-lg text-[#2e3d34] leading-relaxed'>{goal.goal}</div>
                        <div className='text-sm text-gray-500'>{goal.strategicGoalText || ''}</div>
                    </div>
                </div>

                <div className='flex flex-wrap gap-2 my-2 items-center'>
                    {displayOptions.includes('general') && (
                        <span className='inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100'>
                            <i className='fa-solid fa-gauge-high'></i> الشاشة العامة
                        </span>
                    )}
                    {displayOptions.includes('operational') && (
                        <span className='inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium bg-green-100'>
                            <i className='fa-solid fa-list-check'></i> الأداء التشغيلي
                        </span>
                    )}
                    {displayOptions.length === 0 && (
                        <span className='inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100'>
                            <i className='fa-solid fa-eye-slash'></i> مخفي
                        </span>
                    )}
                </div>

                <div className='flex flex-wrap gap-2 items-center'>
                    <span className='inline-flex items-center rounded-xl px-3 py-1 bg-indigo-50 text-indigo-900 text-xs font-semibold border border-indigo-100 relative'>
                        <i className='fa-solid fa-chart-bar mr-1'></i> {goal.indicator || ''}
                        {(goal as any).calculationMethod && (goal as any).calculationMethod.trim() && (
                            <button
                                className='ml-1 flex items-center justify-center rounded-full bg-white border border-indigo-200 w-6 h-6 shadow transition hover:bg-indigo-100'
                                title='طريقة حساب المؤشر'
                                onClick={() => setCalculationMethodDialogOpen(true)}
                            >
                                <Info className='text-indigo-600 text-xs' />
                            </button>
                        )}
                    </span>
                    <span className='inline-block rounded-xl px-3 py-1 bg-pink-50 text-pink-800 text-xs font-semibold border border-pink-100'>
                        الوزن: {goal.excludeFromCalculation ? 'بدون وزن' : goal.weight || ''}
                    </span>
                </div>

                <div className='flex flex-wrap gap-1 my-2 items-center min-h-[26px]'>
                    {periodsSummary.map((period, idx) => {
                        const colorClasses = getPeriodColorClasses(period.color);
                        return (
                            <span
                                key={idx}
                                className={`inline-flex items-center gap-1 mb-1 px-2 py-1 rounded-full text-xs font-medium bg-white border border-slate-200 shadow-sm ${colorClasses.bg} ${colorClasses.text}`}
                            >
                                <span className='font-bold'>
                                    {period.year}-Q{period.quarter}
                                </span>
                                <span className='ml-1 text-[10px] opacity-80'>{period.percent}%</span>
                            </span>
                        );
                    })}
                </div>

                <div className='flex items-center gap-3 mt-auto'>
                    <div className='flex-1 h-2 rounded-xl bg-slate-200 overflow-hidden shadow-inner'>
                        <div
                            className={`h-2 rounded-xl ${progressColor} transition-all duration-500`}
                            style={{ width: `${Math.min(avgPercent, 100)}%` }}
                        ></div>
                    </div>
                    <span
                        className={`text-xs ${statusColor} rounded-xl px-3 py-1 font-bold tracking-tight shadow border border-slate-100 bg-white`}
                    >
                        {avgPercent.toFixed(1)}%
                    </span>
                </div>

                {isManager && (
                    <div className='flex justify-end gap-2 mt-2'>
                        <Button
                            variant='ghost'
                            size='icon-sm'
                            onClick={() => setEditDialogOpen(true)}
                            className='text-blue-500 hover:text-blue-700 hover:bg-blue-50'
                            title='تعديل'
                        >
                            <Pencil className='h-4 w-4' />
                        </Button>
                        <Button
                            variant='ghost'
                            size='icon-sm'
                            onClick={() => setDeleteDialogOpen(true)}
                            className='text-red-500 hover:text-red-700 hover:bg-red-50'
                            title='حذف'
                        >
                            <Trash2 className='h-4 w-4' />
                        </Button>
                    </div>
                )}
            </Card>

            <EditOperationalGoal
                goal={goal}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                onSuccess={onUpdate}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className='font-cairo'>
                    <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                        <AlertDialogDescription>
                            هل أنت متأكد من حذف الهدف التشغيلي؟ هذا الإجراء لا يمكن التراجع عنه.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className='bg-red-500 hover:bg-red-600 text-white'
                        >
                            {isDeleting ? 'جاري الحذف...' : 'حذف'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Calculation Method Dialog */}
            {(goal as any).calculationMethod && (goal as any).calculationMethod.trim() && (
                <AlertDialog open={calculationMethodDialogOpen} onOpenChange={setCalculationMethodDialogOpen}>
                    <AlertDialogContent className='font-cairo max-w-2xl'>
                        <AlertDialogHeader>
                            <AlertDialogTitle className='flex items-center gap-2'>
                                <Info className='h-5 w-5' />
                                طريقة حساب المؤشر
                            </AlertDialogTitle>
                        </AlertDialogHeader>
                        <AlertDialogDescription className='text-gray-800 text-md whitespace-pre-line'>
                            {(goal as any).calculationMethod}
                        </AlertDialogDescription>
                        <AlertDialogFooter>
                            <AlertDialogCancel>إغلاق</AlertDialogCancel>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            {/* Toast Notification */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </>
    );
}
