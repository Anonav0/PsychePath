const mongoose = require("mongoose");

const moduleSkillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Skill name is required"],
      trim: true,
    },
    level: {
      type: String,
      enum: {
        values: ["BEGINNER", "INTERMEDIATE", "ADVANCED"],
        message: "{VALUE} is not a valid skill level",
      },
      default: "BEGINNER",
    },
  },
  { _id: false },
);

const moduleResourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Resource title is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: [
          "ARTICLE",
          "VIDEO",
          "DOCUMENTATION",
          "COURSE",
          "PRACTICE",
          "PROJECT",
        ],
        message: "{VALUE} is not a valid resource type",
      },
      default: "ARTICLE",
    },
    url: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
);

const curriculumModuleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Module title is required"],
      trim: true,
      maxlength: [150, "Module title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      required: [true, "Module description is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Module category is required"],
      trim: true,
    },
    skills: {
      type: [moduleSkillSchema],
      default: [],
    },
    difficulty: {
      type: String,
      enum: {
        values: ["BEGINNER", "INTERMEDIATE", "ADVANCED"],
        message: "{VALUE} is not a valid difficulty level",
      },
      required: [true, "Module difficulty is required"],
      default: "BEGINNER",
    },
    prerequisites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CurriculumModule",
      },
    ],
    estimatedDuration: {
      type: Number, // in hours
      required: [true, "Estimated duration is required"],
      min: [1, "Estimated duration must be at least 1 hour"],
    },
    learningObjectives: {
      type: [String],
      default: [],
    },
    resources: {
      type: [moduleResourceSchema],
      default: [],
    },
    order: {
      type: Number,
      default: 1,
      min: [1, "Order must be at least 1"],
    },
    isActive: {
      type: Boolean,
      default: true,
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

// Indexes for curriculum matching, filtering, and difficulty sequences
curriculumModuleSchema.index({ category: 1, difficulty: 1 });
curriculumModuleSchema.index({ isActive: 1 });

const CurriculumModule =
  mongoose.models.CurriculumModule ||
  mongoose.model("CurriculumModule", curriculumModuleSchema);

module.exports = CurriculumModule;
