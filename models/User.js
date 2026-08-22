// import mongoose from 'mongoose';
// import bcrypt from 'bcryptjs';

// const userSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//     trim: true,
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     trim: true,
//     lowercase: true,
//   },
//   password: {
//     type: String,
//     required: true,
//   },
//   role: {
//     type: String,
//     enum: ['user', 'admin', 'customer'],
//     default: 'user',
//   },
//   phone: {
//     type: String,
//     trim: true,
//     default: '',
//   },
//   streetAddress: {
//     type: String,
//     trim: true,
//     default: '',
//   },
//   city: {
//     type: String,
//     trim: true,
//     default: '',
//   },
//   province: {
//     type: String,
//     trim: true,
//     default: '',
//   },
//   postalCode: {
//     type: String,
//     trim: true,
//     default: '',
//   },
//   country: {
//     type: String,
//     trim: true,
//     default: '',
//   },
// }, {
//   timestamps: true,
// });

// userSchema.pre('save', function(next) {
//   if (!this.isModified('password')) {
//     return next();
//   }
  
//   const user = this;
  
//   bcrypt.genSalt(10, function(err, salt) {
//     if (err) {
//       return next(err);
//     }
    
//     bcrypt.hash(user.password, salt, function(err, hash) {
//       if (err) {
//         return next(err);
//       }
//       user.password = hash;
//       next();
//     });
//   });
// });

// userSchema.methods.comparePassword = async function(password) {
//   return await bcrypt.compare(password, this.password);
// };

// const User = mongoose.model('User', userSchema);
// export default User;



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

// IMPORTANT: Use function() NOT arrow function
userSchema.pre('save', async function(next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;