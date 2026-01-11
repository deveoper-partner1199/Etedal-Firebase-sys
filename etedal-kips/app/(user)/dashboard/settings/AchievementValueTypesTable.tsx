'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    ColumnDef,
    flexRender,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { useAchievementValueTypes, AchievementValueType } from '@/hooks/use-achievement-value-types';
import { getUserProfile } from '@/lib/firebase/auth';
import { doc, deleteDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Pencil, Trash2 } from 'lucide-react';
import { Toast } from '@/components/ui/toast';
import EditAchievementValueType from './EditAchievementValueType';
export default function AchievementValueTypesTable() {
    const { achievementValueTypes, loading, error } = useAchievementValueTypes();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [typeToDelete, setTypeToDelete] = useState<AchievementValueType | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isManager, setIsManager] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [typeToEdit, setTypeToEdit] = useState<AchievementValueType | null>(null);
    const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
        setToast({ message, type });
    };

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

    const handleDeleteClick = (type: AchievementValueType) => {
        setTypeToDelete(type);
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!typeToDelete || !db) {
            return;
        }

        setIsDeleting(true);
        try {
            // Check if type is used in operational goals
            const operationalGoalsRef = collection(db, 'operationalGoals');
            const operationalGoalsSnapshot = await getDocs(operationalGoalsRef);
            
            const goalsInUse = operationalGoalsSnapshot.docs.some((doc) => {
                const goal = doc.data();
                if (goal.progress && Array.isArray(goal.progress)) {
                    return goal.progress.some(
                        (p: any) =>
                            p.achievedTypeId === typeToDelete.id ||
                            (p.achievedType && !p.achievedTypeId && p.achievedType === typeToDelete.name)
                    );
                }
                return false;
            });

            if (goalsInUse) {
                showToast('لا يمكن حذف هذا النوع لأنه مستخدم في هدف تشغيلي واحد على الأقل', 'error');
                setIsDeleting(false);
                setDeleteDialogOpen(false);
                return;
            }

            const typeRef = doc(db, 'achievementValueTypes', typeToDelete.id);
            await deleteDoc(typeRef);
            setDeleteDialogOpen(false);
            setTypeToDelete(null);
            showToast('تم حذف نوع القيمة بنجاح', 'success');
        } catch (error) {
            console.error('Error deleting achievement value type:', error);
            showToast('حدث خطأ أثناء حذف نوع القيمة', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEditClick = (type: AchievementValueType) => {
        setTypeToEdit(type);
        setEditDialogOpen(true);
    };

    const columns = useMemo<ColumnDef<AchievementValueType>[]>(
        () => [
            {
                accessorKey: 'name',
                header: 'اسم النوع',
                cell: ({ row }) => <div className='font-bold'>{row.original.name || ''}</div>,
            },
            {
                id: 'actions',
                header: 'الإجراءات',
                cell: ({ row }) => {
                    if (!isManager) return null;
                    return (
                        <div className='flex items-center gap-2'>
                            <Button
                                variant='ghost'
                                size='icon-sm'
                                onClick={() => handleEditClick(row.original)}
                                className='text-blue-500 hover:text-blue-700 hover:bg-blue-50'
                                title='تعديل'
                            >
                                <Pencil className='h-4 w-4' />
                            </Button>
                            <Button
                                variant='ghost'
                                size='icon-sm'
                                onClick={() => handleDeleteClick(row.original)}
                                className='text-red-500 hover:text-red-700 hover:bg-red-50'
                                title='حذف'
                            >
                                <Trash2 className='h-4 w-4' />
                            </Button>
                        </div>
                    );
                },
            },
        ],
        [isManager]
    );

    const table = useReactTable({
        data: achievementValueTypes,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    if (isCheckingPermissions || loading) {
        return (
            <div className='flex items-center justify-center p-12'>
                <div className='text-gray-500'>جاري التحميل...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className='flex items-center justify-center p-12'>
                <div className='text-red-500'>حدث خطأ أثناء تحميل أنواع القيم: {error.message}</div>
            </div>
        );
    }

    return (
        <>
            <div className='rounded-md shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden bg-white'>
                <Table>
                    <TableHeader className='border-0! [&_tr]:border-0'>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className='border-0'>
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        className='bg-[linear-gradient(to_right,#eafbf5,#d8f7ec)] text-[#03866d] font-bold text-right p-4 border-0'
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody className='border-0'>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && 'selected'}
                                    className='bg-white border-0 hover:bg-[#f9f9f9] transition-colors text-wrap'
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className='p-4 text-wrap'>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className='h-24 text-center text-gray-500 p-6'>
                                    لا توجد أنواع قيم
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className='font-cairo'>
                    <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                        <AlertDialogDescription>
                            هل أنت متأكد من حذف نوع القيمة: {typeToDelete?.name}؟ هذا الإجراء لا يمكن التراجع عنه.
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

            {/* Edit Achievement Value Type Dialog */}
            {typeToEdit && (
                <EditAchievementValueType
                    type={typeToEdit}
                    open={editDialogOpen}
                    onOpenChange={(open) => {
                        setEditDialogOpen(open);
                        if (!open) {
                            setTypeToEdit(null);
                        }
                    }}
                />
            )}

            {/* Toast Notification */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </>
    );
}

