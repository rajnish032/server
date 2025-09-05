import User from "../models/userSchema.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";

const verifyUserJwt = asyncHandler(async (req, res,next) => {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Unauthorized header" });
    }

    const token = authorizationHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized request" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded._id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "user not found" });
        }
        req.user = user;
        

        next();

    } catch (error) {
        res.status(401).json({ message: error?.message || "Invalid access Token" });
    }
});

export default verifyUserJwt;
