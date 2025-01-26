import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("\n MongoDB Connected Successfully 🤝 !");
  } catch (error) {
    console.log("Error while connected to mongoDB", error.message);
    process.exit(1);
  }
};

export default connectDB;
