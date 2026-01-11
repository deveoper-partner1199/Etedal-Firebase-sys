'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    departmentIds?: string[];
    departmentId?: string;
    password?: string;
    createdAt?: any;
    updatedAt?: any;
}

export function useUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!db) {
            setError(new Error('Firebase not initialized'));
            setLoading(false);
            return;
        }

        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('name', 'asc'));

        const unsubscribe = onSnapshot(
            q,
            (snapshot: QuerySnapshot<DocumentData>) => {
                const usersData: User[] = [];
                snapshot.forEach((doc) => {
                    usersData.push({
                        id: doc.id,
                        ...doc.data(),
                    } as User);
                });
                setUsers(usersData);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error('Error fetching users:', err);
                setError(err as Error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    return { users, loading, error };
}

