import { NextResponse } from 'next/server';
import { findUserByUsername } from '@/lib/googleSheets';
import { verifyPassword, createToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username dan password harus diisi' },
        { status: 400 }
      );
    }

    // Check for superadmin hardcoded
    if (username === 'Ratuna' && password === 'ratuna123') {
      const token = createToken({
        user_id: 'superadmin',
        username: 'Ratuna',
        full_name: 'Super Admin',
        role: 'superadmin'
      });

      const cookieStore = await cookies();
      cookieStore.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 // 24 hours
      });

      return NextResponse.json({
        success: true,
        message: 'Login berhasil',
        user: {
          username: 'Ratuna',
          full_name: 'Super Admin',
          role: 'superadmin'
        }
      });
    }

    // Check from database
    const user = await findUserByUsername(username);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      );
    }

    // Check if user is approved
    if (user.status !== 'approved') {
      return NextResponse.json(
        { error: 'Akun Anda belum disetujui oleh Super Admin' },
        { status: 403 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      );
    }

    // Create token
    const token = createToken({
      user_id: user.user_id,
      username: user.username,
      full_name: user.full_name,
      role: user.role
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24
    });

    return NextResponse.json({
      success: true,
      message: 'Login berhasil',
      user: {
        username: user.username,
        full_name: user.full_name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat login' },
      { status: 500 }
    );
  }
}