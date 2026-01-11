'use client';

import { useStrategicGoals } from '@/hooks/use-strategic-goals';
import GoalCard from './GoalCard';
import { Card } from '@/components/ui/card';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from '@/components/ui/empty';

function GoalCardSkeleton() {
    return (
        <Card className='group flex flex-col gap-4 p-6 shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden relative animate-pulse'>
            <div className='absolute top-0 start-0 w-1 h-full bg-gray-200/50 group-hover:w-1.5 transition-all duration-300'></div>
            <div className='flex items-center gap-2 text-xs mb-1'>
                <span className='bg-gray-200/50 rounded-full px-6 py-2 h-6 w-24 inline-block' />
                <span className='ml-auto bg-gray-200/50 rounded w-12 h-4 inline-block' />
            </div>
            <div className='flex-1 flex flex-col justify-center'>
                <div className='bg-gray-200/50 h-7 w-3/4 rounded mb-2'></div>
                <div className='bg-gray-200/50 h-7 w-2/5 rounded'></div>
            </div>
            <div className='flex justify-end gap-2 mt-auto'>
                {/* No buttons, just space */}
                <span className='block w-12 h-6 bg-gray-200/50 rounded'></span>
            </div>
        </Card>
    );
}

export default function Goals() {
    const { goals, loading, error } = useStrategicGoals();

    if (loading) {
        // Show 3 skeleton cards
        return (
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                {[...Array(3)].map((_, idx) => (
                    <GoalCardSkeleton key={idx} />
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

    if (!goals.length) {
        return (
            <Empty>
                <EmptyMedia variant='icon'>
                    <svg
                        xmlns='http://www.w3.org/2000/svg'
                        width='24'
                        height='24'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                    >
                        <path d='M12 2v20M2 12h20' />
                    </svg>
                </EmptyMedia>
                <EmptyHeader>
                    <EmptyTitle>لا توجد أهداف استراتيجية بعد</EmptyTitle>
                    <EmptyDescription>
                        لم تقم بإضافة أي أهداف استراتيجية حتى الآن. يمكنك البدء بإضافة هدف جديد.
                    </EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    return (
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {goals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
            ))}
        </div>
    );
}
