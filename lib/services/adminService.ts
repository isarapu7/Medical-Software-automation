import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Medicine from '@/models/Medicine';
import Order from '@/models/Order';
import Prescription from '@/models/Prescription';

export interface AdminStats {
  totalUsers: number;
  totalMedicines: number;
  totalOrders: number;
  totalPrescriptions: number;
  monthlySales: { month: string; sales: number }[];
  medicineCategories: { name: string; value: number }[];
}

export async function getAdminStats(): Promise<AdminStats> {
  await connectDB();

  // Get basic stats using Promise.all for parallel execution
  const [totalUsers, totalMedicines, totalOrders, totalPrescriptions] = await Promise.all([
    User.countDocuments(),
    Medicine.countDocuments(),
    Order.countDocuments(),
    Prescription.countDocuments(),
  ]);

  // Get monthly sales data
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const orders = await Order.find({
    createdAt: { $gte: sixMonthsAgo }
  }).sort({ createdAt: 1 });

  const monthlySales = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const month = date.toLocaleString('default', { month: 'short' });
    const monthOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate.getMonth() === date.getMonth() && 
             orderDate.getFullYear() === date.getFullYear();
    });
    const sales = monthOrders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);
    return { month, sales };
  }).reverse();

  // Get medicine categories distribution
  const medicines = await Medicine.find();
  const categoryCounts = medicines.reduce((acc, medicine) => {
    acc[medicine.category] = (acc[medicine.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const medicineCategories = Object.entries(categoryCounts).map(([name, value]) => ({
    name,
    value,
  }));

  return {
    totalUsers,
    totalMedicines,
    totalOrders,
    totalPrescriptions,
    monthlySales,
    medicineCategories,
  };
}