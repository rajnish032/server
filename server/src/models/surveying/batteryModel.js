

import mongoose from 'mongoose'		
const batterySchema	=  new mongoose.Schema({
	batteryId:{
		type: String,
		required: true,
		max:40,
	},
	modelName:{
		type:String,
		default:'',
		required:true,
	},
	image:{
		type:String,
		default:'',
		// required:true
	},
	serialId:{
		type:String,
		default:'',
		required:true
	},
	status:{
		type:String,
		default:'',
		required:true
	},
	purchaseDate:{
		type:String,
		default:'',
		required:true
	},
	remarks:{
		type:String,
		default:'',
	},
	lastSurveying:{
		type:String,
		default:'',
	},
	lastUsed:{
		type:String,
		default:'',
	},
	dischargeCycles:{
		type:String,
		default:'',
		required:true
	},
	userId:{
		type:mongoose.Schema.Types.ObjectId,
		ref:"User",
		required:true
	},
	surveyingBattery:{
		type:Boolean,
		default:false
	},
	},
	{
		timestamps:true,
	}
)


export const Battery = mongoose.model("Battery",batterySchema)
