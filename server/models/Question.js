const mongoose = require("mongoose");

const questionOptionSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: [true, "Option label is required"],
      trim: true,
    },
    value: {
      type: String,
      required: [true, "Option value is required"],
      trim: true,
    },
    score: {
      type: Number,
      default: 0,
    },
    dimensionScores: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { _id: false },
);

const questionSchema = new mongoose.Schema(
  {
    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: [true, "Assessment reference is required"],
      index: true,
    },
    questionText: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
    },
    questionType: {
      type: String,
      enum: {
        values: ["LIKERT_SCALE", "MULTIPLE_CHOICE", "SINGLE_CHOICE"],
        message: "{VALUE} is not a supported question type",
      },
      default: "LIKERT_SCALE",
    },
    options: {
      type: [questionOptionSchema],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length >= 2;
        },
        message: "A question must have at least 2 options",
      },
    },
    dimension: {
      type: String,
      required: [true, "Question dimension is required"],
      trim: true,
      lowercase: true,
    },
    order: {
      type: Number,
      required: [true, "Question order is required"],
      min: [1, "Question order must be at least 1"],
    },
    isRequired: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for ordered question retrieval per assessment
questionSchema.index({ assessment: 1, order: 1 }, { unique: true });

const Question =
  mongoose.models.Question || mongoose.model("Question", questionSchema);

module.exports = Question;
