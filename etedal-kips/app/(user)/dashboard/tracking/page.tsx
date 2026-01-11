'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import TrackingTable from './TrackingTable';
import GoalDetailsDialog from './GoalDetailsDialog';
import { OperationalGoal } from '@/hooks/use-operational-goals';

export default function TrackingPage() {
    const [selectedGoal, setSelectedGoal] = useState<OperationalGoal | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleGoalClick = (goal: OperationalGoal) => {
        setSelectedGoal(goal);
        setDialogOpen(true);
    };

    const handleDialogClose = (open: boolean) => {
        setDialogOpen(open);
        if (!open) {
            setSelectedGoal(null);
        }
    };

    return (
        <div className='space-y-6 min-h-screen bg-[#f8faf9] p-8'>
            <Card className='shadow-[0_4px_20px_rgba(0,0,0,0.08)]'>
                <CardContent className='p-6'>
                    <header className='py-2 mb-6'>
                        <h2 className='text-dark-green font-bold text-2xl'>متابعة الإنجاز</h2>
                    </header>
                    <TrackingTable onGoalClick={handleGoalClick} />
                </CardContent>
            </Card>

            <GoalDetailsDialog
                goal={selectedGoal}
                open={dialogOpen}
                onOpenChange={handleDialogClose}
                onSuccess={() => {
                    // Refresh data if needed
                }}
            />
        </div>
    );
}

