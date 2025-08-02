const express = require("express")
const mongoose = require("mongoose")
const Ticket = require("../models/Ticket")
const User = require("../models/User")
const Category = require("../models/Category")
const Comment = require("../models/Comment")
const { auth, authorize } = require("../middleware/auth")

const router = express.Router()

// Get dashboard stats
router.get("/stats", auth, async (req, res) => {
  try {
    let stats = {}

    if (req.user.role === "end_user") {
      // User-specific stats
      const userTickets = await Ticket.find({ createdBy: req.user._id })

      stats = {
        totalTickets: userTickets.length,
        openTickets: userTickets.filter((t) => t.status === "open").length,
        inProgressTickets: userTickets.filter((t) => t.status === "in_progress").length,
        resolvedTickets: userTickets.filter((t) => t.status === "resolved").length,
        closedTickets: userTickets.filter((t) => t.status === "closed").length,
      }
    } else {
      // Agent/Admin stats
      const [
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        closedTickets,
        totalUsers,
        totalCategories,
        totalComments,
      ] = await Promise.all([
        Ticket.countDocuments(),
        Ticket.countDocuments({ status: "open" }),
        Ticket.countDocuments({ status: "in_progress" }),
        Ticket.countDocuments({ status: "resolved" }),
        Ticket.countDocuments({ status: "closed" }),
        User.countDocuments({ isActive: true }),
        Category.countDocuments({ isActive: true }),
        Comment.countDocuments(),
      ])

      stats = {
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        closedTickets,
        totalUsers,
        totalCategories,
        totalComments,
      }

      // Agent-specific stats
      if (req.user.role === "support_agent") {
        const myTickets = await Ticket.countDocuments({ assignedTo: req.user._id })
        const myResolvedTickets = await Ticket.countDocuments({
          assignedTo: req.user._id,
          status: "resolved",
        })
        stats.myTickets = myTickets
        stats.myResolvedTickets = myResolvedTickets
      }

      // Admin gets additional stats
      if (req.user.role === "admin") {
        const [unassignedTickets, urgentTickets, todayTickets, activeAgents] = await Promise.all([
          Ticket.countDocuments({ assignedTo: null, status: { $ne: "closed" } }),
          Ticket.countDocuments({ priority: "urgent", status: { $nin: ["resolved", "closed"] } }),
          Ticket.countDocuments({
            createdAt: {
              $gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          }),
          User.countDocuments({ role: "support_agent", isActive: true }),
        ])

        stats.unassignedTickets = unassignedTickets
        stats.urgentTickets = urgentTickets
        stats.todayTickets = todayTickets
        stats.activeAgents = activeAgents
      }
    }

    res.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error("Get dashboard stats error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching dashboard stats",
    })
  }
})

// Get recent activity (Admin/Agent only)
router.get("/activity", auth, authorize("support_agent", "admin"), async (req, res) => {
  try {
    const { limit = 10 } = req.query

    const recentTickets = await Ticket.find()
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")
      .populate("category", "name color")
      .sort({ lastActivityAt: -1 })
      .limit(Number.parseInt(limit))

    const recentComments = await Comment.find()
      .populate("userId", "name email role")
      .populate("ticketId", "subject status")
      .sort({ createdAt: -1 })
      .limit(Number.parseInt(limit))

    res.json({
      success: true,
      data: {
        recentTickets,
        recentComments,
      },
    })
  } catch (error) {
    console.error("Get activity error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching activity",
    })
  }
})

// Get ticket statistics by category (Admin/Agent only)
router.get("/stats/categories", auth, authorize("support_agent", "admin"), async (req, res) => {
  try {
    const categoryStats = await Ticket.aggregate([
      {
        $group: {
          _id: "$category",
          totalTickets: { $sum: 1 },
          openTickets: {
            $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] },
          },
          inProgressTickets: {
            $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] },
          },
          resolvedTickets: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
          },
          closedTickets: {
            $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: "$category",
      },
      {
        $project: {
          _id: 1,
          categoryName: "$category.name",
          categoryColor: "$category.color",
          totalTickets: 1,
          openTickets: 1,
          inProgressTickets: 1,
          resolvedTickets: 1,
          closedTickets: 1,
        },
      },
      {
        $sort: { totalTickets: -1 },
      },
    ])

    res.json({
      success: true,
      data: categoryStats,
    })
  } catch (error) {
    console.error("Get category stats error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching category statistics",
    })
  }
})

// Get ticket statistics by priority (Admin/Agent only)
router.get("/stats/priority", auth, authorize("support_agent", "admin"), async (req, res) => {
  try {
    const priorityStats = await Ticket.aggregate([
      {
        $group: {
          _id: "$priority",
          totalTickets: { $sum: 1 },
          openTickets: {
            $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] },
          },
          inProgressTickets: {
            $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] },
          },
          resolvedTickets: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
          },
          closedTickets: {
            $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] },
          },
        },
      },
      {
        $sort: {
          _id: 1, // This will sort by priority: high, low, medium, urgent
        },
      },
    ])

    // Reorder by priority importance
    const priorityOrder = ["urgent", "high", "medium", "low"]
    const orderedStats = priorityOrder
      .map((priority) => priorityStats.find((stat) => stat._id === priority))
      .filter(Boolean)

    res.json({
      success: true,
      data: orderedStats,
    })
  } catch (error) {
    console.error("Get priority stats error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching priority statistics",
    })
  }
})

// Get user performance stats (Admin only)
router.get("/stats/users", auth, authorize("admin"), async (req, res) => {
  try {
    const userStats = await User.aggregate([
      {
        $match: {
          role: { $in: ["support_agent", "admin"] },
          isActive: true,
        },
      },
      {
        $lookup: {
          from: "tickets",
          localField: "_id",
          foreignField: "assignedTo",
          as: "assignedTickets",
        },
      },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "userId",
          as: "comments",
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          role: 1,
          lastLogin: 1,
          totalAssignedTickets: { $size: "$assignedTickets" },
          resolvedTickets: {
            $size: {
              $filter: {
                input: "$assignedTickets",
                cond: { $eq: ["$$this.status", "resolved"] },
              },
            },
          },
          totalComments: { $size: "$comments" },
          activeTickets: {
            $size: {
              $filter: {
                input: "$assignedTickets",
                cond: { $in: ["$$this.status", ["open", "in_progress"]] },
              },
            },
          },
        },
      },
      {
        $sort: { totalAssignedTickets: -1 },
      },
    ])

    res.json({
      success: true,
      data: userStats,
    })
  } catch (error) {
    console.error("Get user stats error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching user statistics",
    })
  }
})

// Get tickets created over time (Admin/Agent only)
router.get("/stats/timeline", auth, authorize("support_agent", "admin"), async (req, res) => {
  try {
    const { days = 30 } = req.query
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Number.parseInt(days))

    const timelineStats = await Ticket.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          ticketsCreated: { $sum: 1 },
          ticketsResolved: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
          },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: "$_id.year",
              month: "$_id.month",
              day: "$_id.day",
            },
          },
          ticketsCreated: 1,
          ticketsResolved: 1,
        },
      },
    ])

    res.json({
      success: true,
      data: timelineStats,
    })
  } catch (error) {
    console.error("Get timeline stats error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching timeline statistics",
    })
  }
})

module.exports = router
