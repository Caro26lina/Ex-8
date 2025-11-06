const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide an entry title'],
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  mediaUrl: {
    type: String,
    required: true
  },
  competition: {
    type: mongoose.Schema.ObjectId,
    ref: 'Competition',
    required: true
  },
  contestant: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  votes: [{
    voter: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],
  totalVotes: {
    type: Number,
    default: 0
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

// Update total votes when votes array changes
entrySchema.pre('save', function(next) {
  this.totalVotes = this.votes.length;
  next();
});

module.exports = mongoose.model('Entry', entrySchema);