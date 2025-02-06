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

// Add and book a seat route
router.post("/add-and-book-seat", async (req, res) => {
  try {
    const { seatNo, nameOfBooker } = req.body;
    console.log(`\n🎯 [add-and-book-seat] New request received:`);
    console.log(`📝 Request details - seatNo: ${seatNo}, nameOfBooker: ${nameOfBooker}`);

    // Input validation
    if (!seatNo || !nameOfBooker) {
      console.log('❌ [Validation] Missing required fields');
      return res
        .status(400)
        .json({ error: "Both seatNo and nameOfBooker are required" });
    }

    // Validate seatNo is a valid number
    const seatNumber = parseInt(seatNo);
    if (isNaN(seatNumber) || seatNumber <= 0) {
      console.log(`❌ [Validation] Invalid seat number: ${seatNo}`);
      return res
        .status(400)
        .json({ error: "seatNo must be a positive number" });
    }

    if (typeof nameOfBooker !== "string") {
      console.log(`❌ [Validation] Invalid nameOfBooker type: ${typeof nameOfBooker}`);
      return res.status(400).json({ error: "nameOfBooker must be a string" });
    }

    if (nameOfBooker.trim().length === 0) {
      console.log('❌ [Validation] Empty nameOfBooker provided');
      return res.status(400).json({ error: "nameOfBooker cannot be empty" });
    }

    console.log('\n🔄 [Transaction] Starting database transaction');
    //Print isolation level
    //set isolation level to read committed
    await Multiplex.sequelize.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
    // Find or create and book the seat in a transaction to prevent race conditions
    const result = await Multiplex.sequelize.transaction(async (t) => {
      console.log(`\n🔍 [Query] Checking if seat ${seatNumber} exists`);
      
      // Add delay BEFORE checking existence - This makes race condition more likely
      console.log('⏳ [Delay] Artificial delay before seat check...');
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Try to find the seat first
      let seat = await Multiplex.findOne({
        where: { seatNo: seatNumber },
        transaction: t,
        lock: true,
      });

      console.log(`✨ [Result] Seat search result: ${seat ? 'Found' : 'Not found'}`);

      if (seat) {
        console.log(`\n📋 [Check] Checking if seat ${seatNumber} is already booked`);
        // If seat exists, check if it's already booked
        if (seat.isBooked) {
          console.log(`❌ [Status] Seat ${seatNumber} is already booked by: ${seat.bookedBy}`);
          throw new Error("SEAT_ALREADY_BOOKED");
        }
        console.log(`✅ [Status] Seat ${seatNumber} is available for booking`);
      } else {
        // If seat doesn't exist, create it
        console.log(`\n➕ [Query] Seat doesn't exist. Creating new seat:`);
        console.log(`   INSERT INTO multiplex (seatNo, isBooked) VALUES (${seatNumber}, false)`);
        
        // Add delay BEFORE creation - This makes parallel creation more likely
        console.log('⏳ [Delay] Artificial delay before seat creation...');
        await new Promise((resolve) => setTimeout(resolve, 2000));
        
        seat = await Multiplex.create(
          {
            seatNo: seatNumber,
            isBooked: false,
          },
          { transaction: t }
        );
        console.log(`✅ [Result] New seat ${seatNumber} created successfully`);
      }

      // Add delay BEFORE booking - This makes parallel booking more likely
      console.log('⏳ [Delay] Artificial delay before booking...');
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log(`\n📝 [Query] Updating seat booking status:`);
      console.log(`   UPDATE multiplex SET isBooked = true, bookedBy = '${nameOfBooker.trim()}' WHERE seatNo = ${seatNumber}`);
      
      // Book the seat
      await seat.update(
        {
          isBooked: true,
          bookedBy: nameOfBooker.trim(),
        },
        { transaction: t }
      );
      console.log(`✅ [Result] Seat ${seatNumber} successfully booked for ${nameOfBooker}`);

      return seat;
    });

    console.log(`\n✅ [Transaction] Transaction completed successfully`);
    return res.status(200).json({
      message: "Seat added and booked successfully",
      seat: result,
    });
  } catch (error) {
    console.error("\n❌ [Error] Transaction failed:", error.message);
    console.error("   Stack trace:", error.stack);

    if (error.message === "SEAT_ALREADY_BOOKED") {
      return res.status(400).json({ error: "Seat is already booked" });
    }

    return res.status(500).json({ error: "Failed to add and book seat" });
  }
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

    await Multiplex.sequelize.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');

    const result = await Multiplex.sequelize.transaction(async (t) => {
      console.log(`[book-seat] Searching for seat: ${seatNumber}`);
      // Find the seat with a lock to prevent concurrent bookings
      const seat = await Multiplex.findOne({
        where: {
          seatNo: seatNumber,
          isBooked: false,
        },
        lock: true,
        transaction: t,
      });

      if (!seat) {
        console.log(`[book-seat] Seat ${seatNumber} not available, checking if exists`);
        // Check if seat exists at all to provide better error message
        const seatExists = await Multiplex.findOne({
          where: { seatNo: seatNumber },
          transaction: t,
          lock: true,
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
        },
        { transaction: t }
      );

      return seat;
    });

    console.log(`[book-seat] Successfully booked seat ${seatNumber} for ${nameOfBooker}`);
    return res.status(200).json({
      message: "Seat booked successfully",
      seat: result,
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
