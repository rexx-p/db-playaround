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

async function addAndBookSeat({ seatNo, nameOfBooker }) {
  try {
    const response = await axios.post(`${BASE_URL}/add-and-book-seat`, {
      seatNo,
      nameOfBooker,
    });
    return {
      success: true,
      message: `Seat ${seatNo} added and booked by ${nameOfBooker}`,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to add and book seat ${seatNo} for ${nameOfBooker}: ${
        error.response?.data?.error || error.message
      }`,
      error: error,
    };
  }
}

async function testBookSeat() {
  const bookingRequests = [
    { seatNo: 674, nameOfBooker: "Jane Smith" },
    { seatNo: 674, nameOfBooker: "John Doe" },
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

async function testAddAndBookSeat() {
  const bookingRequests = [
    { seatNo: 23123, nameOfBooker: "Rex" },
    { seatNo: 23123, nameOfBooker: "Jane Smith" },

  ];

  const bookingResults = await Promise.all(
    bookingRequests.map((request) => addAndBookSeat(request))
  );

  bookingResults.forEach((result) => {
    if (result.success) {
      console.log("✅", result.message);
    } else {
      console.error("❌", result.message);
    }
  });
}

//testAddAndBookSeat();
testBookSeat();
