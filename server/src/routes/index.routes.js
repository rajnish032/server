import express from "express";
import {
  generateAndSendEmailOTP,
  generateAndSendForgotPasswordOTP,
  generateAndSendPhoneOTP,
  getUser,
  registerationConfirmationMail,
  resendEmailOTP,
  resendPhoneOTP,
  updateAvatar,
  updatePassword,
  userLogin,
  userRegister,
  verifyEmailOTP,
  verifyForgotPassOTP,
  verifyPhoneOTP,
  verifySession,
} from "../controllers/user.controller.js";
import {
  Login,
  getAdminDetail,
  resetPassword,
  verifyAdminAuth,
  verifyResetPasswordOtp,
} from "../controllers/admin.controller.js";
import verifyUserJwt from "../middlewares/verifyUserJwt.js";
import axios from "axios";

import sendEmail from "../service/sendMail.js";
import { getAllUserLocations } from "../controllers/userfetch.controller.js";
const router = express.Router();

router.post("/user/register", userRegister);
router.post("/notification/confirmation", registerationConfirmationMail);
router.post("/user/login", userLogin);
router.get("/user/verifysession", verifySession);
router.get("/user/get", verifyUserJwt, getUser);

router.post("/user/sendEmailOTP", generateAndSendEmailOTP);
router.post("/user/verifyEmail", verifyEmailOTP);
router.post("/user/resendEmail", resendEmailOTP);

router.post("/user/forgot/password", generateAndSendForgotPasswordOTP);
router.post("/user/verify/forgot/otp", verifyForgotPassOTP);
router.post("/user/password/update", updatePassword);

router.post("/user/sendPhoneOTP", generateAndSendPhoneOTP);
router.post("/user/verifyPhone", verifyPhoneOTP);
router.post("/user/resendPhoneOTP", resendPhoneOTP);

router.get("/admin/detail", verifyAdminAuth, getAdminDetail);
router.post("/admin_login", Login);
router.post("/verify/admin", verifyResetPasswordOtp);
router.post("/reset/admin/password", resetPassword);
router.get("/locations", getAllUserLocations);


router.get("/pincode/:value", async (req, res) => {
  const { value } = req.params;

  try {
    const postalResponse = await axios.get(
      `https://api.postalpincode.in/pincode/${value}`
    );

    if (!postalResponse.data || postalResponse.data[0].Status !== "Success") {
      return res.status(400).json({ message: "Invalid pincode" });
    }

    const postalData = postalResponse.data[0];
    const { PostOffice } = postalData;

     const geoResponse = await axios.get(
      `https://nominatim.openstreetmap.org/search?postalcode=${value}&country=India&format=json`,
      {
        headers: {
          'User-Agent': 'Aero2Astro (aero2astrotech@gmail.com)',
        },
      }
    );

    let latitude = null;
    let longitude = null;
    if (geoResponse.data.length > 0) {
      latitude = parseFloat(geoResponse.data[0].lat);
      longitude = parseFloat(geoResponse.data[0].lon);
    }

    const result = {
      pincode: value,
      status: postalData.Status,
      postOffices: PostOffice || [],
      coordinates: {
        lat: latitude || null,
        lon: longitude || null,
      },
    };

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching pincode details:", error.message);
    res.status(500).json({ message: "Failed to fetch pincode details" });
  }
});

router.get("/healthCheck", async (req, res) => {
  try {
    // email
    const emailInfo = await sendEmail({
      from: "Aero2Astro Tech <tech@aero2astro.com>",
      to: "flywithus@aero2astro.com", 
      subject: "Health Check: Email OK",
      text: "This is a test email to verify uptime monitoring.",
    });
    console.log(emailInfo)

    if (!emailInfo || !emailInfo.messageId) {
      return res.status(500).json({ message: "Email sending failed" });
    }
    return res.status(200).send("Email Service Working");

  } catch (err) {
    console.error("Health check failed:", err.message);
    return res.status(500).send("Health check failed");
  }
});




export default router;
