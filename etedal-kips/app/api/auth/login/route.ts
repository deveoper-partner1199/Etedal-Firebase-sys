import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { encryptedToken, rememberMe } = body;

        if (!encryptedToken) {
            return NextResponse.json({ error: 'Invalid encrypted token' }, { status: 400 });
        }

        // Set secure HTTP-only cookie with the encrypted token
        // The token is already encrypted by secure-ls on the client side
        const cookieStore = await cookies();
        const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 1 day

        cookieStore.set('auth_token', encryptedToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge,
            path: '/',
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Login API error:', error);
        return NextResponse.json({ error: 'Failed to set authentication cookie' }, { status: 500 });
    }
}

