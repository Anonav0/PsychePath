const mongoose = require("mongoose");

const progressHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },
    learningPath: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LearningPath",
      required: [true, "Learning path reference is required"],
      index: true,
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CurriculumModule",
      required: [true, "Curriculum module reference is required"],
      index: true,
    },
    action: {
      type: String,
      enum: {
        values: ["STARTED", "PROGRESS_UPDATED", "COMPLETED", "SKIPPED"],
        message: "{VALUE} is not a valid progress history action",
      },
      required: [true, "History action is required"],
    },
    previousStatus: {
      type: String,
      enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "SKIPPED"],
      default: "NOT_STARTED",
    },
    newStatus: {
      type: String,
      enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "SKIPPED"],
      required: [true, "New progress status is required"],
    },
    previousPercentage: {
      type: Number,
      min: [0, "Previous percentage cannot be negative"],
      max: [100, "Previous percentage cannot exceed 100"],
      default: 0,
    },
    newPercentage: {
      type: Number,
      required: [true, "New percentage is required"],
      min: [0, "New percentage cannot be negative"],
      max: [100, "New percentage cannot exceed 100"],
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

// Indexes supporting efficient audit log queries
progressHistorySchema.index({ user: 1, learningPath: 1, timestamp: -1 });
progressHistorySchema.index({ learningPath: 1, module: 1, timestamp: -1 });

const ProgressHistory =
  mongoose.models.ProgressHistory ||
  mongoose.model("ProgressHistory", progressHistorySchema);

module.exports = ProgressHistory;
