import { Schema, model } from "mongoose";

const projectSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    projects: [{
        clientName: {
            type: String,
            required: true
        },
        projectTitle: {
            type: String,
            required: true
        },
        projectDesc: {
            type: String,
            required: true
        },
        industry: {
            type: String,
            required: true
        },
        application: {
            type: String,
            required: true
        },
        projectScope: {
            type: String,
            required: true
        },
        equipmentModels: {
            type: String,
            required: true
        },
        startMon: {
            type: String,
            required: true
        },
        endMon: {
            type: String,
            required: true
        },

        image: {
            type: String,
            // required:true
        },
        fileId:{
            type:String,
            // required:true
            
        }
    }],
 

});

const ProjectDetail = model("ProjectDetail", projectSchema)

export default ProjectDetail;