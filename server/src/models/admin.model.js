import { Schema, model } from "mongoose";

const adminSchema = new Schema({
    email:{
        type:String,
        default:`${process.env.ADMIN_EMAIL}`,
        unique:true,
        required:true
    },
    username:{
        type:String,
        default:'Ted Solomon'
    },
    avatar:{
        type:String,
    },
    fileId:{
        type:String,
    },
    password:{
        type:String,
        // required:true
    }

},{timestamps:true})

const Admin = model("Admin",adminSchema);
export default Admin;