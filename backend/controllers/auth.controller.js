import bcrypt from "bcryptjs";
import crypto from "crypto";

import { User } from "../models/user.model.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";

import {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendResetSuccessEmail,
} from "../mailtrap/email.js";

const signup = async (req, res) => {
  const { email, name, password } = req.body;
  try {
    if (!email || !name || !password) {
      throw new Error("All fields are required");
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(401).json({
        success: false,
        message: "User allready exsit with this email",
      });
    }

    if (password.length < 8) {
      return res
        .status(401)
        .json({ error: "Password length must be at least 8" });
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const user = new User({
      email,
      name,
      password: hashPassword,
      verificationToken,
      verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 Hours
    });

    await user.save();

    // JWT token
    generateTokenAndSetCookie(res, user._id);

    // Send email to verification
    await sendVerificationEmail(user.email, verificationToken);

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    console.log("Error signup code: ", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const verifyEmail = async (req, res) => {
  const { code } = req.body;
  try {
    const user = await User.findOne({
      verificationToken: code,
      verificationTokenExpiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save();

    await sendWelcomeEmail(user.email, user.name);

    return res.status(201).json({
      success: true,
      message: "Email Verified successfully",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    console.log("Verify email code: ", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User does not exist" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Password is incorrect" });
    }

    user.lastLogin = new Date();
    await user.save();

    generateTokenAndSetCookie(res, user._id);

    return res.status(201).json({
      success: true,
      message: "User logged in successfully",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    console.log("Error login code: ", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const logout = async (req, res) => {
  res.clearCookie("token");
  return res
    .status(200)
    .json({ success: true, message: "User logged out successfully" });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Generate reset token
    const restToken = crypto.randomBytes(20).toString("hex");
    const restTokenExpireAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

    user.resetPasswordToken = restToken;
    user.resetPasswordExpiresAt = restTokenExpireAt;

    user.save();

    // Send email
    await sendPasswordResetEmail(
      user.email,
      `${process.env.CLIENT_URL}/reset-password/${restToken}`
    );

    return res.status(200).json({
      success: true,
      message: "password reset link sent to your email",
    });
  } catch (error) {
    console.log("Error forgot password code: ", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Validate input
    if (!token || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Token and password are required" });
    }

    // Find the user with a valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset token" });
    }

    // Hash the new password
    const hashPassword = await bcrypt.hash(password, 10);

    // Update user data
    user.password = hashPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;

    await user.save();

    // Send success email (optional: wrap in try-catch)
    try {
      await sendResetSuccessEmail(user.email);
    } catch (emailError) {
      console.error("Failed to send reset success email: ", emailError.message);
    }

    // Respond with success
    return res
      .status(200)
      .json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.error("Error in resetPassword function: ", error);
    res
      .status(500)
      .json({
        success: false,
        message: "An error occurred. Please try again.",
      });
  }
};

const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.log("Error in checkAuth ", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export {
  signup,
  login,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  checkAuth,
};
