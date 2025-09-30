const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  birthdate: {
    type: Date,
    required: true
  },
  bio: {
    type: String,
    default: 'Автор пока не добавил информацию о себе.'
  },
  avatarColor: {
    type: String,
    default: '#3498db'
  },
  popularity: {
    type: Number,
    default: 0
  },
  totalReaders: {
    type: Number,
    default: 0
  },
  registrationDate: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

module.exports = mongoose.model('User', userSchema);
