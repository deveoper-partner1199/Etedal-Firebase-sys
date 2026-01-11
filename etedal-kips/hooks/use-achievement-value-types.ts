'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, QuerySnapshot, DocumentData, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface AchievementValueType {
    id: string;
    name: string;
    createdAt?: any;
    updatedAt?: any;
}

export function useAchievementValueTypes() {
    const [achievementValueTypes, setAchievementValueTypes] = useState<AchievementValueType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!db) {
            setError(new Error('Firebase not initialized'));
            setLoading(false);
            return;
        }

        const typesRef = collection(db, 'achievementValueTypes');
        const q = query(typesRef, orderBy('name', 'asc'));

        const unsubscribe = onSnapshot(
            q,
            async (snapshot: QuerySnapshot<DocumentData>) => {
                const typesData: AchievementValueType[] = [];
                snapshot.forEach((doc) => {
                    typesData.push({
                        id: doc.id,
                        ...doc.data(),
                    } as AchievementValueType);
                });
                
                // Initialize default types if none exist (only for managers)
                if (typesData.length === 0 && db) {
                    try {
                        const defaultTypes = ['نسبة مئوية', 'قيمة رقمية'];
                        for (const typeName of defaultTypes) {
                            await addDoc(collection(db, 'achievementValueTypes'), {
                                name: typeName,
                                createdAt: new Date(),
                            });
                        }
                    } catch (err) {
                        console.error('Error initializing default achievement value types:', err);
                    }
                }
                
                setAchievementValueTypes(typesData);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error('Error fetching achievement value types:', err);
                setError(err as Error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    return { achievementValueTypes, loading, error };
}

