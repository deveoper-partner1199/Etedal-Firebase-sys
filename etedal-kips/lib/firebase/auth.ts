import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './config';
import { encryptUserProfile, decryptUserProfile } from './secure-local-storage';

export interface UserProfile {
    uid: string;
    email: string;
    department?: string;
    name?: string;
    role?: string;
    departmentIds?: string[];
}

export interface LoginCredentials {
    email: string;
    password: string;
}

/**
 * Authenticate user by checking email and password in Firestore
 */
export async function loginUser(credentials: LoginCredentials): Promise<UserProfile> {
    const { email, password } = credentials;

    if (!email || !password) {
        throw new Error('يرجى إدخال البريد وكلمة المرور');
    }

    if (!db) {
        throw new Error('Firebase not initialized');
    }

    const emailLower = email.toLowerCase().trim();

    // Query Firestore for user with matching email
    const q = query(collection(db, 'users'), where('email', '==', emailLower));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        throw new Error('لا يوجد مستخدم بهذا البريد الإلكتروني');
    }

    // Find user with matching password
    let userData: UserProfile | null = null;

    snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.password === password) {
            userData = {
                uid: doc.id,
                email: data.email,
                department: data.department || '',
                name: data.name || '',
                role: data.role || '',
                departmentIds: data.departmentIds || [],
            };
        }
    });

    if (!userData) {
        throw new Error('كلمة المرور غير صحيحة');
    }

    return userData;
}

/**
 * Save user profile to secure HTTP cookie via API
 * The profile is encrypted using secure-ls before sending to server
 */
export async function saveUserProfile(profile: UserProfile, rememberMe: boolean = false): Promise<void> {
    try {
        // Encrypt user profile using secure-ls
        const encryptedToken = encryptUserProfile(profile);

        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                encryptedToken,
                rememberMe,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to save user profile');
        }
    } catch (error) {
        console.error('Error saving user profile:', error);
        throw error;
    }
}

/**
 * Get user profile from secure HTTP cookie via API
 * The encrypted token is decrypted using secure-ls on the client side
 */
export async function getUserProfile(): Promise<UserProfile | null> {
    try {
        const response = await fetch('/api/auth/user', {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        if (!data.encryptedToken) {
            return null;
        }

        // Decrypt the token using secure-ls
        const decrypted = decryptUserProfile(data.encryptedToken);

        if (!decrypted) {
            return null;
        }

        return {
            uid: decrypted.uid,
            email: decrypted.email,
            department: decrypted.department,
            name: decrypted.name,
            role: decrypted.role,
            departmentIds: decrypted.departmentIds,
        };
    } catch (error) {
        console.error('Error getting user profile:', error);
        return null;
    }
}

/**
 * Clear user profile from secure HTTP cookie via API
 */
export async function clearUserProfile(): Promise<void> {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
        });
    } catch (error) {
        console.error('Error clearing user profile:', error);
    }
}
