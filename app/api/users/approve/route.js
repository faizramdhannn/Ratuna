import { NextResponse } from 'next/server';
import { updateSheetData } from '@/lib/googleSheets';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Unauthorized. Hanya Super Admin yang dapat approve user' },
        { status: 403 }
      );
    }

    const { user_id, username, full_name, role, status, rowIndex } = await request.json();

    if (!rowIndex || !status || !role) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    // Get current user data to preserve password
    const { getSheetData } = await import('@/lib/googleSheets');
    const users = await getSheetData('Users');
    const user = users.find(u => u._rowIndex === rowIndex);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    const userData = [
      user_id,
      username,
      user.password, // preserve password
      full_name,
      role,
      status,
      user.created_at
    ];

    await updateSheetData('Users', rowIndex, userData);

    return NextResponse.json({
      success: true,
      message: `User ${status === 'approved' ? 'disetujui' : 'ditolak'} dengan role ${role}`
    });

  } catch (error) {
    console.error('Error approving user:', error);
    return NextResponse.json(
      { error: 'Gagal memproses approval' },
      { status: 500 }
    );
  }
}