const mongoose = require("mongoose");

const attemptAnswerSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: [true, "Question reference is required"],
    },
    selectedOption: {
      type: String,
      default: "",
    },
    selectedValue: {
      type: String,
      required: [true, "Selected value is required"],
    },
    answeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const assessmentAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },
    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: [true, "Assessment reference is required"],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ["IN_PROGRESS", "COMPLETED", "ABANDONED"],
        message: "{VALUE} is not a valid attempt status",
      },
      default: "IN_PROGRESS",
    },
    answers: {
      type: [attemptAnswerSchema],
      default: [],
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    scores: {
      type: Map,
      of: Number,
      default: {},
    },
    resultSummary: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for query performance: attempts by user and assessment, or chronological history
assessmentAttemptSchema.index({ user: 1, assessment: 1 });
assessmentAttemptSchema.index({ user: 1, createdAt: -1 });

const AssessmentAttempt =
  mongoose.models.AssessmentAttempt ||
  mongoose.model("AssessmentAttempt", assessmentAttemptSchema);

module.exports = AssessmentAttempt;
