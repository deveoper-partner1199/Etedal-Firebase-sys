'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface WeekProgress {
    week: number;
    achieved: number;
}

export interface PeriodProgress {
    year: string;
    quarter: string;
    target: number;
    achieved?: number;
    weeklyTotalAchieved?: number;
    weeks?: WeekProgress[];
    achievedTypeId?: string;
    achievedType?: string;
}

export interface OperationalGoal {
    id: string;
    goal: string;
    strategicGoalId?: string;
    strategicGoalText?: string;
    indicator?: string;
    departmentId?: string;
    trackingMethod?: 'weekly' | 'direct';
    isReverse?: boolean;
    progress?: PeriodProgress[];
    icon?: string;
    weight?: number;
    excludeFromCalculation?: boolean;
    createdAt?: any;
    updatedAt?: any;
}

export function useOperationalGoals() {
    const [goals, setGoals] = useState<OperationalGoal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!db) {
            setError(new Error('Firebase not initialized'));
            setLoading(false);
            return;
        }

        const goalsRef = collection(db, 'operationalGoals');
        const q = query(goalsRef, orderBy('goal', 'asc'));

        const unsubscribe = onSnapshot(
            q,
            (snapshot: QuerySnapshot<DocumentData>) => {
                const goalsData: OperationalGoal[] = [];
                snapshot.forEach((doc) => {
                    goalsData.push({
                        id: doc.id,
                        ...doc.data(),
                    } as OperationalGoal);
                });
                setGoals(goalsData);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error('Error fetching operational goals:', err);
                setError(err as Error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    return { goals, loading, error };
}

