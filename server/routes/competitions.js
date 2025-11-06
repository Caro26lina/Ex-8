const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const Competition = require('../models/Competition');
const Entry = require('../models/Entry');

const router = express.Router();

// @desc    Get all competitions
// @route   GET /api/competitions
// @access  Public
router.get('/', async (req, res) => {
  try {
    const competitions = await Competition.find()
      .populate('creator', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: competitions.length,
      data: competitions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single competition
// @route   GET /api/competitions/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id)
      .populate('creator', 'username');

    if (!competition) {
      return res.status(404).json({
        success: false,
        message: 'Competition not found'
      });
    }

    res.status(200).json({
      success: true,
      data: competition
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create competition
// @route   POST /api/competitions
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    req.body.creator = req.user.id;
    const competition = await Competition.create(req.body);

    res.status(201).json({
      success: true,
      data: competition
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update competition
// @route   PUT /api/competitions/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let competition = await Competition.findById(req.params.id);

    if (!competition) {
      return res.status(404).json({
        success: false,
        message: 'Competition not found'
      });
    }

    // Check ownership
    if (competition.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this competition'
      });
    }

    competition = await Competition.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: competition
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete competition
// @route   DELETE /api/competitions/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id);

    if (!competition) {
      return res.status(404).json({
        success: false,
        message: 'Competition not found'
      });
    }

    // Check ownership or admin role
    if (competition.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this competition'
      });
    }

    await Competition.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Competition deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;