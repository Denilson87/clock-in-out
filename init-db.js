

const Datastore = require('nedb');
const path = require('path');
const fs = require('fs');

// Use a separate folder for persistent data, outside of the 'dist' folder
let dataDirPath = path.join(__dirname, 'data'); // Create a 'data' folder for persistence
let usersPath = path.join(dataDirPath, 'users.db');
let recordsPath = path.join(dataDirPath, 'records.db');

// Ensure the 'data' directory exists
if (!fs.existsSync(dataDirPath)) {
  fs.mkdirSync(dataDirPath);
}

const usersDB = new Datastore({ filename: usersPath, autoload: true });
const recordsDB = new Datastore({ filename: recordsPath, autoload: true });

module.exports = {
  usersDB,
  recordsDB
};
