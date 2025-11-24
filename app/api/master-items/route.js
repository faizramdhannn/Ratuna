import { NextResponse } from 'next/server';
import { getSheetData, appendSheetData, updateSheetData, deleteSheetRow } from '../../../lib/googleSheets.js';
import { getCurrentUser } from '../../../lib/auth.js';

export async function GET() {
  try {
    const items = await getSheetData('Master Item');
    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error('Error getting master items:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data master items', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Check permission
    const currentUser = await getCurrentUser();
    if (!currentUser || !['superadmin', 'admin'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Hanya Admin dan Super Admin yang dapat menambah master item' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { item_name, hpp, operasional, worker, marketing, hpj, net_sales } = body;

    if (!item_name || !hpp || !hpj) {
      return NextResponse.json(
        { error: 'item_name, hpp, dan hpj harus diisi' },
        { status: 400 }
      );
    }

    const itemData = [
      item_name,
      hpp || 0,
      operasional || 0,
      worker || 0,
      marketing || 0,
      hpj || 0,
      net_sales || 0
    ];

    await appendSheetData('Master Item', itemData);

    // Auto-create stock entry with 0 quantity
    const stockData = [item_name, 0, new Date().toISOString()];
    try {
      await appendSheetData('Stock', stockData);
    } catch (stockError) {
      console.warn('Could not create stock entry:', stockError);
    }

    return NextResponse.json({
      success: true,
      message: 'Master item berhasil ditambahkan',
      data: { item_name, hpp, operasional, worker, marketing, hpj, net_sales }
    });

  } catch (error) {
    console.error('Error creating master item:', error);
    return NextResponse.json(
      { error: 'Gagal menambahkan master item', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    // Check permission
    const currentUser = await getCurrentUser();
    if (!currentUser || !['superadmin', 'admin'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Hanya Admin dan Super Admin yang dapat mengupdate master item' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { item_name, hpp, operasional, worker, marketing, hpj, net_sales, rowIndex } = body;

    if (!rowIndex) {
      return NextResponse.json(
        { error: 'rowIndex harus disertakan' },
        { status: 400 }
      );
    }

    const itemData = [
      item_name,
      hpp || 0,
      operasional || 0,
      worker || 0,
      marketing || 0,
      hpj || 0,
      net_sales || 0
    ];

    await updateSheetData('Master Item', rowIndex, itemData);

    return NextResponse.json({
      success: true,
      message: 'Master item berhasil diupdate',
      data: { item_name, hpp, operasional, worker, marketing, hpj, net_sales }
    });

  } catch (error) {
    console.error('Error updating master item:', error);
    return NextResponse.json(
      { error: 'Gagal mengupdate master item', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    // Check permission
    const currentUser = await getCurrentUser();
    if (!currentUser || !['superadmin', 'admin'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Hanya Admin dan Super Admin yang dapat menghapus master item' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const rowIndex = searchParams.get('rowIndex');

    if (!rowIndex) {
      return NextResponse.json(
        { error: 'rowIndex harus disertakan' },
        { status: 400 }
      );
    }

    await deleteSheetRow('Master Item', parseInt(rowIndex));

    return NextResponse.json({
      success: true,
      message: 'Master item berhasil dihapus'
    });

  } catch (error) {
    console.error('Error deleting master item:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus master item', details: error.message },
      { status: 500 }
    );
  }
}