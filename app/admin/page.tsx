'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Users, Pill, ShoppingCart, FileText } from 'lucide-react';
import { StatsCard } from '@/components/admin/StatsCard';
import { SalesChart } from '@/components/admin/SalesChart';
import { CategoryChart } from '@/components/admin/CategoryChart';
import { DataTable } from '@/components/admin/DataTable';
import { AdminStats } from '@/lib/services/adminService';

type DetailType = 'users' | 'medicines' | 'orders' | 'prescriptions' | null;

interface DetailData {
  users: any[];
  medicines: any[];
  orders: any[];
  prescriptions: any[];
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalMedicines: 0,
    totalOrders: 0,
    totalPrescriptions: 0,
    monthlySales: [],
    medicineCategories: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<DetailType>(null);
  const [detailData, setDetailData] = useState<DetailData>({
    users: [],
    medicines: [],
    orders: [],
    prescriptions: [],
  });

  const columns = {
    users: [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role' },
      { key: 'createdAt', label: 'Created At' },
    ],
    medicines: [
      { key: 'name', label: 'Name' },
      { key: 'category', label: 'Category' },
      { key: 'price', label: 'Price' },
      { key: 'stock', label: 'Stock' },
      { key: 'expiryDate', label: 'Expiry Date' },
    ],
    orders: [
      { key: 'customer.name', label: 'Customer' },
      { key: 'totalAmount', label: 'Amount' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Date' },
    ],
    prescriptions: [
      { key: 'patient.name', label: 'Patient' },
      { key: 'doctor.name', label: 'Doctor' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Created At' },
      { key: 'validUntil', label: 'Valid Until' },
    ],
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/stats', {
          credentials: 'include',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `API error: ${response.status}`);
        }
        
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchStats();
    } else if (status === 'authenticated') {
      setError('Unauthorized: Admin access required');
      setLoading(false);
    }
  }, [status, session]);

  const fetchDetailData = async (type: DetailType) => {
    if (!type) return;
    
    try {
      const response = await fetch(`/api/admin/${type}`);
      if (!response.ok) throw new Error(`Failed to fetch ${type}`);
      
      const data = await response.json();
      setDetailData(prev => ({ ...prev, [type]: data }));
    } catch (err) {
      console.error(`Error fetching ${type}:`, err);
    }
  };

  const handleCardClick = async (type: DetailType) => {
    setSelectedDetail(type);
    if (type && !detailData[type].length) {
      await fetchDetailData(type);
    }
  };

  if (status === 'loading') {
    return <div className="p-8">Loading session...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>;
  }

  if (loading) {
    return <div className="p-8">Loading stats...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          onClick={() => handleCardClick('users')}
        />
        <StatsCard
          title="Total Medicines"
          value={stats.totalMedicines}
          icon={Pill}
          onClick={() => handleCardClick('medicines')}
        />
        <StatsCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingCart}
          onClick={() => handleCardClick('orders')}
        />
        <StatsCard
          title="Total Prescriptions"
          value={stats.totalPrescriptions}
          icon={FileText}
          onClick={() => handleCardClick('prescriptions')}
        />
      </div>

      {selectedDetail && (
        <div className="mb-8">
          <DataTable
            columns={columns[selectedDetail]}
            data={detailData[selectedDetail]}
            onClose={() => setSelectedDetail(null)}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SalesChart data={stats.monthlySales} />
        <CategoryChart data={stats.medicineCategories} />
      </div>
    </div>
  );
}