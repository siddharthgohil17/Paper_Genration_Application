import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config();

const databaseName = "QuenstionBank";
const url = process.env.MONGO_URL;


const startTime = process.hrtime(); // Start the timer

mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
const subject = db.collection('_DSA_');

db.on("error", (error) => {
  console.error("Connection error:", error);
});

db.once("open", async () => {
  const endTime = process.hrtime(startTime); // Stop the timer
  const elapsedTimeInMs = endTime[0] * 1000 + endTime[1] / 1e6; 
  console.log(`Connected to the ${databaseName} database in ${elapsedTimeInMs.toFixed(2)} ms`);

});

export { db, subject };
