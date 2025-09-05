import { Schema, model } from "mongoose";

const skillsSchema = new Schema({


    equipmentTypesCanHandle: [
        {
            type: String,
            
        }
    ],
    
    hardwareSkills: [
        {
            type: String,
        }
    ],
    softwareSkills: [
        {
            type: String,
        }
    ],
});


export default skillsSchema;