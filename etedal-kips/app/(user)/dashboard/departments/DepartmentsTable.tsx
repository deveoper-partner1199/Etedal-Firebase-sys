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
import { useDepartments, Department } from '@/hooks/use-departments';
import { getUserProfile } from '@/lib/firebase/auth';
import { doc, deleteDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Pencil, Trash2 } from 'lucide-react';
import EditDepartment from './EditDepartment';

export default function DepartmentsTable() {
    const { departments, loading, error } = useDepartments();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isManager, setIsManager] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [departmentToEdit, setDepartmentToEdit] = useState<Department | null>(null);
    const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);

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

    const handleDeleteClick = (department: Department) => {
        setDepartmentToDelete(department);
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!departmentToDelete || !db) {
            return;
        }

        setIsDeleting(true);
        try {
            // Check if department is used in operational goals
            const opGoalsRef = collection(db, 'operationalGoals');
            const opGoalsQuery = query(opGoalsRef, where('departmentId', '==', departmentToDelete.id), limit(1));
            const opGoalsSnapshot = await getDocs(opGoalsQuery);

            if (!opGoalsSnapshot.empty) {
                alert('لا يمكن حذف الإدارة لأنها مرتبطة بأهداف تشغيلية');
                setIsDeleting(false);
                setDeleteDialogOpen(false);
                return;
            }

            // Check if department is used in users (new departmentIds array field)
            const usersRef = collection(db, 'users');
            const usersQuery = query(
                usersRef,
                where('departmentIds', 'array-contains', departmentToDelete.id),
                limit(1)
            );
            const usersSnapshot = await getDocs(usersQuery);

            if (!usersSnapshot.empty) {
                alert('لا يمكن حذف الإدارة لأنها مرتبطة بمستخدمين');
                setIsDeleting(false);
                setDeleteDialogOpen(false);
                return;
            }

            // Also check for old departmentId field
            const usersQueryOld = query(usersRef, where('departmentId', '==', departmentToDelete.id), limit(1));
            const usersSnapshotOld = await getDocs(usersQueryOld);
            if (!usersSnapshotOld.empty) {
                alert('لا يمكن حذف الإدارة لأنها مرتبطة بمستخدمين');
                setIsDeleting(false);
                setDeleteDialogOpen(false);
                return;
            }

            const departmentRef = doc(db, 'departments', departmentToDelete.id);
            await deleteDoc(departmentRef);
            setDeleteDialogOpen(false);
            setDepartmentToDelete(null);
        } catch (error) {
            console.error('Error deleting department:', error);
            alert('حدث خطأ أثناء حذف الإدارة');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEditClick = (department: Department) => {
        setDepartmentToEdit(department);
        setEditDialogOpen(true);
    };

    const columns = useMemo<ColumnDef<Department>[]>(
        () => [
            {
                accessorKey: 'name',
                header: 'اسم الإدارة',
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
        data: departments,
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
                <div className='text-red-500'>حدث خطأ أثناء تحميل الإدارات: {error.message}</div>
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
                                    لا توجد إدارات
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
                            هل أنت متأكد من حذف الإدارة: {departmentToDelete?.name}؟ هذا الإجراء لا يمكن التراجع عنه.
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

            {/* Edit Department Dialog */}
            {departmentToEdit && (
                <EditDepartment
                    department={departmentToEdit}
                    open={editDialogOpen}
                    onOpenChange={(open) => {
                        setEditDialogOpen(open);
                        if (!open) {
                            setDepartmentToEdit(null);
                        }
                    }}
                />
            )}
        </>
    );
}
