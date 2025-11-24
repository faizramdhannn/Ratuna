import { NextResponse } from 'next/server';
import { appendSheetData, getSheetData } from '../../../lib/googleSheets.js';
import { getCurrentUser } from '../../../lib/auth.js';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const shoppingList = await getSheetData('Shopping List');
    return NextResponse.json({ success: true, data: shoppingList });
  } catch (error) {
    console.error('Error getting shopping list:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data shopping list' },
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
        { error: 'Unauthorized. Hanya Admin dan Super Admin yang dapat menambah shopping list' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { item_shopping, quantity, price } = body;

    if (!item_shopping || !quantity || !price) {
      return NextResponse.json(
        { error: 'Semua field harus diisi' },
        { status: 400 }
      );
    }

    const shopping_id = `SHOP-${uuidv4().slice(0, 8).toUpperCase()}`;
    const shopping_date = new Date().toISOString();

    const shoppingData = [
      shopping_id,
      shopping_date,
      item_shopping,
      quantity,
      price
    ];

    await appendSheetData('Shopping List', shoppingData);

    return NextResponse.json({
      success: true,
      message: 'Shopping list berhasil ditambahkan',
      data: {
        shopping_id,
        shopping_date,
        item_shopping,
        quantity,
        price
      }
    });

  } catch (error) {
    console.error('Error creating shopping list:', error);
    return NextResponse.json(
      { error: 'Gagal menambahkan shopping list' },
      { status: 500 }
    );
  }
}