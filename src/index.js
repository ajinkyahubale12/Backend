import dotenv from "dotenv";
import express from "express";
import { app } from "./app.js"
import connectDB from "./db/index.js";

dotenv.config({
  path: "./env"
});

// Initialize the Express application
// const app = express();

// Connect to the database
connectDB()
  .then(() => {
    // Start the server after the database connection is established
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on port: ${process.env.PORT || 8000}`);
    });
  })
  .catch((err) => {
    console.log("Mongo connection failed", err);
  });
