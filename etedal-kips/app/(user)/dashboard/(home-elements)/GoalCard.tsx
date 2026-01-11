'use client';

import { useState, useEffect } from 'react';
import { StrategicGoal } from '@/hooks/use-strategic-goals';
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
import EditGoal from './EditGoal';
import { doc, deleteDoc, query, where, getDocs, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getUserProfile } from '@/lib/firebase/auth';
import { Pencil, Trash2 } from 'lucide-react';

interface GoalCardProps {
    goal: StrategicGoal;
    onUpdate?: () => void;
}

export default function GoalCard({ goal, onUpdate }: GoalCardProps) {
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isManager, setIsManager] = useState(false);
    const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);

    const yearsDisplay = Array.isArray(goal.years) ? goal.years.join('، ') : '';
    const goalIdShort = goal.id.substring(0, 5);

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

    const handleDelete = async () => {
        if (!db) {
            alert('Firebase غير مهيأ');
            return;
        }

        setIsDeleting(true);
        try {
            // Check if goal is linked to operational goals
            const operationalGoalsRef = collection(db, 'operationalGoals');
            const q = query(operationalGoalsRef, where('strategicGoalId', '==', goal.id));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                alert('لا يمكن حذف الهدف لأنه مرتبط بأهداف تشغيلية');
                setIsDeleting(false);
                setDeleteDialogOpen(false);
                return;
            }

            // Delete the strategic goal
            const goalRef = doc(db, 'strategicGoals', goal.id);
            await deleteDoc(goalRef);
            setDeleteDialogOpen(false);
            onUpdate?.();
        } catch (error) {
            console.error('Error deleting strategic goal:', error);
            alert('حدث خطأ أثناء حذف الهدف');
        } finally {
            setIsDeleting(false);
        }
    };

    if (isCheckingPermissions) {
        return (
            <Card className='group flex flex-col gap-4 p-6 border border-transparent hover:border-dark-green duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:-translate-y-1 overflow-hidden relative'>
                <div className='absolute top-0 start-0 w-1 h-full bg-dark-green duration-300 group-hover:w-1.5'></div>
                <div className='flex items-center gap-2 text-xs mb-1'>
                    {yearsDisplay && (
                        <span className='bg-[#eafbf5] text-dark-green rounded-full px-3 py-1 font-bold'>
                            {yearsDisplay}
                        </span>
                    )}
                    <span className='ml-auto text-slate-400'>#{goalIdShort}</span>
                </div>
                <div className='text-lg font-bold text-[#2e3d34] leading-relaxed flex-1'>{goal.goal}</div>
            </Card>
        );
    }

    return (
        <>
            <Card className='group flex flex-col gap-4 p-6 border border-transparent hover:border-dark-green duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:-translate-y-1 overflow-hidden relative'>
                <div className='absolute top-0 start-0 w-1 h-full bg-dark-green duration-300 group-hover:w-1.5'></div>
                <div className='flex items-center gap-2 text-xs mb-1'>
                    {yearsDisplay && (
                        <span className='bg-[#eafbf5] text-dark-green rounded-full px-3 py-1 font-bold'>
                            {yearsDisplay}
                        </span>
                    )}
                    <span className='ml-auto text-slate-400'>#{goalIdShort}</span>
                </div>
                <div className='text-lg font-bold text-[#2e3d34] leading-relaxed flex-1'>{goal.goal}</div>
                {isManager && (
                    <div className='flex justify-end gap-2 mt-auto'>
                        <Button
                            variant='ghost'
                            size='icon-sm'
                            onClick={() => setEditDialogOpen(true)}
                            className='text-blue-500 hover:text-blue-700 bg-blue-50 cursor-pointer'
                            title='تعديل'
                        >
                            <Pencil className='h-4 w-4' />
                        </Button>
                        <Button
                            variant='ghost'
                            size='icon-sm'
                            onClick={() => setDeleteDialogOpen(true)}
                            className='text-red-500 hover:text-red-700 bg-red-50 cursor-pointer'
                            title='حذف'
                        >
                            <Trash2 className='h-4 w-4' />
                        </Button>
                    </div>
                )}
            </Card>

            <EditGoal goal={goal} open={editDialogOpen} onOpenChange={setEditDialogOpen} onSuccess={onUpdate} />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className='font-cairo'>
                    <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                        <AlertDialogDescription>
                            هل أنت متأكد من حذف الهدف الاستراتيجي؟ هذا الإجراء لا يمكن التراجع عنه.
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
        </>
    );
}
