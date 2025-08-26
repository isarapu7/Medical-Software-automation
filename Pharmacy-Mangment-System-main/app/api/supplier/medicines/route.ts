// File: app/api/supplier/medicines/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Medicine from '@/models/Medicine';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    await connectDB();
    
    // Find all medicines where the supplier is the current user
    const medicines = await Medicine.find({ supplier: session.user.id });
    
    return NextResponse.json(medicines);
  } catch (error) {
    console.error('GET medicines error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    console.log("Session Data:", session); // Debugging

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: "Unauthorized: Missing supplier ID" }, { status: 401 });
    }

    const data = await req.json();
    console.log("Received Data:", data); // Debugging

    // Validate required fields (added expiryDate)
    const requiredFields = [
      "name",
      "description",
      "price",
      "stock",
      "manufacturer",
      "category",
      "expiryDate"
    ];
    for (const field of requiredFields) {
      if (!data[field] && data[field] !== 0) {
        return NextResponse.json(
          { message: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate expiryDate format
    const expiryDate = new Date(data.expiryDate);
    if (isNaN(expiryDate.getTime())) {
      return NextResponse.json(
        { message: "Invalid expiry date format" },
        { status: 400 }
      );
    }

    await connectDB();

    // Create a new medicine with the supplier ID
    const medicine = await Medicine.create({
      ...data,
      expiryDate: expiryDate, // Ensure proper Date object
      supplier: session.user.id, // ✅ Ensure supplier is set
      updatedAt: new Date(),
    });

    console.log("Medicine Created:", medicine); // Debugging

    return NextResponse.json(medicine, { status: 201 });
  } catch (error) {
    console.error("POST medicine error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}