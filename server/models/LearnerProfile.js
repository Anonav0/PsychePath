const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema(
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

const learningGoalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Goal name is required"],
      trim: true,
    },
    priority: {
      type: Number,
      default: 1,
      min: [1, "Priority must be at least 1"],
    },
  },
  { _id: false },
);

const learningPreferencesSchema = new mongoose.Schema(
  {
    preferredFormat: {
      type: String,
      enum: {
        values: ["VIDEO", "READING", "PROJECT", "PRACTICE", "MIXED"],
        message: "{VALUE} is not a supported learning format",
      },
      default: "MIXED",
    },
    preferredDifficulty: {
      type: String,
      enum: {
        values: ["BEGINNER", "INTERMEDIATE", "ADVANCED"],
        message: "{VALUE} is not a valid difficulty level",
      },
      default: "BEGINNER",
    },
    preferredSessionDuration: {
      type: Number, // in minutes
      default: 45,
      min: [5, "Session duration must be at least 5 minutes"],
      max: [480, "Session duration cannot exceed 480 minutes"],
    },
  },
  { _id: false },
);

const learnerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
      index: true,
    },
    educationLevel: {
      type: String,
      enum: {
        values: [
          "HIGH_SCHOOL",
          "UNDERGRADUATE",
          "POSTGRADUATE",
          "BOOTCAMP",
          "SELF_TAUGHT",
          "OTHER",
        ],
        message: "{VALUE} is not a valid education level",
      },
      default: "OTHER",
    },
    experienceLevel: {
      type: String,
      enum: {
        values: ["BEGINNER", "INTERMEDIATE", "ADVANCED"],
        message: "{VALUE} is not a valid experience level",
      },
      default: "BEGINNER",
    },
    currentSkills: {
      type: [skillSchema],
      default: [],
    },
    learningGoals: {
      type: [learningGoalSchema],
      default: [],
    },
    interests: {
      type: [String],
      default: [],
    },
    learningPreferences: {
      type: learningPreferencesSchema,
      default: () => ({
        preferredFormat: "MIXED",
        preferredDifficulty: "BEGINNER",
        preferredSessionDuration: 45,
      }),
    },
    assessmentDimensions: {
      type: Map,
      of: Number,
      default: {},
    },
    strengths: {
      type: [String],
      default: [],
    },
    improvementAreas: {
      type: [String],
      default: [],
    },
    preferredDifficulty: {
      type: String,
      enum: {
        values: ["BEGINNER", "INTERMEDIATE", "ADVANCED"],
        message: "{VALUE} is not a valid difficulty level",
      },
      default: "BEGINNER",
    },
    weeklyLearningHours: {
      type: Number,
      default: 5,
      min: [1, "Weekly learning hours must be at least 1"],
      max: [168, "Weekly learning hours cannot exceed 168"],
    },
    profileVersion: {
      type: Number,
      default: 1,
      min: [1, "Profile version must be at least 1"],
    },
    lastAssessmentAttempt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentAttempt",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const LearnerProfile =
  mongoose.models.LearnerProfile ||
  mongoose.model("LearnerProfile", learnerProfileSchema);

module.exports = LearnerProfile;
