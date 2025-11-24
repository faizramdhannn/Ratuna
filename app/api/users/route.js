import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/googleSheets';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Unauthorized. Hanya Super Admin yang dapat mengakses' },
        { status: 403 }
      );
    }

    const users = await getSheetData('Users');
    
    // Remove password from response
    const safeUsers = users.map(user => ({
      user_id: user.user_id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
      _rowIndex: user._rowIndex
    }));

    return NextResponse.json({
      success: true,
      data: safeUsers
    });

  } catch (error) {
    console.error('Error getting users:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data users' },
      { status: 500 }
    );
  }
}