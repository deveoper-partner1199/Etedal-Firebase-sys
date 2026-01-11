'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface StrategicGoal {
    id: string;
    goal: string;
    years?: string[];
    createdAt?: any;
    updatedAt?: any;
}

export function useStrategicGoals() {
    const [goals, setGoals] = useState<StrategicGoal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!db) {
            setError(new Error('Firebase not initialized'));
            setLoading(false);
            return;
        }

        const goalsRef = collection(db, 'strategicGoals');
        const q = query(goalsRef, orderBy('goal', 'asc'));

        const unsubscribe = onSnapshot(
            q,
            (snapshot: QuerySnapshot<DocumentData>) => {
                const goalsData: StrategicGoal[] = [];
                snapshot.forEach((doc) => {
                    goalsData.push({
                        id: doc.id,
                        ...doc.data(),
                    } as StrategicGoal);
                });
                setGoals(goalsData);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error('Error fetching strategic goals:', err);
                setError(err as Error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    return { goals, loading, error };
}
