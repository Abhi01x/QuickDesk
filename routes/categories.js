const express = require("express")
const Category = require("../models/Category")
const { auth, authorize } = require("../middleware/auth")

const router = express.Router()

// Get all categories
router.get("/", async (req, res) => {
  try {
    const { includeInactive = false } = req.query

    const filter = includeInactive === "true" ? {} : { isActive: true }
    const categories = await Category.find(filter).populate("createdBy", "name email").sort({ name: 1 })

    res.json({
      success: true,
      data: categories,
      count: categories.length,
    })
  } catch (error) {
    console.error("Get categories error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching categories",
    })
  }
})

// Get single category
router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate("createdBy", "name email")

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      })
    }

    res.json({
      success: true,
      data: category,
    })
  } catch (error) {
    console.error("Get category error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching category",
    })
  }
})

// Create category (Admin only)
router.post("/", auth, authorize("admin"), async (req, res) => {
  try {
    const { name, description, color = "blue" } = req.body

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Category name is required and must be at least 2 characters long",
      })
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      isActive: true,
    })

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "A category with this name already exists",
      })
    }

    const category = new Category({
      name: name.trim(),
      description: description?.trim() || "",
      color,
      createdBy: req.user._id,
    })

    await category.save()
    await category.populate("createdBy", "name email")

    console.log(`📁 New category created: ${category.name} by ${req.user.email}`)

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    })
  } catch (error) {
    console.error("Create category error:", error)

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A category with this name already exists",
      })
    }

    res.status(500).json({
      success: false,
      message: "Server error while creating category",
    })
  }
})

// Update category (Admin only)
router.put("/:id", auth, authorize("admin"), async (req, res) => {
  try {
    const { name, description, color, isActive } = req.body
    const updates = {}

    if (name && name.trim().length >= 2) {
      // Check if another category with this name exists
      const existingCategory = await Category.findOne({
        _id: { $ne: req.params.id },
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
        isActive: true,
      })

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: "A category with this name already exists",
        })
      }

      updates.name = name.trim()
    }

    if (description !== undefined) {
      updates.description = description.trim()
    }

    if (color) {
      updates.color = color
    }

    if (typeof isActive === "boolean") {
      updates.isActive = isActive
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid updates provided",
      })
    }

    const category = await Category.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate("createdBy", "name email")

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      })
    }

    console.log(`📝 Category updated: ${category.name} by ${req.user.email}`)

    res.json({
      success: true,
      message: "Category updated successfully",
      data: category,
    })
  } catch (error) {
    console.error("Update category error:", error)

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A category with this name already exists",
      })
    }

    res.status(500).json({
      success: false,
      message: "Server error while updating category",
    })
  }
})

// Delete category (Admin only) - Soft delete
router.delete("/:id", auth, authorize("admin"), async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true })

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      })
    }

    console.log(`🗑️ Category deleted: ${category.name} by ${req.user.email}`)

    res.json({
      success: true,
      message: "Category deleted successfully",
      data: category,
    })
  } catch (error) {
    console.error("Delete category error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while deleting category",
    })
  }
})

// Restore category (Admin only)
router.put("/:id/restore", auth, authorize("admin"), async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true }).populate(
      "createdBy",
      "name email",
    )

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      })
    }

    console.log(`♻️ Category restored: ${category.name} by ${req.user.email}`)

    res.json({
      success: true,
      message: "Category restored successfully",
      data: category,
    })
  } catch (error) {
    console.error("Restore category error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while restoring category",
    })
  }
})

module.exports = router
