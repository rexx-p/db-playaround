const request = require('supertest');
const app = require('../app');
const { Multiplex } = require('../models');

describe('Book Seat API', () => {
  // Clear database and create test data before each test
  beforeEach(async () => {
    await Multiplex.destroy({ where: {} });
    await Multiplex.create({
      seatNo: 'A1',
      isBooked: false,
      bookedBy: null
    });
    await Multiplex.create({
      seatNo: 'A2',
      isBooked: true,
      bookedBy: 'Jane Doe'
    });
  });

  // Test successful booking
  test('should successfully book an available seat', async () => {
    const response = await request(app)
      .post('/book-seat')
      .send({
        seatNo: 'A1',
        nameOfBooker: 'John Doe'
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Seat booked successfully');
    expect(response.body.seat.isBooked).toBe(true);
    expect(response.body.seat.bookedBy).toBe('John Doe');
  });

  // Test booking an already booked seat
  test('should fail to book an already booked seat', async () => {
    const response = await request(app)
      .post('/book-seat')
      .send({
        seatNo: 'A2',
        nameOfBooker: 'John Doe'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Seat is already booked');
  });

  // Test booking with missing seat number
  test('should fail when seat number is missing', async () => {
    const response = await request(app)
      .post('/book-seat')
      .send({
        nameOfBooker: 'John Doe'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Both seatNo and nameOfBooker are required');
  });

  // Test booking with missing booker name
  test('should fail when booker name is missing', async () => {
    const response = await request(app)
      .post('/book-seat')
      .send({
        seatNo: 'A1'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Both seatNo and nameOfBooker are required');
  });

  // Test booking a non-existent seat
  test('should fail when seat does not exist', async () => {
    const response = await request(app)
      .post('/book-seat')
      .send({
        seatNo: 'Z99',
        nameOfBooker: 'John Doe'
      });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Seat not found');
  });
}); 