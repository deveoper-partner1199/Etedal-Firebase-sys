import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const authToken = cookieStore.get('auth_token');

        if (!authToken || !authToken.value) {
            return NextResponse.json({ encryptedToken: null }, { status: 200 });
        }

        // Return the encrypted token to the client
        // The client will decrypt it using secure-ls
        return NextResponse.json({ encryptedToken: authToken.value });
    } catch (error) {
        console.error('Get user API error:', error);
        return NextResponse.json({ error: 'Failed to get user profile' }, { status: 500 });
    }
}

