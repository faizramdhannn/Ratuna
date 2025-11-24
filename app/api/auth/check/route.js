import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        userId: user.userId,
        username: user.username,
        fullName: user.fullName,
        role: user.role
      }
    });

  } catch (error) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('auth-token');
    
    return NextResponse.json({
      success: true,
      message: 'Logout berhasil'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat logout' },
      { status: 500 }
    );
  }
}