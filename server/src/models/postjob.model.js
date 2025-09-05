
import mongoose, {Schema} from "mongoose";

const postJob = new mongoose.Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    subtitle: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    location: {
        type: String,
        required: true,
    
    },
    companyname: {
        type: String,
        required: true,
    },
    companyLogo: {
        type: String,
        default: null,
    },
    salary :
    {
        type: String,
        required: true,
    },
    industrytype: {
        type: String,
        required: true,

    },
    category: {
        type: String,
        required: true,

    },
    jobtype: {
        type: String,
        required: true,

    },
    jobsummary: {
        type: String,
        required: true,

    },
    phoneNumber: {
  type: Number,
  required:true,
  validate: {
    validator: function (v) {
      // check 10-digit phone number
      return /^[0-9]{10}$/.test(v.toString());
    },
    message: props => `${props.value} is not a valid phone number!`,
  },
},

email: {
  type: String,
  required:true,
  lowercase: true,
  trim: true,
  match: [
    /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
    "Please fill a valid email address",
  ],
},

}, { timestamps: true });


export const PostJob = mongoose.model("PostJob", postJob);
