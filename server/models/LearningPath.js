const mongoose = require("mongoose");

const pathModuleSchema = new mongoose.Schema(
  {
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CurriculumModule",
      required: [true, "Curriculum module reference is required"],
    },
    order: {
      type: Number,
      required: [true, "Module order in path is required"],
      min: [1, "Module order must be at least 1"],
    },
    reason: {
      type: String,
      default: "",
      trim: true,
    },
    priority: {
      type: Number,
      default: 1,
      min: [1, "Priority must be at least 1"],
    },
    status: {
      type: String,
      enum: {
        values: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "SKIPPED"],
        message: "{VALUE} is not a valid module status",
      },
      default: "NOT_STARTED",
    },
  },
  { _id: false },
);

const learningPathSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },
    sourceAssessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      default: null,
    },
    modules: {
      type: [pathModuleSchema],
      default: [],
    },
    goals: {
      type: [String],
      default: [],
    },
    summary: {
      type: String,
      default: "",
      trim: true,
    },
    focusAreas: {
      type: [String],
      default: [],
    },
    learningStrategy: {
      type: String,
      default: "",
      trim: true,
    },
    estimatedDuration: {
      type: Number, // Total hours
      default: 0,
      min: [0, "Estimated duration cannot be negative"],
    },
    status: {
      type: String,
      enum: {
        values: ["ACTIVE", "COMPLETED", "ARCHIVED", "DRAFT"],
        message: "{VALUE} is not a valid path status",
      },
      default: "ACTIVE",
    },
    generatedBy: {
      type: String,
      enum: {
        values: ["RULE_ENGINE", "GEMINI", "HYBRID"],
        message: "{VALUE} is not a valid generation source",
      },
      default: "RULE_ENGINE",
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    version: {
      type: Number,
      default: 1,
      min: [1, "Path version must be at least 1"],
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for path retrieval per user
learningPathSchema.index({ user: 1, createdAt: -1 });
learningPathSchema.index({ user: 1, status: 1 });

const LearningPath =
  mongoose.models.LearningPath ||
  mongoose.model("LearningPath", learningPathSchema);

module.exports = LearningPath;
