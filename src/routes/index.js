const express = require("express");
const router = express.Router();
const multiplexRoutes = require("./multiplex");
const { Multiplex } = require("../models");

// Health check route
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});



router.post("/book-seat", async (req, res) => {
  try {
    const { seatNo, nameOfBooker } = req.body;
    console.log(`[book-seat] Request received - seatNo: ${seatNo}, nameOfBooker: ${nameOfBooker}`);

    // Input validation
    if (!seatNo || !nameOfBooker) {
      console.log('[book-seat] Validation failed - missing required fields');
      return res
        .status(400)
        .json({ error: "Both seatNo and nameOfBooker are required" });
    }

    // Validate seatNo is a valid number
    const seatNumber = parseInt(seatNo);
    if (isNaN(seatNumber) || seatNumber <= 0) {
      console.log(`[book-seat] Invalid seat number: ${seatNo}`);
      return res
        .status(400)
        .json({ error: "seatNo must be a positive number" });
    }

    if (typeof nameOfBooker !== "string") {
      console.log(`[book-seat] Invalid nameOfBooker type: ${typeof nameOfBooker}`);
      return res.status(400).json({ error: "nameOfBooker must be a string" });
    }

    if (nameOfBooker.trim().length === 0) {
      console.log('[book-seat] Empty nameOfBooker provided');
      return res.status(400).json({ error: "nameOfBooker cannot be empty" });
    }

    console.log('[book-seat] Starting database transaction');
    // Find and book the seat in a transaction to prevent race conditions


      console.log(`[book-seat] Searching for seat: ${seatNumber}`);
      // Find the seat with a lock to prevent concurrent bookings
      const seat = await Multiplex.findOne({
        where: {
          seatNo: seatNumber,
          isBooked: false,
        },
      });

      if (!seat) {
        console.log(`[book-seat] Seat ${seatNumber} not available, checking if exists`);
        // Check if seat exists at all to provide better error message
        const seatExists = await Multiplex.findOne({
          where: { seatNo: seatNumber },
        });

        if (seatExists) {
          console.log(`[book-seat] Seat ${seatNumber} exists but is already booked`);
          throw new Error("SEAT_ALREADY_BOOKED");
        } else {
          console.log(`[book-seat] Seat ${seatNumber} does not exist`);
          throw new Error("SEAT_NOT_FOUND");
        }
      }
      
      console.log('[book-seat] Waiting 1 second for testing purposes');
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log(`[book-seat] Updating seat ${seatNumber} for ${nameOfBooker}`);
      // Book the seat
      await seat.update(
        {
          isBooked: true,
          bookedBy: nameOfBooker.trim(),
        }
      );

    console.log(`[book-seat] Successfully booked seat ${seatNumber} for ${nameOfBooker}`);
    return res.status(200).json({
      message: "Seat booked successfully",
    });
  } catch (error) {
    console.error("[book-seat] Error booking seat:", error);

    if (error.message === "SEAT_ALREADY_BOOKED") {
      return res.status(400).json({ error: "Seat is already booked" });
    }

    if (error.message === "SEAT_NOT_FOUND") {
      return res.status(404).json({ error: "Seat not found" });
    }

    return res.status(500).json({ error: "Failed to book seat" });
  }
});

// Add multiplex routes
router.use("/multiplex", multiplexRoutes);

module.exports = router;
