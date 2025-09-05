import { Schema, model } from "mongoose";

const licenseSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    licenses: [
        {
            licenseName: {
                type: String,
                required:true
            },
            surveyingName:{
                type: String,
                required:true
            },
            classUas:{
                type: String,
                required: true
            },
            licenseNumber: {
                type: String,
                required:true
            },
            dateOfIssuance: {
                type: String,
                required:true
           
            },
            image: {
                type: String,
                required:true
            },
            fileId:{
                type:String,
                required:true
                
            }
        }
    ]

});

const Licenses = model("Licenses",licenseSchema);


export default Licenses;
