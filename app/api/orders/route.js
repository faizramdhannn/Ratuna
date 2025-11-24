import { NextResponse } from 'next/server';
import { appendSheetData, updateStock, getSheetData } from '../../../lib/googleSheets.js';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const orders = await getSheetData('Order');
    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error getting orders:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data orders' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { item_name, quantity_item, total_amount, cashier_name } = body;

    if (!item_name || !quantity_item || !total_amount || !cashier_name) {
      return NextResponse.json(
        { error: 'Semua field harus diisi' },
        { status: 400 }
      );
    }

    const order_id = `ORD-${uuidv4().slice(0, 8).toUpperCase()}`;
    const created_at = new Date().toISOString();

    try {
      await updateStock(item_name, -parseInt(quantity_item));
    } catch (stockError) {
      return NextResponse.json(
        { error: stockError.message },
        { status: 400 }
      );
    }

    const orderData = [
      order_id,
      created_at,
      item_name,
      quantity_item,
      total_amount,
      cashier_name
    ];

    await appendSheetData('Order', orderData);

    return NextResponse.json({
      success: true,
      message: 'Order berhasil dibuat dan stock telah dikurangi',
      data: {
        order_id,
        created_at,
        item_name,
        quantity_item,
        total_amount,
        cashier_name
      }
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Gagal membuat order', details: error.message },
      { status: 500 }
    );
  }
}