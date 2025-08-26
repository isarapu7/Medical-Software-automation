import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Medicine from '@/models/Medicine';
import Prescription from '@/models/Prescription';
import mongoose from 'mongoose';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const orders = await Order.find({ customer: session.user.id })
      .populate('items.medicine', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    await connectDB();

    // Start a transaction
    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();

    try {
      // Check stock availability and update stock
      for (const item of data.items) {
        const medicine = await Medicine.findById(item.medicine).session(mongoSession);
        if (!medicine) {
          throw new Error(`Medicine ${item.medicine} not found`);
        }
        if (medicine.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${medicine.name}`);
        }
        
        // Update stock immediately for both delivery and collect
        medicine.stock -= item.quantity;
        await medicine.save({ session: mongoSession });
      }

      // Create the order
      const order = new Order({
        ...data,
        customer: session.user.id,
        status: data.deliveryMethod === 'collect' ? 'completed' : 'pending',
      });

      await order.save({ session: mongoSession });

      // If there's a prescription associated with the order, mark it as completed
      if (data.prescription) {
        await Prescription.findByIdAndUpdate(
          data.prescription,
          { status: 'completed' },
          { session: mongoSession }
        );
      }

      // Commit the transaction
      await mongoSession.commitTransaction();
      mongoSession.endSession();

      // Populate the medicine names for the response
      const populatedOrder = await Order.findById(order._id)
        .populate('items.medicine', 'name');

      return NextResponse.json(populatedOrder);
    } catch (error) {
      // If anything fails, abort the transaction
      await mongoSession.abortTransaction();
      mongoSession.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}