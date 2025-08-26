import mongoose from 'mongoose';

export type UserRole = 'admin' | 'supplier' | 'customer' | 'doctor';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['customer', 'doctor', 'admin', 'supplier'],
    default: 'customer',
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
if (mongoose.models.User) {
  delete mongoose.models.User;
}

export default mongoose.model('User', userSchema);