const express = require('express');
const router = express.Router();
const multiplexRoutes = require('./multiplex');
const { Multiplex } = require('../models');

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Book a seat route
router.post('/book-seat', async (req, res) => {
  try {
    const { seatNo, nameOfBooker } = req.body;

    // Input validation
    if (!seatNo || !nameOfBooker) {
      return res.status(400).json({ error: 'Both seatNo and nameOfBooker are required' });
    }

    // Validate seatNo is a valid number
    const seatNumber = parseInt(seatNo);
    if (isNaN(seatNumber) || seatNumber <= 0) {
      return res.status(400).json({ error: 'seatNo must be a positive number' });
    }

    if (typeof nameOfBooker !== 'string') {
      return res.status(400).json({ error: 'nameOfBooker must be a string' });
    }

    if (nameOfBooker.trim().length === 0) {
      return res.status(400).json({ error: 'nameOfBooker cannot be empty' });
    }

    // Find and book the seat in a transaction to prevent race conditions
    const result = await Multiplex.sequelize.transaction(async (t) => {
      // Find the seat with a lock to prevent concurrent bookings
      const seat = await Multiplex.findOne({
        where: {
          seatNo: seatNumber,  // Using the parsed integer
          isBooked: false
        },
        lock: true,
        transaction: t
      });

      if (!seat) {
        // Check if seat exists at all to provide better error message
        const seatExists = await Multiplex.findOne({
          where: { seatNo: seatNumber },
          transaction: t
        });

        if (seatExists) {
          throw new Error('SEAT_ALREADY_BOOKED');
        } else {
          throw new Error('SEAT_NOT_FOUND');
        }
      }

      // Book the seat
      await seat.update({
        isBooked: true,
        bookedBy: nameOfBooker.trim()
      }, { transaction: t });

      return seat;
    });

    return res.status(200).json({
      message: 'Seat booked successfully',
      seat: result
    });

  } catch (error) {
    console.error('Error booking seat:', error);

    if (error.message === 'SEAT_ALREADY_BOOKED') {
      return res.status(400).json({ error: 'Seat is already booked' });
    }
    
    if (error.message === 'SEAT_NOT_FOUND') {
      return res.status(404).json({ error: 'Seat not found' });
    }

    return res.status(500).json({ error: 'Failed to book seat' });
  }
});

// Add multiplex routes
router.use('/multiplex', multiplexRoutes);

module.exports = router; 