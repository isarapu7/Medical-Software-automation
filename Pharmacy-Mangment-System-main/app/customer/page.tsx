"use client";

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Plus, Minus, Trash2, FileText } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getOrderStatusBadgeVariant } from '@/utils/orderHelpers';
interface Order {
  _id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  deliveryMethod: string;
  items: Array<{
    medicine: {
      name: string;
    };
    quantity: number;
    price: number;
  }>;
}

interface Medicine {
  _id: string;
  name: string;
  price: number;
  description: string;
  requiresPrescription: boolean;
  stock: number;
  expiryDate: string;
}

interface Prescription {
  _id: string;
  doctor: {
    name: string;
  };
  medicines: Array<{
    medicine: {
      _id: string;
      name: string;
    };
    dosage: string;
    duration: string;
  }>;
  notes: string;
  status: string;
  validUntil: string;
  createdAt: string;
}

export default function CustomerDashboard() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const { items, addToCart, removeFromCart, updateQuantity, clearCart, total } = useCart();
  const { toast } = useToast();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutDetails, setCheckoutDetails] = useState({
    deliveryMethod: 'delivery',
    address: '',
    phone: '',
    prescription: null as string | null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, medicinesRes, prescriptionsRes] = await Promise.all([
          fetch('/api/customer/orders'),
          fetch('/api/medicines'),
          fetch('/api/customer/prescriptions')
        ]);

        if (!ordersRes.ok || !medicinesRes.ok || !prescriptionsRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const [ordersData, medicinesData, prescriptionsData] = await Promise.all([
          ordersRes.json(),
          medicinesRes.json(),
          prescriptionsRes.json()
        ]);

        setOrders(ordersData);
        const currentDate = new Date();
        const validMedicines = medicinesData.filter((medicine: Medicine) => 
          new Date(medicine.expiryDate) > currentDate && medicine.stock > 0
        );
        setMedicines(validMedicines);
        setPrescriptions(prescriptionsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load data. Please refresh the page.",
          variant: "destructive",
        });
      }
    };

    fetchData();
  }, [toast]);

  const handleAddToCart = (medicine: Medicine) => {
    if (medicine.stock <= 0) {
      toast({
        title: "Out of Stock",
        description: "This medicine is currently unavailable",
        variant: "destructive",
      });
      return;
    }

    addToCart({
      _id: medicine._id,
      name: medicine.name,
      price: medicine.price,
      quantity: 1,
      requiresPrescription: medicine.requiresPrescription,
    });

    toast({
      title: "Added to Cart",
      description: `${medicine.name} has been added to your cart`,
    });
  };

  const handleAddPrescribedToCart = (prescription: Prescription) => {
    if (prescription.status !== 'active') {
      toast({
        title: "Invalid Prescription",
        description: "This prescription is no longer active",
        variant: "destructive",
      });
      return;
    }

    prescription.medicines.forEach(async (med) => {
      const medicine = medicines.find(m => m._id === med.medicine._id);
      if (medicine) {
        addToCart({
          _id: medicine._id,
          name: medicine.name,
          price: medicine.price,
          quantity: 1,
          requiresPrescription: true,
        });
      }
    });

    // Set the prescription ID for checkout
    setCheckoutDetails(prev => ({
      ...prev,
      prescription: prescription._id
    }));

    toast({
      title: "Added to Cart",
      description: "Prescribed medicines have been added to your cart",
    });
  };

  const handleCheckout = async () => {
    if (checkoutDetails.deliveryMethod === 'delivery' && !checkoutDetails.address) {
      toast({
        title: "Missing Information",
        description: "Please provide a delivery address",
        variant: "destructive",
      });
      return;
    }

    if (!checkoutDetails.phone) {
      toast({
        title: "Missing Information",
        description: "Please provide a phone number",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/customer/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            medicine: item._id,
            quantity: item.quantity,
            price: item.price,
          })),
          totalAmount: total,
          deliveryMethod: checkoutDetails.deliveryMethod,
          address: checkoutDetails.address,
          phone: checkoutDetails.phone,
          prescription: checkoutDetails.prescription,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const newOrder = await response.json();
      setOrders([newOrder, ...orders]);
      clearCart();
      setIsCheckoutOpen(false);
      
      // Update prescriptions list if a prescription was used
      if (checkoutDetails.prescription) {
        setPrescriptions(prevPrescriptions =>
          prevPrescriptions.map(p =>
            p._id === checkoutDetails.prescription
              ? { ...p, status: 'completed' }
              : p
          )
        );
      }

      toast({
        title: "Order Placed Successfully",
        description: checkoutDetails.deliveryMethod === 'collect' 
          ? "Your order has been placed. You can collect it from the shop."
          : "Your order has been placed and will be delivered to your address",
      });

      // Reset checkout details
      setCheckoutDetails({
        deliveryMethod: 'delivery',
        address: '',
        phone: '',
        prescription: null,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getOrderStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'processing':
        return 'default';
      case 'completed':
        return 'success';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Customer Dashboard</h1>

      <Tabs defaultValue="prescriptions" className="w-full">
        <TabsList>
          <TabsTrigger value="prescriptions">My Prescriptions</TabsTrigger>
          <TabsTrigger value="shop">Shop Medicines</TabsTrigger>
          <TabsTrigger value="cart">Cart ({items.length})</TabsTrigger>
          <TabsTrigger value="orders">My Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="prescriptions">
          <div className="grid gap-6">
            {prescriptions.length > 0 ? (
              prescriptions.map((prescription) => (
                <Card key={prescription._id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Prescription from Dr. {prescription.doctor.name}</CardTitle>
                        <CardDescription>
                          Issued: {new Date(prescription.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge variant={prescription.status === 'active' ? 'default' : 'secondary'}>
                        {prescription.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Prescribed Medicines:</h4>
                        <ul className="space-y-2">
                          {prescription.medicines.map((med, index) => (
                            <li key={index} className="text-sm">
                              <span className="font-medium">{med.medicine.name}</span>
                              <br />
                              <span className="text-muted-foreground">
                                Dosage: {med.dosage} | Duration: {med.duration}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {prescription.notes && (
                        <div>
                          <h4 className="font-medium mb-1">Notes:</h4>
                          <p className="text-sm text-muted-foreground">{prescription.notes}</p>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">
                          Valid until: {new Date(prescription.validUntil).toLocaleDateString()}
                        </p>
                        {prescription.status === 'active' && (
                          <Button 
                            onClick={() => handleAddPrescribedToCart(prescription)}
                            className="mt-2"
                          >
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Add to Cart
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground">No prescriptions found</p>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="shop">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {medicines.map((medicine) => (
              <Card key={medicine._id}>
                <CardHeader>
                  <CardTitle>{medicine.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {medicine.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <p className="font-bold">${medicine.price.toFixed(2)}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        Stock: {medicine.stock}
                      </p>
                      <Button
                        onClick={() => handleAddToCart(medicine)}
                        disabled={medicine.stock <= 0}
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                  {medicine.requiresPrescription && (
                    <p className="text-sm text-red-500 mt-2">
                      Requires prescription
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cart">
          <div className="space-y-4">
            {items.length > 0 ? (
              <>
                {items.map((item) => (
                  <Card key={item._id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          ${item.price.toFixed(2)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => removeFromCart(item._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <p className="font-bold">Total: ${total.toFixed(2)}</p>
                  <Button onClick={() => setIsCheckoutOpen(true)}>
                    Proceed to Checkout
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-center text-muted-foreground">Your cart is empty</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <div className="grid gap-4">
            {orders.map((order) => (
              <Card key={order._id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Order #{order._id.slice(-6)}</CardTitle>
                    <Badge >
                      {order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Date: {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Method: {order.deliveryMethod === 'collect' ? 'Collect from Shop' : 'Delivery'}
                        </p>
                      </div>
                      <p className="font-bold">
                        Total: ${order.totalAmount.toFixed(2)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium">Items:</p>
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.medicine.name} x {item.quantity}</span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Delivery Method</Label>
              <RadioGroup
                value={checkoutDetails.deliveryMethod}
                onValueChange={(value) => setCheckoutDetails({
                  ...checkoutDetails,
                  deliveryMethod: value
                })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery">Home Delivery</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="collect" id="collect" />
                  <Label htmlFor="collect">Collect from Shop</Label>
                </div>
              </RadioGroup>
            </div>

            {checkoutDetails.deliveryMethod === 'delivery' && (
              <div className="space-y-2">
                <Label htmlFor="address">Delivery Address</Label>
                <Input
                  id="address"
                  value={checkoutDetails.address}
                  onChange={(e) => setCheckoutDetails({
                    ...checkoutDetails,
                    address: e.target.value
                  })}
                  placeholder="Enter your delivery address"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={checkoutDetails.phone}
                onChange={(e) => setCheckoutDetails({
                  ...checkoutDetails,
                  phone: e.target.value
                })}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between mb-2">
                <span>Subtotal:</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCheckout}>
              Place Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}