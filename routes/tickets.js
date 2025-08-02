const express = require("express")
const Ticket = require("../models/Ticket")
const Comment = require("../models/Comment")
const Category = require("../models/Category")
const User = require("../models/User")
const { auth, authorize } = require("../middleware/auth")
const { emitToUser, emitToRole } = require("../utils/socket")

const router = express.Router()

// Get all tickets
router.get("/", auth, async (req, res) => {
  try {
    const {
      status,
      priority,
      category,
      createdBy,
      assignedTo,
      page = 1,
      limit = 50,
      search,
      sortBy = "updatedAt",
      sortOrder = "desc",
    } = req.query

    // Build filter based on user role
    const filter = {}

    if (req.user.role === "end_user") {
      filter.createdBy = req.user._id
    }

    // Apply additional filters
    if (status) filter.status = status
    if (priority) filter.priority = priority
    if (category) filter.category = category
    if (createdBy) filter.createdBy = createdBy
    if (assignedTo) {
      filter.assignedTo = assignedTo === "null" ? null : assignedTo
    }

    // Search functionality
    if (search) {
      filter.$or = [{ subject: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
    }

    // Sort options
    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1

    const tickets = await Ticket.find(filter)
      .populate("category", "name color description")
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Ticket.countDocuments(filter)

    res.json({
      success: true,
      data: tickets,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      filters: {
        status,
        priority,
        category,
        search,
        sortBy,
        sortOrder,
      },
    })
  } catch (error) {
    console.error("Get tickets error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching tickets",
    })
  }
})

// Get single ticket with comments
router.get("/:id", auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("category", "name color description")
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      })
    }

    // Check permissions
    const canView =
      req.user.role === "admin" ||
      req.user.role === "support_agent" ||
      ticket.createdBy._id.toString() === req.user._id.toString() ||
      (ticket.assignedTo && ticket.assignedTo._id.toString() === req.user._id.toString())

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You don't have permission to view this ticket.",
      })
    }

    // Get comments (filter internal comments for end users)
    const commentFilter = { ticketId: ticket._id }
    if (req.user.role === "end_user") {
      commentFilter.isInternal = false
    }

    const comments = await Comment.find(commentFilter).populate("userId", "name email role").sort({ createdAt: 1 })

    res.json({
      success: true,
      data: {
        ticket,
        comments,
      },
    })
  } catch (error) {
    console.error("Get ticket error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching ticket",
    })
  }
})

// Create ticket
router.post("/", auth, async (req, res) => {
  try {
    const { subject, description, category, priority = "medium", tags = [] } = req.body

    if (!subject || !description || !category) {
      return res.status(400).json({
        success: false,
        message: "Subject, description, and category are required",
      })
    }

    if (subject.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: "Subject must be at least 5 characters long",
      })
    }

    if (description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Description must be at least 10 characters long",
      })
    }

    // Verify category exists
    const categoryExists = await Category.findById(category)
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: "Invalid category selected",
      })
    }

    const ticket = new Ticket({
      subject: subject.trim(),
      description: description.trim(),
      category,
      priority,
      tags: tags.filter((tag) => tag && tag.trim()).map((tag) => tag.trim()),
      createdBy: req.user._id,
    })

    await ticket.save()

    // Populate the ticket
    await ticket.populate("category", "name color description")
    await ticket.populate("createdBy", "name email role")

    // Emit real-time event
    emitToRole("support_agent", "ticket-created", { payload: ticket })
    emitToRole("admin", "ticket-created", { payload: ticket })

    console.log(`🎫 New ticket created: ${ticket.subject} by ${req.user.email}`)

    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: ticket,
    })
  } catch (error) {
    console.error("Create ticket error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while creating ticket",
    })
  }
})

// Update ticket status
router.put("/:id/status", auth, authorize("support_agent", "admin"), async (req, res) => {
  try {
    const { status } = req.body

    if (!["open", "in_progress", "resolved", "closed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be: open, in_progress, resolved, or closed",
      })
    }

    const updateData = { status }

    if (status === "resolved") {
      updateData.resolvedAt = new Date()
    } else if (status === "closed") {
      updateData.closedAt = new Date()
    } else {
      // Clear resolved/closed dates if status changes back
      updateData.resolvedAt = null
      updateData.closedAt = null
    }

    const ticket = await Ticket.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate("category", "name color description")
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      })
    }

    // Emit real-time event
    emitToUser(ticket.createdBy._id.toString(), "ticket-updated", { payload: ticket })
    if (ticket.assignedTo) {
      emitToUser(ticket.assignedTo._id.toString(), "ticket-updated", { payload: ticket })
    }
    emitToRole("admin", "ticket-updated", { payload: ticket })

    console.log(`📝 Ticket status updated: ${ticket.subject} -> ${status}`)

    res.json({
      success: true,
      message: `Ticket status updated to ${status}`,
      data: ticket,
    })
  } catch (error) {
    console.error("Update ticket status error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while updating ticket status",
    })
  }
})

// Assign ticket
router.post("/:id/assign", auth, authorize("support_agent", "admin"), async (req, res) => {
  try {
    const { agentId } = req.body

    // If no agentId provided, assign to current user
    const assigneeId = agentId || req.user._id

    // Verify assignee exists and has appropriate role
    const assignee = await User.findById(assigneeId)
    if (!assignee || !["support_agent", "admin"].includes(assignee.role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignee. Must be a support agent or admin.",
      })
    }

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      {
        assignedTo: assigneeId,
        status: "in_progress",
      },
      { new: true },
    )
      .populate("category", "name color description")
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      })
    }

    // Emit real-time event
    emitToUser(ticket.createdBy._id.toString(), "ticket-assigned", { payload: ticket })
    emitToUser(assigneeId.toString(), "ticket-assigned", { payload: ticket })
    emitToRole("admin", "ticket-assigned", { payload: ticket })

    console.log(`👤 Ticket assigned: ${ticket.subject} -> ${assignee.name}`)

    res.json({
      success: true,
      message: `Ticket assigned to ${assignee.name}`,
      data: ticket,
    })
  } catch (error) {
    console.error("Assign ticket error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while assigning ticket",
    })
  }
})

// Add comment
router.post("/:id/comments", auth, async (req, res) => {
  try {
    const { content, isInternal = false } = req.body

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required",
      })
    }

    if (content.trim().length < 1) {
      return res.status(400).json({
        success: false,
        message: "Comment cannot be empty",
      })
    }

    // Check if ticket exists and user has access
    const ticket = await Ticket.findById(req.params.id)
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      })
    }

    // Check permissions
    const canComment =
      req.user.role === "admin" ||
      req.user.role === "support_agent" ||
      ticket.createdBy._id.toString() === req.user._id.toString()

    if (!canComment) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You don't have permission to comment on this ticket.",
      })
    }

    const comment = new Comment({
      ticketId: req.params.id,
      userId: req.user._id,
      content: content.trim(),
      isInternal: isInternal && req.user.role !== "end_user", // End users can't create internal comments
    })

    await comment.save()
    await comment.populate("userId", "name email role")

    // Update ticket's lastActivityAt
    ticket.lastActivityAt = new Date()
    await ticket.save()

    // Emit real-time event
    const eventData = {
      payload: {
        comment,
        ticketId: req.params.id,
      },
    }

    // Notify ticket creator (if not internal comment or if they're staff)
    if (ticket.createdBy._id.toString() !== req.user._id.toString()) {
      if (!comment.isInternal || ["support_agent", "admin"].includes(ticket.createdBy.role)) {
        emitToUser(ticket.createdBy._id.toString(), "comment-added", eventData)
      }
    }

    // Notify assigned agent
    if (ticket.assignedTo && ticket.assignedTo._id.toString() !== req.user._id.toString()) {
      emitToUser(ticket.assignedTo._id.toString(), "comment-added", eventData)
    }

    // Notify admins
    emitToRole("admin", "comment-added", eventData)

    console.log(`💬 Comment added to ticket: ${ticket.subject} by ${req.user.name}`)

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: comment,
    })
  } catch (error) {
    console.error("Add comment error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while adding comment",
    })
  }
})

// Update ticket (for end users to close their own tickets)
router.put("/:id", auth, async (req, res) => {
  try {
    const { status } = req.body

    const ticket = await Ticket.findById(req.params.id)
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      })
    }

    // Check permissions
    const canUpdate =
      req.user.role === "admin" ||
      req.user.role === "support_agent" ||
      (ticket.createdBy.toString() === req.user._id.toString() && status === "closed")

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only close your own tickets.",
      })
    }

    // End users can only close tickets that are resolved
    if (req.user.role === "end_user" && status === "closed" && ticket.status !== "resolved") {
      return res.status(400).json({
        success: false,
        message: "You can only close tickets that have been resolved.",
      })
    }

    const updateData = { status }
    if (status === "closed") {
      updateData.closedAt = new Date()
    }

    const updatedTicket = await Ticket.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate("category", "name color description")
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")

    // Emit real-time event
    emitToUser(updatedTicket.createdBy._id.toString(), "ticket-updated", { payload: updatedTicket })
    if (updatedTicket.assignedTo) {
      emitToUser(updatedTicket.assignedTo._id.toString(), "ticket-updated", { payload: updatedTicket })
    }
    emitToRole("admin", "ticket-updated", { payload: updatedTicket })

    console.log(`📝 Ticket updated: ${updatedTicket.subject} -> ${status}`)

    res.json({
      success: true,
      message: "Ticket updated successfully",
      data: updatedTicket,
    })
  } catch (error) {
    console.error("Update ticket error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while updating ticket",
    })
  }
})

module.exports = router
