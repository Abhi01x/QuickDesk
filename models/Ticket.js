const mongoose = require("mongoose")

const ticketSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      maxlength: [200, "Subject cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    status: {
      type: String,
      enum: {
        values: ["open", "in_progress", "resolved", "closed"],
        message: "Status must be one of: open, in_progress, resolved, closed",
      },
      default: "open",
    },
    priority: {
      type: String,
      enum: {
        values: ["low", "medium", "high", "urgent"],
        message: "Priority must be one of: low, medium, high, urgent",
      },
      default: "medium",
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [50, "Tag cannot exceed 50 characters"],
      },
    ],
    attachments: [
      {
        filename: String,
        originalName: String,
        mimetype: String,
        size: Number,
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isPublic: {
      type: Boolean,
      default: false,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for better performance
ticketSchema.index({ status: 1, createdAt: -1 })
ticketSchema.index({ createdBy: 1, createdAt: -1 })
ticketSchema.index({ assignedTo: 1, status: 1 })
ticketSchema.index({ category: 1 })
ticketSchema.index({ priority: 1 })
ticketSchema.index({ lastActivityAt: -1 })

// Update lastActivityAt before saving
ticketSchema.pre("save", function (next) {
  if (this.isModified() && !this.isNew) {
    this.lastActivityAt = new Date()
  }
  next()
})

module.exports = mongoose.model("Ticket", ticketSchema)
