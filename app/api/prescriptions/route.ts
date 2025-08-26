import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Prescription from "@/models/Prescription";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Define the expected shape of the request body
interface PrescriptionRequestBody {
  patientId: string;
  medicines: Array<{
    medicineId: string;
    dosage: string;
    duration: string;
  }>;
  notes?: string;
  validUntil: string; // Assuming this is a date string
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    
    // Type assertion for session.user
    const user = session?.user as { id: string; role: string } | undefined;
    
    if (!session || !user || user.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json() as PrescriptionRequestBody;
    
    // Format medicines array
    const formattedMedicines = data.medicines.map(med => ({
      medicine: med.medicineId,
      dosage: med.dosage,
      duration: med.duration
    }));
    
    // Create new prescription
    const newPrescription = await Prescription.create({
      patient: data.patientId,
      doctor: user.id,
      medicines: formattedMedicines,
      notes: data.notes || '',
      validUntil: new Date(data.validUntil),
      status: 'active'
    });
    
    // Populate the newly created prescription
    const populatedPrescription = await Prescription.findById(newPrescription._id)
      .populate('patient', 'name')
      .populate('medicines.medicine', 'name')
      .lean();
      
    return NextResponse.json(populatedPrescription);
  } catch (error) {
    console.error('Error creating prescription:', error);
    return NextResponse.json({ error: 'Failed to create prescription' }, { status: 500 });
  }
}