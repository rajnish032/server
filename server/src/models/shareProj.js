import mongoose, { Schema } from "mongoose";
		
const shareProj = new mongoose.Schema({
    userId:{
        type: Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
	title:{
		type: String,
		required: true,
	},
    location:{
        type: String,
		required: true,
    },
    // tag:{
    //     type: String,
	// 	 required: true,
    // },
    startDate:{
        type: Date,
		required: true,
    },
    type:{
        type: String,
		required: true,
    },
    objective:{
        type: String,
		required: true,
    },
    industry:{
        type: String,
		required: true,
    },
    application:{
        type: String,
		required: true,
    },
    tools:{
        type: String,
		required: true,
    },
    scope:{
        type: String,
		required: true,
    },
    rangeCovered:{
        type: Number,
		required: true,
    },
    endDate:{
        type: Date,
		required: true,
    },
    fileUrl:{
        type:String
    },

    budget:{
        type: Number,
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
    // timeline:{
    //     type: String,
    //     required: true,

    // },
    // status:{
    //     type:String,
    //     enum:['ongoing','completed'],
	// 	required: true,
    // },

    status: {
        type: String,
        enum: ['approved', 'rejected', 'pending', "review"],
        default: 'pending',
    },
    
   

},{timestamps:true})

export const ShareProj = mongoose.model('ShareProj',shareProj);