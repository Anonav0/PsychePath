const mongoose = require("mongoose");

const dimensionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, "Dimension key is required"],
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: [true, "Dimension name is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false },
);

const scoringConfigSchema = new mongoose.Schema(
  {
    minScore: {
      type: Number,
      default: 0,
    },
    maxScore: {
      type: Number,
      default: 100,
    },
    dimensionRules: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false },
);

const assessmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Assessment title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    description: {
      type: String,
      required: [true, "Assessment description is required"],
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    type: {
      type: String,
      enum: {
        values: ["LEARNING_STYLE", "SKILLS", "PERSONALITY_PROFILE", "GENERAL"],
        message: "{VALUE} is not a supported assessment type",
      },
      default: "GENERAL",
    },
    instructions: {
      type: String,
      default: "",
      trim: true,
    },
    dimensions: {
      type: [dimensionSchema],
      default: [],
    },
    questionCount: {
      type: Number,
      default: 0,
      min: [0, "Question count cannot be negative"],
    },
    estimatedDuration: {
      type: Number,
      required: [true, "Estimated duration is required"],
      min: [1, "Estimated duration must be at least 1 minute"],
    },
    scoringConfig: {
      type: scoringConfigSchema,
      default: () => ({ minScore: 0, maxScore: 100, dimensionRules: {} }),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    version: {
      type: Number,
      default: 1,
      min: [1, "Version must be at least 1"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for querying active assessments by type
assessmentSchema.index({ type: 1, isActive: 1 });

const Assessment =
  mongoose.models.Assessment || mongoose.model("Assessment", assessmentSchema);

module.exports = Assessment;
