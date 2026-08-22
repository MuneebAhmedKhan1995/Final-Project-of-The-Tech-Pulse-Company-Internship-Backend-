import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'customer'],
    default: 'user',
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  streetAddress: {
    type: String,
    trim: true,
    default: '',
  },
  city: {
    type: String,
    trim: true,
    default: '',
  },
  province: {
    type: String,
    trim: true,
    default: '',
  },
  postalCode: {
    type: String,
    trim: true,
    default: '',
  },
  country: {
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true,
});

// ✅ FIX 1: Remove async and use regular function with next
userSchema.pre('save', function(next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }
  
  const user = this;
  
  // Use callbacks instead of async/await for better Mongoose compatibility
  bcrypt.genSalt(10, function(err, salt) {
    if (err) {
      return next(err);
    }
    
    bcrypt.hash(user.password, salt, function(err, hash) {
      if (err) {
        return next(err);
      }
      user.password = hash;
      next();
    });
  });
});

// ✅ FIX 2: Use regular function for comparePassword
userSchema.methods.comparePassword = function(candidatePassword) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
      if (err) return reject(err);
      resolve(isMatch);
    });
  });
};

const User = mongoose.model('User', userSchema);
export default User;