import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch medicines with stock > 0 and not expired
    const currentDate = new Date();
    const medicines = await Medicine.find({
      stock: { $gt: 0 },
      expiryDate: { $gt: currentDate }
    })
      .select('_id name description price stock category requiresPrescription expiryDate')
      .lean();
      
    return NextResponse.json(medicines);
  } catch (error) {
    console.error('Error fetching medicines:', error);
    return NextResponse.json({ error: 'Failed to fetch medicines' }, { status: 500 });
  }
}