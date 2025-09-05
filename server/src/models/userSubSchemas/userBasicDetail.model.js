import { Schema, model } from "mongoose";


const userBasicDetail = new Schema({
   
  
    gender:
    { 
        type: String,
        required: true
    },
    age:
    {
        type: Number,
        required: true
    },
    dob: {
        type: String,
        required: true
    },

    alternatePhone: {
        number: {
            type: String,
            default:"N/A",

            validate: {
                validator: function (v) {
                    return v === "N/A" || /^\d{10}$/.test(v);
                },
                message: props => `${props.value} is not a valid phone number!`
            }
        },
        countryCode: {
            type: String,
            default: "+91"

        },
    },


    serviceAreas: [{
        region: {
            type: String,
            required: true
        },
        states: [{
            type: String,
            required: true
        }]
    }],

    serviceRange: {
        type: Number,
        required: true
    },
    availability:[{
        type: String,
        required: true
    }]


})


export default userBasicDetail;