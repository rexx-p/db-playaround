const axios = require("axios");
const BASE_URL = "http://localhost:3000/api";

async function bookSeat({ seatNo, nameOfBooker }) {
  try {
    const response = await axios.post(`${BASE_URL}/book-seat`, {
      seatNo,
      nameOfBooker,
    });
    return {
      success: true,
      message: `Seat ${seatNo} successfully booked by ${nameOfBooker}`,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to book seat ${seatNo} for ${nameOfBooker}: ${
        error.response?.data?.error || error.message
      }`,
      error: error,
    };
  }
}

async function testBookSeat() {
  const bookingRequests = [
    { seatNo: 43, nameOfBooker: "Jane Smith" },
    { seatNo: 43, nameOfBooker: "John Doe" },
  ];

  const bookingResults = await Promise.all(
    bookingRequests.map((request) => bookSeat(request))
  );
  bookingResults.forEach((result) => {
    if (result.success) {
      console.log("✅", result.message);
    } else {
      console.error("❌", result.message);
    }
  });
}

testBookSeat();
