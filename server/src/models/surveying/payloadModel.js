import mongoose from 'mongoose';

const payloadSchema = mongoose.Schema({
    payloads: [{
        type: String
    }],
    userId:{
		type:mongoose.Schema.Types.ObjectId,
		ref:"User",
		required:true
	},
})		

 export const Payload = mongoose.model('Payload',payloadSchema)