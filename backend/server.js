import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";
import dotenv from "dotenv"
import connectDB from "./db/database.js";
import path from "path"

import authRoutes from "./routes/auth.routes.js"

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

app.use(cors({origin: "http://localhost:5173", credentials: true}));

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);

if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "/frontend/dist")));

	app.get("*", (req, res) => {
		res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
	});
}

// Connect to MongoDB first, then start the server
const startServer = async () => {
  try {
    await connectDB(); // Ensure DB connection is established
    app.listen(PORT, () => {
      console.log(`⚙️  Server running on PORT ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error.message);
    process.exit(1); // Exit the process with an error
  }
};

startServer();

export default app;
