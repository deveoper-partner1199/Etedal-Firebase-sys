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
import { useUsers } from '@/hooks/use-users';
import { useDepartments } from '@/hooks/use-departments';
import { getUserProfile } from '@/lib/firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Pencil, Trash2 } from 'lucide-react';
import { User } from '@/hooks/use-users';
import EditUser from './EditUser';

export default function UsersTable() {
    const { users, loading, error } = useUsers();
    const { departments } = useDepartments();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isManager, setIsManager] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);

    // Create departments map
    const departmentsMap = useMemo(() => {
        const map: Record<string, string> = {};
        departments.forEach((dept) => {
            map[dept.id] = dept.name;
        });
        return map;
    }, [departments]);

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

    const handleDeleteClick = (user: User) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!userToDelete || !db) {
            return;
        }

        setIsDeleting(true);
        try {
            const userProfile = await getUserProfile();
            if (userToDelete.email === userProfile?.email) {
                alert('لا يمكنك حذف حسابك الخاص');
                setIsDeleting(false);
                setDeleteDialogOpen(false);
                return;
            }

            const userRef = doc(db, 'users', userToDelete.id);
            await deleteDoc(userRef);
            setDeleteDialogOpen(false);
            setUserToDelete(null);
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('حدث خطأ أثناء حذف المستخدم');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEditClick = (user: User) => {
        setUserToEdit(user);
        setEditDialogOpen(true);
    };

    const getDepartmentNames = (user: User): string => {
        let userDeptIds = user.departmentIds;
        if (!Array.isArray(userDeptIds) && user.departmentId) {
            userDeptIds = [user.departmentId];
        }
        const deptNames = (userDeptIds || [])
            .map((id) => departmentsMap[id])
            .filter(Boolean)
            .join('، ');
        return deptNames || 'غير محدد';
    };

    const columns = useMemo<ColumnDef<User>[]>(
        () => [
            {
                accessorKey: 'name',
                header: 'الاسم',
                cell: ({ row }) => <div className='font-bold'>{row.original.name || ''}</div>,
            },
            {
                id: 'departments',
                header: 'الإدارات',
                cell: ({ row }) => <div className='text-wrap'>{getDepartmentNames(row.original)}</div>,
            },
            {
                accessorKey: 'email',
                header: 'البريد الإلكتروني',
                cell: ({ row }) => <div className='text-wrap'>{row.original.email || ''}</div>,
            },
            {
                accessorKey: 'role',
                header: 'الصلاحية',
                cell: ({ row }) => (
                    <div className='text-wrap'>{row.original.role === 'manager' ? 'مدير' : 'مستخدم'}</div>
                ),
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
        [isManager, departmentsMap]
    );

    const table = useReactTable({
        data: users,
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
                <div className='text-red-500'>حدث خطأ أثناء تحميل المستخدمين: {error.message}</div>
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
                                    لا يوجد مستخدمون
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
                            هل أنت متأكد من حذف المستخدم: {userToDelete?.email}؟ هذا الإجراء لا يمكن التراجع عنه.
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

            {/* Edit User Dialog */}
            {userToEdit && (
                <EditUser
                    user={userToEdit}
                    open={editDialogOpen}
                    onOpenChange={(open) => {
                        setEditDialogOpen(open);
                        if (!open) {
                            setUserToEdit(null);
                        }
                    }}
                />
            )}
        </>
    );
}
