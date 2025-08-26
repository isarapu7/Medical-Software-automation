import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; 
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Medicine from '@/models/Medicine';
import Order from '@/models/Order';
import Prescription from '@/models/Prescription';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    console.log("API received session:", session);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get basic stats
    const [totalUsers, totalMedicines, totalOrders, totalPrescriptions] = await Promise.all([
      User.countDocuments().catch(err => {
        console.error('Error counting users:', err);
        throw new Error('Failed to count users');
      }),
      Medicine.countDocuments().catch(err => {
        console.error('Error counting medicines:', err);
        throw new Error('Failed to count medicines');
      }),
      Order.countDocuments().catch(err => {
        console.error('Error counting orders:', err);
        throw new Error('Failed to count orders');
      }),
      Prescription.countDocuments().catch(err => {
        console.error('Error counting prescriptions:', err);
        throw new Error('Failed to count prescriptions');
      }),
    ]);

    // Get monthly sales data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const orders = await Order.find({ createdAt: { $gte: sixMonthsAgo } })
      .sort({ createdAt: 1 })
      .catch(err => {
        console.error('Error fetching orders:', err);
        throw new Error('Failed to fetch orders');
      });

    const monthlySales = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.toLocaleString('default', { month: 'short' });
      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate.getMonth() === date.getMonth() && orderDate.getFullYear() === date.getFullYear();
      });
      const sales = monthOrders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);
      return { month, sales };
    }).reverse();

    // Get medicine categories distribution
    const medicines = await Medicine.find().catch(err => {
      console.error('Error fetching medicines:', err);
      throw new Error('Failed to fetch medicines');
    });

    const categoryCounts = medicines.reduce((acc, medicine) => {
      if (medicine.category) {
        acc[medicine.category] = (acc[medicine.category] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const medicineCategories = Object.entries(categoryCounts).map(([name, value]) => ({
      name,
      value,
    }));

    return NextResponse.json({
      totalUsers,
      totalMedicines,
      totalOrders,
      totalPrescriptions,
      monthlySales,
      medicineCategories,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}