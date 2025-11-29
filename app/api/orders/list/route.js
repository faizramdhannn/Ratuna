import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/googleSheets';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    
    const orders = await getSheetData('Order');
    
    if (orderId) {
      // Get specific order details
      const orderItems = orders.filter(o => o.order_id === orderId);
      
      if (orderItems.length === 0) {
        return NextResponse.json(
          { error: 'Order tidak ditemukan' },
          { status: 404 }
        );
      }

      // Calculate totals
      const totalItems = orderItems.reduce((sum, item) => sum + parseInt(item.quantity_item || 0), 0);
      const totalAmount = orderItems.reduce((sum, item) => sum + parseInt(item.total_amount || 0), 0);

      return NextResponse.json({
        success: true,
        data: {
          order_id: orderId,
          created_at: orderItems[0].created_at,
          cashier_name: orderItems[0].cashier_name,
          customer_name: orderItems[0].customer_name || '-',
          payment_method: orderItems[0].payment_method,
          cash_paid: orderItems[0].cash_paid,
          change: orderItems[0].change,
          notes: orderItems[0].notes_order || '',
          items: orderItems.map(item => ({
            item_name: item.item_name,
            quantity: item.quantity_item,
            price: item.total_amount / item.quantity_item,
            subtotal: item.total_amount
          })),
          total_items: totalItems,
          total_amount: totalAmount
        }
      });
    }

    // Group orders by order_id
    const groupedOrders = {};
    orders.forEach(order => {
      if (!groupedOrders[order.order_id]) {
        groupedOrders[order.order_id] = {
          order_id: order.order_id,
          created_at: order.created_at,
          cashier_name: order.cashier_name,
          customer_name: order.customer_name || '-',
          payment_method: order.payment_method,
          notes: order.notes_order || '',
          items: [],
          total_items: 0,
          total_amount: 0
        };
      }
      
      groupedOrders[order.order_id].items.push({
        item_name: order.item_name,
        quantity: parseInt(order.quantity_item || 0)
      });
      groupedOrders[order.order_id].total_items += parseInt(order.quantity_item || 0);
      groupedOrders[order.order_id].total_amount += parseInt(order.total_amount || 0);
    });

    // Convert to array and sort by date (newest first)
    const orderList = Object.values(groupedOrders).sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );

    return NextResponse.json({ 
      success: true, 
      data: orderList 
    });
  } catch (error) {
    console.error('Error getting order list:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data orders', details: error.message },
      { status: 500 }
    );
  }
}