import { Button } from '@/components/ui/button';
import { Pill } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-100 to-purple-100">
      <div className="text-center">
        <div className="flex justify-center mb-8">
          <Pill className="h-20 w-20 text-blue-500" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Pharmacy Management System</h1>
        <p className="text-lg text-gray-600 mb-8">
          Streamline your pharmacy operations with our comprehensive management solution
        </p>
        <Link href="/login">
          <Button size="lg" className="text-lg px-8">
            Get Started
          </Button>
        </Link>
      </div>
    </div>
  );
}