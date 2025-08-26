import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [{
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
  }],
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled'],
    default: 'pending',
  },
  deliveryMethod: {
    type: String,
    enum: ['delivery', 'collect'],
    required: true,
  },
  address: {
    type: String,
    required: function(this: { deliveryMethod: string }) {
      return this.deliveryMethod === 'delivery';
    },
  },
  phone: {
    type: String,
    required: true,
  },
  prescription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Delete the model if it exists to ensure schema changes are applied
if (mongoose.models.Order) {
  delete mongoose.models.Order;
}

export default mongoose.model('Order', orderSchema);