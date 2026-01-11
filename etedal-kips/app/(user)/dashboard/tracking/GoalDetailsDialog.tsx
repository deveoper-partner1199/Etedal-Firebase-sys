'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Save } from 'lucide-react';
import { OperationalGoal, PeriodProgress, WeekProgress } from '@/hooks/use-operational-goals';
import { useDepartments } from '@/hooks/use-departments';
import { useAchievementValueTypes } from '@/hooks/use-achievement-value-types';
import { getUserProfile } from '@/lib/firebase/auth';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Toast } from '@/components/ui/toast';

interface GoalDetailsDialogProps {
    goal: OperationalGoal | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export default function GoalDetailsDialog({ goal, open, onOpenChange, onSuccess }: GoalDetailsDialogProps) {
    const { departments } = useDepartments();
    const { achievementValueTypes } = useAchievementValueTypes();
    const [isEditable, setIsEditable] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set());
    const [editedProgress, setEditedProgress] = useState<PeriodProgress[]>([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

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
            if (!goal) return;
            try {
                const userProfile = await getUserProfile();
                const isManager = userProfile?.role === 'manager' || userProfile?.role === 'مدير';
                const userDepts = userProfile?.departmentIds || [];
                setIsEditable(isManager || userDepts.includes(goal.departmentId || ''));
            } catch (error) {
                console.error('Error checking permissions:', error);
                setIsEditable(false);
            }
        };
        checkPermissions();
    }, [goal]);

    useEffect(() => {
        if (goal && goal.progress) {
            setEditedProgress(JSON.parse(JSON.stringify(goal.progress)));
            setHasChanges(false);
        }
    }, [goal]);

    const calculateAchievementPercent = (period: PeriodProgress, isReverse: boolean = false): number => {
        if (!goal) return 0;
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

    const getStatusColor = (percent: number, isReverse: boolean = false): string => {
        if (isReverse) percent = 100 - percent;
        if (percent < 50) return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800';
        if (percent >= 50 && percent <= 60) return 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800';
        if (percent > 60 && percent <= 79) return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800';
        return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800';
    };

    const getWeekOffset = (quarter: string): number => {
        switch (quarter) {
            case 'Q1':
                return 0;
            case 'Q2':
                return 13;
            case 'Q3':
                return 26;
            case 'Q4':
                return 39;
            default:
                return 0;
        }
    };

    const togglePeriod = (periodKey: string) => {
        setExpandedPeriods((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(periodKey)) {
                newSet.delete(periodKey);
            } else {
                newSet.add(periodKey);
            }
            return newSet;
        });
    };

    const handleWeeklyChange = (year: string, quarter: string, week: number, value: number) => {
        setEditedProgress((prev) => {
            const updated = prev.map((period) => {
                if (period.year === year && period.quarter === quarter) {
                    const updatedWeeks = (period.weeks || []).map((w) =>
                        w.week === week ? { ...w, achieved: value } : w
                    );
                    const weeklyTotal = updatedWeeks.reduce((sum, w) => sum + (w.achieved || 0), 0);
                    return {
                        ...period,
                        weeks: updatedWeeks,
                        weeklyTotalAchieved: weeklyTotal,
                    };
                }
                return period;
            });
            setHasChanges(true);
            return updated;
        });
    };

    const handleDirectChange = (year: string, quarter: string, value: number) => {
        setEditedProgress((prev) => {
            const updated = prev.map((period) => {
                if (period.year === year && period.quarter === quarter) {
                    return { ...period, achieved: value };
                }
                return period;
            });
            setHasChanges(true);
            return updated;
        });
    };

    const handleSave = async () => {
        if (!goal || !db || !isEditable) return;

        setIsSaving(true);
        try {
            const userProfile = await getUserProfile();
            const changes: any[] = [];

            editedProgress.forEach((period) => {
                const originalPeriod = goal.progress?.find(
                    (p) => p.year === period.year && p.quarter === period.quarter
                );

                if (goal.trackingMethod === 'weekly') {
                    const newTotal = period.weeklyTotalAchieved || 0;
                    const oldTotal = originalPeriod?.weeklyTotalAchieved || 0;
                    if (newTotal !== oldTotal) {
                        changes.push({
                            userId: userProfile?.uid || '',
                            year: period.year,
                            quarter: period.quarter,
                            oldValue: oldTotal,
                            newValue: newTotal,
                            note: 'Weekly total updated',
                            changedAt: new Date(),
                        });
                    }
                } else {
                    const newValue = period.achieved || 0;
                    const oldValue = originalPeriod?.achieved || 0;
                    if (newValue !== oldValue) {
                        changes.push({
                            userId: userProfile?.uid || '',
                            year: period.year,
                            quarter: period.quarter,
                            oldValue: oldValue,
                            newValue: newValue,
                            note: 'Direct value updated',
                            changedAt: new Date(),
                        });
                    }
                }
            });

            const goalRef = doc(db, 'operationalGoals', goal.id);
            await updateDoc(goalRef, {
                progress: editedProgress,
                updatedAt: new Date(),
                history: arrayUnion(...changes),
            });

            showToast('تم حفظ التغييرات بنجاح', 'success');
            setHasChanges(false);
            onSuccess?.();
            // Close the modal after successful save
            setTimeout(() => {
                onOpenChange(false);
            }, 500); // Small delay to show the success toast
        } catch (error) {
            console.error('Error saving achievements:', error);
            showToast('حدث خطأ أثناء حفظ التغييرات', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (!goal) return null;

    const periods = editedProgress.sort((a, b) => (a.year + a.quarter).localeCompare(b.year + b.quarter));
    const avgPercent =
        periods.length > 0
            ? periods.reduce((sum, p) => sum + calculateAchievementPercent(p, goal.isReverse || false), 0) /
              periods.length
            : 0;
    const overallStatusColor = getStatusColor(avgPercent, goal.isReverse || false);
    const trackingMethod = goal.trackingMethod || 'weekly';
    const reverseText = goal.isReverse ? '↪️ ' : '';

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className='font-cairo w-full lg:min-w-4xl max-w-6xl max-h-[90vh]  overflow-y-auto'>
                    <DialogHeader>
                        <DialogTitle className='text-start text-dark-green text-xl font-bold flex items-center gap-3'>
                            <i className={`fa-solid ${goal.icon || 'fa-tasks'}`}></i>
                            <span>{reverseText}</span>
                            <span>{goal.goal}</span>
                        </DialogTitle>
                    </DialogHeader>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
                        <div>
                            <p className='text-gray-600 text-sm'>الهدف الاستراتيجي:</p>
                            <p className='font-medium text-gray-800'>{goal.strategicGoalText || 'غير محدد'}</p>
                        </div>
                        <div>
                            <p className='text-gray-600 text-sm'>الإدارة:</p>
                            <p className='font-medium text-gray-800'>
                                {goal.departmentId ? departmentsMap[goal.departmentId] : 'غير محدد'}
                            </p>
                        </div>
                        <div>
                            <p className='text-gray-600 text-sm'>المؤشر:</p>
                            <p className='font-medium text-gray-800'>{goal.indicator || 'غير محدد'}</p>
                        </div>
                        <div>
                            <p className='text-gray-600 text-sm'>حالة الإنجاز:</p>
                            <p className={`font-medium ${overallStatusColor} rounded-full px-3 py-1 inline-block`}>
                                ({avgPercent.toFixed(1)}%)
                            </p>
                        </div>
                    </div>

                    <h4 className='font-bold text-lg mb-3 text-[#03866d] border-b pb-2'>تفاصيل الإنجاز لكل فترة:</h4>

                    <div className='space-y-2 max-h-96 overflow-y-auto'>
                        {periods.length > 0 ? (
                            periods.map((period) => {
                                const periodKey = `${period.year}-${period.quarter}`;
                                const isExpanded = expandedPeriods.has(periodKey);
                                const periodPercent = calculateAchievementPercent(period, goal.isReverse || false);
                                const periodStatusColor = getStatusColor(periodPercent, goal.isReverse || false);
                                const typeName =
                                    achievementValueTypesMap[period.achievedTypeId || ''] || period.achievedType || '';

                                if (trackingMethod === 'weekly') {
                                    const weeklyData =
                                        period.weeks && period.weeks.length > 0
                                            ? period.weeks
                                            : Array.from({ length: 13 }, (_, i) => ({ week: i + 1, achieved: 0 }));
                                    const weekOffset = getWeekOffset(period.quarter);
                                    const achievedValue =
                                        period.weeklyTotalAchieved !== undefined
                                            ? period.weeklyTotalAchieved
                                            : period.achieved || 0;

                                    return (
                                        <div
                                            key={periodKey}
                                            className='border-b last:border-b-0 border-gray-200'
                                            data-year={period.year}
                                            data-quarter={period.quarter}
                                        >
                                            <div
                                                className='flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50'
                                                onClick={() => togglePeriod(periodKey)}
                                            >
                                                <div className='flex-1 grid grid-cols-4 gap-4'>
                                                    <div className='font-medium flex items-center justify-between'>
                                                        <span>
                                                            {period.year} - الربع {period.quarter.replace('Q', '')}
                                                        </span>
                                                        <i
                                                            className={`fa-solid fa-chevron-down text-xs text-gray-400 ml-2 transition-transform duration-300 ${
                                                                isExpanded ? 'rotate-180' : ''
                                                            }`}
                                                        ></i>
                                                    </div>
                                                    <div>
                                                        {period.target}
                                                        <div className='text-xs text-gray-500'>{typeName}</div>
                                                    </div>
                                                    <div>
                                                        <Input
                                                            type='text'
                                                            value={achievedValue}
                                                            readOnly
                                                            className='bg-gray-100 cursor-not-allowed'
                                                        />
                                                        <div className='text-xs text-gray-500'>من الأسابيع</div>
                                                    </div>
                                                    <div>
                                                        <span className={`${periodStatusColor} rounded-full px-3 py-1`}>
                                                            {periodPercent.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {isExpanded && (
                                                <div className='bg-gray-50 p-4 border-t border-dashed'>
                                                    <h5 className='font-bold text-sm mb-3 text-gray-600'>
                                                        تفاصيل الإنجاز الأسبوعي:
                                                    </h5>
                                                    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-3'>
                                                        {weeklyData.map((week) => (
                                                            <div key={week.week} className='flex flex-col'>
                                                                <label className='text-xs mb-1 text-gray-500 font-medium'>
                                                                    الأسبوع {week.week + weekOffset}
                                                                </label>
                                                                <Input
                                                                    type='number'
                                                                    value={week.achieved || 0}
                                                                    min={0}
                                                                    disabled={!isEditable}
                                                                    onChange={(e) =>
                                                                        handleWeeklyChange(
                                                                            period.year,
                                                                            period.quarter,
                                                                            week.week,
                                                                            parseFloat(e.target.value) || 0
                                                                        )
                                                                    }
                                                                    className='text-sm p-2'
                                                                />
                                                                {isEditable && (
                                                                    <div className='text-xs text-gray-500 mt-1'>
                                                                        القيمة الحالية: {week.achieved || 0}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                } else {
                                    const achievedValue = period.achieved || 0;
                                    return (
                                        <div
                                            key={periodKey}
                                            className='border-b last:border-b-0 border-gray-200 p-4'
                                            data-year={period.year}
                                            data-quarter={period.quarter}
                                        >
                                            <div className='flex items-center justify-between'>
                                                <div className='flex-1 grid grid-cols-4 gap-4'>
                                                    <div className='font-medium'>
                                                        {period.year} - الربع {period.quarter.replace('Q', '')}
                                                    </div>
                                                    <div>
                                                        {period.target}
                                                        <div className='text-xs text-gray-500'>{typeName}</div>
                                                    </div>
                                                    <div>
                                                        <Input
                                                            type='number'
                                                            value={achievedValue}
                                                            disabled={!isEditable}
                                                            onChange={(e) =>
                                                                handleDirectChange(
                                                                    period.year,
                                                                    period.quarter,
                                                                    parseFloat(e.target.value) || 0
                                                                )
                                                            }
                                                            className='w-full'
                                                        />
                                                        {isEditable && (
                                                            <div className='text-xs text-gray-500 mt-1'>
                                                                القيمة الحالية: {achievedValue}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <span className={`${periodStatusColor} rounded-full px-3 py-1`}>
                                                            {periodPercent.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                            })
                        ) : (
                            <div className='text-center py-6 text-gray-400 bg-gray-50 rounded-lg'>
                                لا توجد فترات زمنية محددة
                            </div>
                        )}
                    </div>

                    {isEditable && (
                        <DialogFooter className='mt-6'>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving || !hasChanges}
                                className='bg-[linear-gradient(to_right,var(--login-main-green),var(--login-dark-green))] text-white hover:brightness-110'
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                        جاري الحفظ...
                                    </>
                                ) : (
                                    <>
                                        <Save className='mr-2 h-4 w-4' />
                                        حفظ التغييرات
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>

            {/* Toast Notification */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </>
    );
}
