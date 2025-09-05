

import mongoose from "mongoose"		
const equipmentSchema = new mongoose.Schema({
	name:{
		type: String,
		required: true,
		max:40,
	},
	equipmentId:{
		type:String,
		default:'',
		required:true,
	},
	status:{
		type:String,
		default:'Available'
	},
	image:{
		type:String,
		default:'',
	},
	ownerName:{
		type:String,
		default:''
	},
	userId:{
		type:mongoose.Schema.Types.ObjectId,
		ref:"User",
		required:true
	},
	
	},
	{
		timestamps:true,
	}
)


export const Equipment = mongoose.model("Equipment",equipmentSchema)




