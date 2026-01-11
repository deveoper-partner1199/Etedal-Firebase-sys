'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getUserProfile } from '@/lib/firebase/auth';
import OperationalGoalsList from './OperationalGoalsList';
import AddOperationalGoal from './AddOperationalGoal';

export default function OperationalPage() {
    const [isManager, setIsManager] = useState(false);
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

    if (isCheckingPermissions) {
        return (
            <div className='flex items-center justify-center p-12'>
                <div className='text-gray-500'>جاري التحميل...</div>
            </div>
        );
    }

    return (
        <div className='space-y-6 min-h-screen bg-[#f8faf9] p-8'>
            <Card className='shadow-[0_4px_20px_rgba(0,0,0,0.08)]'>
                <CardContent className='p-6'>
                    <header className='py-2 flex justify-between items-center mb-6'>
                        <h2 className='text-dark-green font-bold text-2xl'>الأهداف التشغيلية</h2>
                        {isManager && <AddOperationalGoal />}
                    </header>
                    <OperationalGoalsList />
                </CardContent>
            </Card>
        </div>
    );
}

