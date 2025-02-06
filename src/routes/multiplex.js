const express = require('express');
const router = express.Router();
const { Multiplex, sequelize } = require('../models');

// Route to populate sample data
router.post('/populate', async (req, res) => {
  try {
    // Ensure the table exists
    await sequelize.sync();

    // Find the last seat number
    const lastSeat = await Multiplex.findOne({
      order: [['seatNo', 'DESC']],
      attributes: ['seatNo']
    });

    const startSeatNo = lastSeat ? lastSeat.seatNo + 1 : 0;
    const numberOfNewSeats = 10000;

    // Create an array of seat objects
    const seatData = Array.from({ length: numberOfNewSeats }, (_, index) => ({
      seatNo: startSeatNo + index,
      isBooked: false,
      bookedBy: null
    }));

    // Bulk create new seats
    await Multiplex.bulkCreate(seatData);

    res.status(201).json({
      message: 'Sample data populated successfully',
      seatsCreated: seatData.length,
      startSeatNo,
      endSeatNo: startSeatNo + numberOfNewSeats - 1
    });
  } catch (error) {
    console.error('Error populating sample data:', error);
    res.status(500).json({
      error: 'Failed to populate sample data',
      details: error.message
    });
  }
});

// Add a route to get current seat count
router.get('/status', async (req, res) => {
  try {
    const totalSeats = await Multiplex.count();
    const lastSeat = await Multiplex.findOne({
      order: [['seatNo', 'DESC']],
      attributes: ['seatNo']
    });

    res.status(200).json({
      totalSeats,
      lastSeatNo: lastSeat ? lastSeat.seatNo : null
    });
  } catch (error) {
    console.error('Error getting status:', error);
    res.status(500).json({
      error: 'Failed to get status',
      details: error.message
    });
  }
});

module.exports = router; 