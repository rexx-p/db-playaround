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
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to book seat ${seatNo} for ${nameOfBooker}: Seat already booked`,
      error: error
    };
  }
}

async function main() {
  const requests = [
    { seatNo: 55, nameOfBooker: "Jane Smith" },
    { seatNo: 55, nameOfBooker: "Alice Johnson" },
  ];
  const resultPromises = [];
  for (const request of requests) {
    resultPromises.push(bookSeat(request));
  }

  const results = await Promise.all(resultPromises);
  
  // Print results in a cleaner way
  results.forEach(result => {
    if (result.success) {
      console.log("✅", result.message);
    } else {
      console.error("❌", result.message);
    }
  });
}

main();
