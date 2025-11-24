import { NextResponse } from 'next/server';
import { appendSheetData, findUserByUsername } from '@/lib/googleSheets';
import { hashPassword } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    const { username, password, full_name } = await request.json();

    if (!username || !password || !full_name) {
      return NextResponse.json(
        { error: 'Semua field harus diisi' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await findUserByUsername(username);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Username sudah digunakan' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);
    
    const userId = `USR-${uuidv4().slice(0, 8).toUpperCase()}`;
    const createdAt = new Date().toISOString();

    // Default role is worker, status pending
    const userData = [
      userId,
      username,
      hashedPassword,
      full_name,
      'worker', // default role
      'pending', // status: pending, approved, rejected
      createdAt
    ];

    await appendSheetData('Users', userData);

    return NextResponse.json({
      success: true,
      message: 'Registrasi berhasil! Menunggu approval dari Super Admin',
      data: {
        user_id: userId,
        username,
        full_name,
        role: 'worker',
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat registrasi' },
      { status: 500 }
    );
  }
}