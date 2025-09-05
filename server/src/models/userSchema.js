import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import userBasicDetailSchema from "./userSubSchemas/userBasicDetail.model.js";
import professionalDetailSchema from "./userSubSchemas/professionalDetail.model.js";
import skillsSchema from "./userSubSchemas/skills.model.js";
import Licenses from "./userSubSchemas/licenses.model.js";
import WorkExp from "./userSubSchemas/workExp.model.js";
import Project from "./userSubSchemas/projects.model.js";
import EquipmentDetail from "./userSubSchemas/userequipmentDetail.model.js";


import { v4 as uuidv4 } from "uuid";

const phoneSchema = new Schema(
  {
    number: {
      type: String,
      unique: true,
      required: [true, "phone is required"],
      validate: {
        validator: function (v) {
          return /^\d{10}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    countryCode: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^\+\d{1,4}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid country code!`,
      },
    },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    email: {
      type: String,
      trim: true,
      unique: true,
      lowercase: true,
      required: true,
      validate: {
        validator: function (v) {
          return /^\S+@\S+\.\S+$/.test(v);
        },
        message: (props) => `${props.value} is not a valid email!`,
      },
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: phoneSchema,
      required: true,
    },
    avatar: {
      type: String,
    },
    fileId: {
      type: String,
    },
    surveyAnswer: {
      type: String,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
    },
    areaPin: {
      type: Number,
      required: true,
    },
    locality: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    coordinates: {
      lon: {
        type: Number,
      },
      lat: {
        type: Number,
      },
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    isApplied: {
      type: Boolean,
      default: false,
    },
    dataVerified:{
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "review", "rejected", "approved"],
      default: "pending",
    },
    socialLinks: [
      {
        title: {
          type: String,
        },
        url: {
          type: String,
        },
      },
    ],

    basicDetails: userBasicDetailSchema,
    professionalDetails: professionalDetailSchema,
    skills: skillsSchema,
    equipmentDetails: {
      type: Schema.Types.ObjectId,
      ref: EquipmentDetail.modelName,
    },
    workExp: {
      type: Schema.Types.ObjectId,
      ref: WorkExp.modelName,
    },
    licenses: {
      type: Schema.Types.ObjectId,
      ref: Licenses.modelName,
    },
    projects: {
      type: Schema.Types.ObjectId,
      ref: Project.modelName,
    },
    portfolioImage: [
      {
        type: String,
      },
    ],
    portfolioVideo: [
      {
        type: String,
      },
    ],
    uniqueId: {
      type: String,
      unique: true,
      default: () => uuidv4(),
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    appliedTime: {
      type: Date,
    },
    
    bioSection: {
      hideBio: { type: Boolean, default:false },
      bio:{type:String,default:""},
    },
    acceptedTermsandPrivacy: {
      type: Boolean,
      default: false,
    },
    acceptedCommunication: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// userSchema.index({ "phone.number": 1 });
userSchema.index({ fullName: 1 });
userSchema.index({ city: 1 });
userSchema.index({ state: 1 });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = function (givenPassword) {
  return bcrypt.compare(givenPassword, this.password);
};

const User = model("User", userSchema);
export default User;
