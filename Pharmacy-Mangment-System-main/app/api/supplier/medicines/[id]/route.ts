// File: app/api/supplier/medicines/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Medicine from '@/models/Medicine';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    const data = await req.json();
    
    await connectDB();
    
    // Find the medicine and verify ownership
    const medicine = await Medicine.findById(id);
    
    if (!medicine) {
      return NextResponse.json({ message: 'Medicine not found' }, { status: 404 });
    }
    
    // Check if the current user is the supplier of this medicine
    if (medicine.supplier.toString() !== session.user.id) {
      return NextResponse.json({ message: 'Unauthorized access to this medicine' }, { status: 403 });
    }
    
    // Update fields if provided in the request
    if (data.stock !== undefined) {
      if (typeof data.stock !== 'number' || data.stock < 0) {
        return NextResponse.json(
          { message: 'Stock must be a non-negative number' },
          { status: 400 }
        );
      }
      medicine.stock = data.stock;
    }

    if (data.expiryDate !== undefined) {
      const expiryDate = new Date(data.expiryDate);
      if (isNaN(expiryDate.getTime())) {
        return NextResponse.json(
          { message: 'Invalid expiry date format' },
          { status: 400 }
        );
      }
      medicine.expiryDate = expiryDate;
    }

    medicine.updatedAt = new Date();
    await medicine.save();
    
    return NextResponse.json(medicine);
  } catch (error) {
    console.error('PATCH medicine error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    
    await connectDB();
    
    // Find the medicine and verify ownership
    const medicine = await Medicine.findById(id);
    
    if (!medicine) {
      return NextResponse.json({ message: 'Medicine not found' }, { status: 404 });
    }
    
    // Check if the current user is the supplier of this medicine
    if (medicine.supplier.toString() !== session.user.id) {
      return NextResponse.json({ message: 'Unauthorized access to this medicine' }, { status: 403 });
    }
    
    // Delete the medicine
    await Medicine.findByIdAndDelete(id);
    
    return NextResponse.json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    console.error('DELETE medicine error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}