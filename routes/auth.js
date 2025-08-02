const express = require("express")
const jwt = require("jsonwebtoken")
const validator = require("validator")
const User = require("../models/User")
const { auth } = require("../middleware/auth")

const router = express.Router()

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" })
}

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role = "end_user" } = req.body

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password",
      })
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters long",
      })
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email address",
      })
    }

    // Create user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role === "admin" ? "end_user" : role, // Prevent admin registration via API
    })

    await user.save()

    // Generate token
    const token = generateToken(user._id)

    // Prepare user data
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token,
    }

    console.log(`✅ New user registered: ${user.email} (${user.role})`)

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: userData,
    })
  } catch (error) {
    console.error("Registration error:", error)

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email address is already registered",
      })
    }

    res.status(500).json({
      success: false,
      message: "Server error during registration",
    })
  }
})

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      })
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      })
    }

    // Find user
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      isActive: true,
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      })
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      })
    }

    // Check role if specified
    if (role && user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Access denied. You don't have ${role.replace("_", " ")} permissions.`,
      })
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Generate token
    const token = generateToken(user._id)

    // Prepare user data
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token,
    }

    console.log(`✅ User logged in: ${user.email} (${user.role})`)

    res.json({
      success: true,
      message: "Login successful",
      data: userData,
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during login",
    })
  }
})

// Get current user
router.get("/me", auth, async (req, res) => {
  try {
    const userData = {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      avatar: req.user.avatar,
      lastLogin: req.user.lastLogin,
      createdAt: req.user.createdAt,
    }

    res.json({
      success: true,
      data: userData,
    })
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// Update profile
router.put("/profile", auth, async (req, res) => {
  try {
    const { name, avatar } = req.body
    const updates = {}

    if (name && name.trim().length >= 2) {
      updates.name = name.trim()
    }

    if (avatar !== undefined) {
      updates.avatar = avatar
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid updates provided",
      })
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select(
      "-password",
    )

    console.log(`✅ Profile updated for user: ${user.email}`)

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    })
  } catch (error) {
    console.error("Profile update error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during profile update",
    })
  }
})

// Change password
router.put("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current and new password",
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      })
    }

    const user = await User.findById(req.user._id)
    const isCurrentPasswordValid = await user.comparePassword(currentPassword)

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      })
    }

    user.password = newPassword
    await user.save()

    console.log(`✅ Password changed for user: ${user.email}`)

    res.json({
      success: true,
      message: "Password changed successfully",
    })
  } catch (error) {
    console.error("Change password error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during password change",
    })
  }
})

module.exports = router
