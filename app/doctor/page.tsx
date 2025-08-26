"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

interface Prescription {
  _id: string;
  patient: {
    _id: string;
    name: string;
  };
  medicines: {
    medicine: {
      _id: string;
      name: string;
    };
    dosage: string;
    duration: string;
  }[];
  notes: string;
  createdAt: string;
  status: string;
  validUntil: string;
}

interface Medicine {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  requiresPrescription: boolean;
}

interface Customer {
  _id: string;
  name: string;
  email: string;
}

const prescriptionFormSchema = z.object({
  patientId: z.string({ required_error: "Please select a patient" }),
  medicines: z.array(
    z.object({
      medicineId: z.string({ required_error: "Please select a medicine" }),
      dosage: z.string().min(1, { message: "Dosage is required" }),
      duration: z.string().min(1, { message: "Duration is required" }),
    })
  ).min(1, { message: "At least one medicine is required" }),
  notes: z.string().optional(),
  validUntil: z.string().min(1, { message: "Valid until date is required" }),
});

export default function DoctorDashboard() {
  const { data: session } = useSession();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [patients, setPatients] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof prescriptionFormSchema>>({
    resolver: zodResolver(prescriptionFormSchema),
    defaultValues: {
      medicines: [{ medicineId: "", dosage: "", duration: "" }],
      notes: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const prescriptionsRes = await fetch("/api/doctor/prescriptions");
        if (!prescriptionsRes.ok) throw new Error("Failed to fetch prescriptions");
        const prescriptionsData = await prescriptionsRes.json();
        
        const medicinesRes = await fetch("/api/medicines");
        if (!medicinesRes.ok) throw new Error("Failed to fetch medicines");
        const medicinesData = await medicinesRes.json();

        const patientsRes = await fetch("/api/patients");
        if (!patientsRes.ok) throw new Error("Failed to fetch patients");
        const patientsData = await patientsRes.json();

        setPrescriptions(prescriptionsData);
        setMedicines(medicinesData);
        setPatients(patientsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const onSubmit = async (data: z.infer<typeof prescriptionFormSchema>) => {
    try {
      const response = await fetch("/api/prescriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          doctorId: session?.user?.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create prescription");
      }

      const newPrescription = await response.json();

      setPrescriptions([newPrescription, ...prescriptions]);
      
      setIsDialogOpen(false);
      form.reset();
      
      toast({
        title: "Success",
        description: "Prescription created successfully",
        variant: "default",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create prescription",
        variant: "destructive",
      });
    }
  };

  const addMedicine = () => {
    const currentMedicines = form.getValues("medicines");
    form.setValue("medicines", [
      ...currentMedicines,
      { medicineId: "", dosage: "", duration: "" },
    ]);
  };

  const removeMedicine = (index: number) => {
    const currentMedicines = form.getValues("medicines");
    if (currentMedicines.length > 1) {
      form.setValue(
        "medicines",
        currentMedicines.filter((_, i) => i !== index)
      );
    }
  };

  const viewPrescriptionDetails = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
  };

  if (loading) {
    return <div className="p-8">Loading prescriptions...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Doctor Dashboard</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>New Prescription</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create New Prescription</DialogTitle>
              <DialogDescription>
                Prescribe medicines for your patient. Fill out all required fields.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="patientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patient</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a patient" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {patients.map(patient => (
                            <SelectItem key={patient._id} value={patient._id}>
                              {patient.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <FormLabel>Medicines</FormLabel>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={addMedicine}
                    >
                      Add Medicine
                    </Button>
                  </div>
                  
                  {form.watch("medicines").map((_, index) => (
                    <div key={index} className="flex gap-4 items-end">
                      <div className="flex-1">
                        <FormField
                          control={form.control}
                          name={`medicines.${index}.medicineId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="sr-only">Medicine</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a medicine" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {medicines.map(medicine => (
                                    <SelectItem key={medicine._id} value={medicine._id}>
                                      {medicine.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="w-1/4">
                        <FormField
                          control={form.control}
                          name={`medicines.${index}.dosage`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="sr-only">Dosage</FormLabel>
                              <FormControl>
                                <Input placeholder="Dosage" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="w-1/4">
                        <FormField
                          control={form.control}
                          name={`medicines.${index}.duration`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="sr-only">Duration</FormLabel>
                              <FormControl>
                                <Input placeholder="Duration" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeMedicine(index)}
                        disabled={form.watch("medicines").length <= 1}
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Additional instructions or notes" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="validUntil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid Until</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit">Create Prescription</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">Active Prescriptions</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <div className="grid gap-4">
            {prescriptions.length > 0 ? (
              prescriptions
                .filter((p) => p.status === "active")
                .map((prescription) => (
                  <Card key={prescription._id}>
                    <CardHeader>
                      <CardTitle>Patient: {prescription.patient.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(prescription.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Valid Until: {new Date(prescription.validUntil).toLocaleDateString()}
                      </p>
                      <p className="text-sm mt-2">
                        Medicines: {prescription.medicines.length}
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => viewPrescriptionDetails(prescription)}
                      >
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))
            ) : (
              <p>No active prescriptions found.</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="completed">
          <div className="grid gap-4">
            {prescriptions.length > 0 ? (
              prescriptions
                .filter((p) => p.status === "completed")
                .map((prescription) => (
                  <Card key={prescription._id}>
                    <CardHeader>
                      <CardTitle>Patient: {prescription.patient.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(prescription.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Valid Until: {new Date(prescription.validUntil).toLocaleDateString()}
                      </p>
                      <p className="text-sm mt-2">
                        Medicines: {prescription.medicines.length}
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => viewPrescriptionDetails(prescription)}
                      >
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))
            ) : (
              <p>No completed prescriptions found.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {selectedPrescription && (
        <Dialog open={!!selectedPrescription} onOpenChange={() => setSelectedPrescription(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Prescription Details</DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="font-medium">Patient</h3>
                <p>{selectedPrescription.patient.name}</p>
              </div>
              <div>
                <h3 className="font-medium">Prescribed Medicines</h3>
                <ul className="mt-2 space-y-2">
                  {selectedPrescription.medicines.map((med, index) => (
                    <li key={index} className="p-2 bg-slate-50 rounded-md">
                      <p className="font-medium">{med.medicine.name}</p>
                      <p className="text-sm">Dosage: {med.dosage}</p>
                      <p className="text-sm">Duration: {med.duration}</p>
                    </li>
                  ))}
                </ul>
              </div>
              {selectedPrescription.notes && (
                <div>
                  <h3 className="font-medium">Notes</h3>
                  <p className="whitespace-pre-wrap">{selectedPrescription.notes}</p>
                </div>
              )}
              <div className="flex justify-between text-sm text-muted-foreground">
                <p>Created: {new Date(selectedPrescription.createdAt).toLocaleDateString()}</p>
                <p>Valid Until: {new Date(selectedPrescription.validUntil).toLocaleDateString()}</p>
              </div>
              <div className="flex justify-between">
                <p className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                  Status: {selectedPrescription.status}
                </p>
                {selectedPrescription.status === "active" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/prescriptions/${selectedPrescription._id}`, {
                          method: "PATCH",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({ status: "completed" }),
                        });
                        
                        if (!response.ok) throw new Error("Failed to update prescription");
                        
                        setPrescriptions(prescriptions.map(p => 
                          p._id === selectedPrescription._id 
                            ? { ...p, status: "completed" } 
                            : p
                        ));
                        
                        setSelectedPrescription(null);
                        
                        toast({
                          title: "Success",
                          description: "Prescription marked as completed",
                          variant: "default",
                        });
                      } catch (err) {
                        toast({
                          title: "Error",
                          description: err instanceof Error ? err.message : "Failed to update prescription",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    Mark as Completed
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}