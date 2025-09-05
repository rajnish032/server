import "dotenv/config";
import {app} from "./app.js";
import dbConnect from "./config/dbConnect.js";


dbConnect()
.then(()=>app.listen(process.env.PORT||8000))
.catch((err)=>console.log("Error in Listening",err)); 