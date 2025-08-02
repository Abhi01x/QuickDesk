const mongoose = require("mongoose")

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
      maxlength: [100, "Category name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    color: {
      type: String,
      enum: {
        values: ["blue", "green", "yellow", "purple", "red", "orange", "pink", "gray"],
        message: "Color must be one of: blue, green, yellow, purple, red, orange, pink, gray",
      },
      default: "blue",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes
categorySchema.index({ name: 1 })
categorySchema.index({ isActive: 1 })

module.exports = mongoose.model("Category", categorySchema)
