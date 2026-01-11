'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface Department {
    id: string;
    name: string;
    createdAt?: any;
    updatedAt?: any;
}

export function useDepartments() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!db) {
            setError(new Error('Firebase not initialized'));
            setLoading(false);
            return;
        }

        const departmentsRef = collection(db, 'departments');
        const q = query(departmentsRef, orderBy('name', 'asc'));

        const unsubscribe = onSnapshot(
            q,
            (snapshot: QuerySnapshot<DocumentData>) => {
                const departmentsData: Department[] = [];
                snapshot.forEach((doc) => {
                    departmentsData.push({
                        id: doc.id,
                        ...doc.data(),
                    } as Department);
                });
                setDepartments(departmentsData);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error('Error fetching departments:', err);
                setError(err as Error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    return { departments, loading, error };
}

