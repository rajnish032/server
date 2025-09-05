import mongoose, { Schema } from "mongoose"
const surveyingLogs = new mongoose.Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    flightName: {
        type: String,
        required: true,
        trim: true
    },
    project: {
        type: Schema.Types.ObjectId,
        ref: "SurveyingProject",
        required: true,
    },

    location: {
        type: String,
        required: true,
        trim: true
    },
    flightDate: {
        type: Date,
        required: true,
    },
    duration: {
        hr: {
            type: Number,
            required: true,
            default: 0
        },
        min: {
            type: Number,
            required: true,
            default: 0
        },
        sec: {
            type: Number,
            required: true,
            default: 0
        },

    },
    rangeCovered:{
        type: Number,
        required: true,
    },
    flightType: {
        type: String,
        required: true,
    },
    remark: {
        type: String,
        // required: true,
    },
    flightDistance:{
        type:String
    },
    totalFlyTime:{
        type:String
    },
    //new field projectType(Manual and autonomous) 
    projectType:{
        type:String,
        enum: ["Manual", "Autonomous"]
        
    }

}, { timestamps: true });

export const SurveyingLog = mongoose.model('SurveyingLog', surveyingLogs);