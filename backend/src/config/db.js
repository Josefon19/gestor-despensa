const mongoose = require('mongoose');

class Database {
  static #instance = null;

  constructor() {
    if (Database.#instance) return Database.#instance;
    this.connection = null;
    Database.#instance = this;
  }

  static getInstance() {
    return new Database();
  }

  async connect(uri = process.env.DB_URI) {
    if (this.connection) return this.connection;
    await mongoose.connect(uri);
    this.connection = mongoose.connection;
    console.log('MongoDB conectado');
    return this.connection;
  }
}

module.exports = Database;