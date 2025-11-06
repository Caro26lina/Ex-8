const mongoose = require('mongoose');

const competitionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a competition title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: ['music', 'art', 'writing', 'photography', 'technology', 'other']
  },
  creator: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  maxEntries: {
    type: Number,
    default: 100
  },
  entryFee: {
    type: Number,
    default: 0
  },
  prizePool: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Competition', competitionSchema);