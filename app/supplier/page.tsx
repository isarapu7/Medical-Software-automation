"use client";

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Medicine {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  manufacturer: string;
  category: string;
  requiresPrescription: boolean;
  supplier: string;
  expiryDate: string;
  createdAt: string;
  updatedAt: string;
}

export default function SupplierDashboard() {
  const { data: session } = useSession();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [newMedicine, setNewMedicine] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    manufacturer: '',
    category: '',
    requiresPrescription: false,
    expiryDate: '',
  });
  const [updateStock, setUpdateStock] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const categories = ["Antibiotics", "Painkillers", "Vitamins", "Supplements", "Others"];

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/supplier/medicines');
      if (!response.ok) {
        throw new Error('Failed to fetch medicines');
      }
      const data = await response.json();
      setMedicines(data);
    } catch (error) {
      console.error('Error fetching medicines:', error);
      toast({
        title: "Error",
        description: "Failed to load medicines. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      console.log("Sending medicine data:", newMedicine);
      
      const response = await fetch('/api/supplier/medicines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMedicine),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add medicine');
      }

      const result = await response.json();
      console.log("Response from server:", result);

      setIsAddDialogOpen(false);
      setNewMedicine({
        name: '',
        description: '',
        price: 0,
        stock: 0,
        manufacturer: '',
        category: '',
        requiresPrescription: false,
        expiryDate: '',
      });
      
      toast({
        title: "Success",
        description: "Medicine added successfully",
      });
      
      fetchMedicines();
    } catch (error) {
      console.error('Error adding medicine:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add medicine. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMedicine) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/supplier/medicines/${selectedMedicine._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stock: updateStock }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update stock');
      }

      setIsUpdateDialogOpen(false);
      setSelectedMedicine(null);
      setUpdateStock(0);
      
      toast({
        title: "Success",
        description: "Stock updated successfully",
      });
      
      fetchMedicines();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update stock. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMedicine = async () => {
    if (!selectedMedicine) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/supplier/medicines/${selectedMedicine._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete medicine');
      }

      setIsDeleteDialogOpen(false);
      setSelectedMedicine(null);
      
      toast({
        title: "Success",
        description: "Medicine deleted successfully",
      });
      
      fetchMedicines();
    } catch (error) {
      console.error('Error deleting medicine:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete medicine. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openUpdateDialog = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setUpdateStock(medicine.stock);
    setIsUpdateDialogOpen(true);
  };

  const openDeleteDialog = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setIsDeleteDialogOpen(true);
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="mt-2">Please sign in to access the supplier dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Supplier Dashboard</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Medicine
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Add New Medicine</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddMedicine} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Medicine Name*</Label>
                <Input
                  id="name"
                  value={newMedicine.name}
                  onChange={(e) => setNewMedicine({...newMedicine, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description*</Label>
                <Textarea
                  id="description"
                  value={newMedicine.description}
                  onChange={(e) => setNewMedicine({...newMedicine, description: e.target.value})}
                  required
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer*</Label>
                  <Input
                    id="manufacturer"
                    value={newMedicine.manufacturer}
                    onChange={(e) => setNewMedicine({...newMedicine, manufacturer: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category*</Label>
                  <Select
                    value={newMedicine.category}
                    onValueChange={(value) => setNewMedicine({...newMedicine, category: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)*</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={newMedicine.price}
                    onChange={(e) => setNewMedicine({...newMedicine, price: parseFloat(e.target.value)})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stock">Initial Stock*</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={newMedicine.stock}
                    onChange={(e) => setNewMedicine({...newMedicine, stock: parseInt(e.target.value)})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date*</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={newMedicine.expiryDate}
                  onChange={(e) => setNewMedicine({...newMedicine, expiryDate: e.target.value})}
                  required
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requiresPrescription"
                  checked={newMedicine.requiresPrescription}
                  onCheckedChange={(checked) => 
                    setNewMedicine({
                      ...newMedicine, 
                      requiresPrescription: checked === true
                    })
                  }
                />
                <Label htmlFor="requiresPrescription">Requires Prescription</Label>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add Medicine'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Manufacturer</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Prescription</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  Loading medicines...
                </TableCell>
              </TableRow>
            ) : medicines.length > 0 ? (
              medicines.map((medicine: Medicine) => (
                <TableRow 
                  key={medicine._id}
                  className={isExpired(medicine.expiryDate) ? 'text-red-500' : ''}
                >
                  <TableCell className="font-medium">{medicine.name}</TableCell>
                  <TableCell>{medicine.category}</TableCell>
                  <TableCell>{medicine.manufacturer}</TableCell>
                  <TableCell>{medicine.stock}</TableCell>
                  <TableCell>${medicine.price.toFixed(2)}</TableCell>
                  <TableCell>{medicine.requiresPrescription ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    {new Date(medicine.expiryDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openUpdateDialog(medicine)}>
                        Update Stock
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => openDeleteDialog(medicine)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  No medicines available. Add your first medicine!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Update Stock for {selectedMedicine?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateStock} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="updateStock">New Stock Level</Label>
              <Input
                id="updateStock"
                type="number"
                min="0"
                value={updateStock}
                onChange={(e) => setUpdateStock(parseInt(e.target.value))}
                required
              />
            </div>
            {selectedMedicine && (
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <p className={isExpired(selectedMedicine.expiryDate) ? 'text-red-500' : ''}>
                  {new Date(selectedMedicine.expiryDate).toLocaleDateString()}
                  {isExpired(selectedMedicine.expiryDate) && ' (Expired)'}
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Stock'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedMedicine?.name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMedicine}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}