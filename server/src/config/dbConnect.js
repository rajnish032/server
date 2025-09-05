import mongoose from "mongoose"
const MONGO_DB_URI = process.env.MONGO_DB_URI;
const dbConnect = async()=>{
    try {
       await mongoose.connect(MONGO_DB_URI+"/surveying")
       .then(()=>console.log("Connected to the DataBase"))
       .catch((err)=>console.log("Error in connecting database",err))
    } catch (error) {
        console.log(error);
    }
}

export default dbConnect;