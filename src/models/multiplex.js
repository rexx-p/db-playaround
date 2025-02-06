'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Multiplex extends Model {
    static associate(models) {
      // define associations here if needed
    }
  }
  
  Multiplex.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    seatNo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true
    },
    isBooked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    bookedBy: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Multiplex',
  });
  
  return Multiplex;
}; 