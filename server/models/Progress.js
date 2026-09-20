const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: {
        values: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "SKIPPED"],
        message: "{VALUE} is not a valid progress status",
      },
      default: "NOT_STARTED",
    },
    percentage: {
      type: Number,
      required: [true, "Progress percentage is required"],
      min: [0, "Progress percentage cannot be less than 0"],
      max: [100, "Progress percentage cannot exceed 100"],
      default: 0,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Unique compound index: only one progress record per user per path per module
progressSchema.index({ user: 1, learningPath: 1, module: 1 }, { unique: true });

const Progress =
  mongoose.models.Progress || mongoose.model("Progress", progressSchema);

module.exports = Progress;
