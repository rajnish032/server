import { asyncHandler } from "../utils/asyncHandler.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import otpGenerator from "otp-generator";
import Admin from "../models/admin.model.js";
import sendEmail from "../service/sendMail.js";
import mongoose from "mongoose";
import User from "../models/userSchema.js";


const Login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email: email });
    if (!admin) {
      return res.status(401).json({
        message: "Credentials are incorrect",
      });
    }

    if (!admin.password)
      return res
        .status(401)
        .json({ message: "Kindly Create or reset your account" });

    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
      return res.status(401).json({
        message: "Credentials are incorrect",
      });
    }

    const token = jwt.sign(
      { _id: admin._id, email: admin.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "1w",
      }
    );

    res.status(200).json({
      token: token,
      message: "Login successful",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

const verifyAdminAuth = asyncHandler(async (req, res, next) => {
  const token =
  req.headers.adauth ||
  (req.headers.cookie && req.headers.cookie.split("adauth=")[1]);
  
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded._id).select("-password");

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    req.admin = admin;

    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Unauthorized" });
  }
});

const defaultAdminEmail = process.env.ADMIN_EMAIL; //admin mail

const resetPassword = asyncHandler(async (req, res) => {
  const { email, newpassword } = req.body;

  try {
    if (email !== defaultAdminEmail)
      return res.status(400).json({ message: "Something went wrong." });

    const existingAdmin = await Admin.findOne({ email: defaultAdminEmail });

    if (!existingAdmin) {
      if (email !== defaultAdminEmail) {
        return res.status(400).json({
          message: "Email does not match the allowed email for admin creation",
        });
      }
      const admin = new Admin({ email: defaultAdminEmail });
      await admin.save();
    }

    const generatedEmailOTP = otpGenerator.generate(6, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });

    await sendEmail({
      from: "Aero2Astro Tech <tech@aero2astro.com> ",
      to: defaultAdminEmail,
      subject: `Aero2Astro Admin credentials Reset OTP code: ${generatedEmailOTP}`,
      text: `Your credentials Reset OTP code: ${generatedEmailOTP}\nIt is valid for 5 minutes only.`,
      html: `<html lang="en">
            <head>
                
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                        margin: 0;
                        padding: 0;
                    }
                    .email-container {
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        padding: 20px;
                        border: 1px solid #e0e0e0;
                    }
                    .header {
                        text-align: center;
                        background-color: #23a3df;
                        color: #ffffff;
                        padding: 20px;
                        border-bottom: 3px solid #1a83b5;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 24px;
                    }
                    .content {
                        padding: 20px;
                        color: #333333;
                    }
                    .content h2 {
                        color: #23a3df;
                    }
                    .content p {
                        line-height: 1.6;
                    }
                    .otp {
                        display: inline-block;
                        background-color: #23a3df;
                        color: #ffffff;
                        padding: 10px 20px;
                        font-size: 20px;
                        margin: 20px 0;
                        border-radius: 5px;
                    }
                    .footer {
                        text-align: center;
                        padding: 10px;
                        color: #777777;
                        border-top: 1px solid #e0e0e0;
                    }
                    .footer a {
                        color: #23a3df;
                        text-decoration: none;
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <h1>AERO2ASTRO Tech</h1>
                    </div>
                    <div class="content">
                        <h2>Credentials Reset OTP from ${email}</h2>
                        <p>
                            We received a request to reset the credentials from ${email} for your account of onboarding dashboard. To proceed with the password reset, please use the following One-Time Password (OTP):
                        </p>
                        <div class="otp">
                            ${generatedEmailOTP}
                        </div>
                        <p>
                            Please enter this OTP in the password reset form to continue. This OTP is valid for the next 5 minutes.
                        </p>
                        <p>
                            If you did not request a password reset, please ignore this email. Your password will remain unchanged.
                        </p>
                        <p>
                            Best regards,<br>
                            The AERO2ASTRO Tech Team
                            <a href="mailto:flywithus@aero2astro.com">flywithus@aero2astro.com</a>
            
                        </p>
                    </div>
                    <div class="footer">
                        <p>
                            &copy; 2024 AERO2ASTRO Tech. All rights reserved.<br>
                            <a href="mailto:flywithus@aero2astro.com">flywithus@aero2astro.com</a>
                        </p>
                    </div>
                </div>
            </body>
            </html>
            `,
    });

    const token = jwt.sign(
      {
        email: email,
        newpassword: newpassword,
        otp: generatedEmailOTP,
        otpExpires: new Date(Date.now() + 5 * 60 * 1000),
      },
      process.env.JWT_SECRET,
      { expiresIn: "5m" }
    );

    res
      .status(200)
      .json({ token: token, message: "Verification code sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

const verifyResetPasswordOtp = asyncHandler(async (req, res) => {
  const { otp } = req.body;

  const token =
    req.headers.adreset ||
    (req.headers.cookie && req.headers.cookie.split("adreset=")[1]);

  if (!token) {
    return res.status(401).json({ message: "Session Expired or Invalid" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) return res.status(401).json({ message: "Invalid Session" });

    const isOTPValid =
      parseInt(decoded.otp) === parseInt(otp) &&
      decoded.otpExpires > Date.now().toLocaleString();
    if (isOTPValid) {
      const admin = await Admin.findOne({ email: decoded.email });

      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      const hashedPassword = await bcrypt.hash(decoded.newpassword, 10);

      admin.password = hashedPassword;
      await admin.save();

      const token = jwt.sign(
        { _id: admin._id, email: admin.email },
        process.env.JWT_SECRET,
        {
          expiresIn: "1w",
        }
      );

      return res
        .status(200)
        .json({ token: token, message: "Password reset successful" });
    } else {
      return res.status(400).json({ message: "Invalid OTP or expired" });
    }
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Unauthorized" });
  }
});

const getAdminDetail = asyncHandler(async (req, res) => {
  const admin = req.admin;
  if (!admin) return res.status(401);

  res.status(200).json({ admin });
});

// handle approval
export const handleSurveyingApproval = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existedUser = await User.findById(id);
  if (!existedUser) return res.status(404).json({ message: "User not exist" });
  if (existedUser.status === "approved")
    return res.status(400).json({ message: "User already approved" });
  if (existedUser.status === "rejected")
    return res.status(400).json({ message: "User is rejected" });

  if (existedUser.status === "review") {
    existedUser.status = "approved";
  }
  const formattedName = existedUser.fullName.replace(/\s+/g, "-");
  const approvedCount = await User.countDocuments({ status: "approved" });
  existedUser.uniqueId = `${formattedName}-${approvedCount + 1}`;
  await existedUser.save();

  await sendEmail({
    from: "Aero2Astro Tech <tech@aero2astro.com> ",
    to: existedUser.email,
    subject: `Approval for ${existedUser.fullName} `,
    text: `Congratulations! ${existedUser.fullName} You have been approved by Aero2astro for the surveying partnership with us`,
    html: `<html lang="en">
<head>
    
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border: 1px solid #e0e0e0;
        }
        .header {
            text-align: center;
            background-color: #23a3df;
            color: #ffffff;
            padding: 20px;
            border-bottom: 3px solid #1a83b5;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 20px;
            color: #333333;
        }
        .content h2 {
            color: #23a3df;
        }
        .content p {
            line-height: 1.6;
        }
        .otp {
            display: inline-block;
            background-color: #23a3df;
            color: #ffffff;
            padding: 10px 20px;
            font-size: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .footer {
            text-align: center;
            padding: 10px;
            color: #777777;
            border-top: 1px solid #e0e0e0;
        }
        .footer a {
            color: #23a3df;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Congratulations ${existedUser.fullName}</h1>
        </div>
        <div class="content">
            <p>
                Dear ${existedUser.fullName},
            </p>
            <p>
                We are glad to inform you that your application for the Surveying  partnership with aero2astro has been approved.
            </p>
            
            <p>
                You can now manage your profile and portfolio/ equipment assets by logging in to the  Surveying Portfolio management System with the same credentials for free.
            </p>
             
            <p>
                Best regards,<br>
                The AERO2ASTRO Tech Team
                <a href="mailto:flywithus@aero2astro.com">flywithus@aero2astro.com</a>

            </p>
        </div>
        <div class="footer">
            <p>
                &copy; 2024 AERO2ASTRO Tech. All rights reserved.<br>
                <a href="mailto:flywithus@aero2astro.com">flywithus@aero2astro.com</a>
            </p>
        </div>
    </div>
</body>
</html>
`,
  });

  return res.status(200).json({ message: " Surveyor has been approved" });
});

// handle rejection
export const handleSurveyingRejection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existedUser = await User.findById(id);
  if (!existedUser) return res.status(404).json({ message: "User not exist" });
  if (existedUser.status === "rejected")
    return res.status(400).json({ message: "User already rejected" });

  if (existedUser.status === "review") {
    existedUser.status = "rejected";
  }
  await existedUser.save();
  await sendEmail({
    from: "Aero2Astro Tech <tech@aero2astro.com>",
    to: existedUser.email,
    subject: `Update on Your Equipment Surveying Partnership Application`,
    text: `Dear ${existedUser.fullName}, we regret to inform you that your application for the surveying equipment partnership with Aero2Astro was not approved at this time.`,
    html: `<html lang="en">
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .email-container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    padding: 20px;
                    border: 1px solid #e0e0e0;
                }
                .header {
                    text-align: center;
                    background-color: #d9534f;
                    color: #ffffff;
                    padding: 20px;
                    border-bottom: 3px solid #b52b27;
                }
                .header h1 {
                    margin: 0;
                    font-size: 24px;
                }
                .content {
                    padding: 20px;
                    color: #333333;
                }
                .content h2 {
                    color: #d9534f;
                }
                .content p {
                    line-height: 1.6;
                }
                .footer {
                    text-align: center;
                    padding: 10px;
                    color: #777777;
                    border-top: 1px solid #e0e0e0;
                }
                .footer a {
                    color: #23a3df;
                    text-decoration: none;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <h1>Partnership Application Update</h1>
                </div>
                <div class="content">
                    <p>Dear ${existedUser.fullName},</p>
                    <p>
                        Thank you for your interest in partnering with Aero2Astro as a Surveying. We truly appreciate the time and effort you invested in your application.
                    </p>
                    <p>
                        After careful evaluation, we regret to inform you that we are unable to proceed with your partnership request at this time. This decision is based on our current requirements and operational constraints, and does not reflect on your skills or potential.
                    </p>
                    <p>
                        We encourage you to stay in touch with us for future collaboration opportunities. If you have any questions or would like to explore alternative ways to work with us, please feel free to reach out.
                    </p>
                    <p>
                        Best regards,<br>
                        The AERO2ASTRO Tech Team<br>
                        <a href="mailto:flywithus@aero2astro.com">flywithus@aero2astro.com</a>
                    </p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 AERO2ASTRO Tech. All rights reserved.<br>
                        <a href="mailto:flywithus@aero2astro.com">flywithus@aero2astro.com</a>
                    </p>
                </div>
            </div>
        </body>
        </html>`,
  });

  return res.status(200).json({ message: "Surveyor has been Rejected" });
});

//handle Edit access
export const handleEnablingEdit = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existedUser = await User.findById(id);
  if (!existedUser) return res.status(404).json({ message: "User not exist" });
  if (existedUser.status === "pending")
    return res.status(400).json({ message: "User already Have Access" });

  if (existedUser.status === "review") {
    existedUser.status = "pending";
    existedUser.isApplied = false;
  }
  await existedUser.save();
  await sendEmail({
    from: "Aero2Astro Tech <tech@aero2astro.com>",
    to: existedUser.email,
    subject: `Action Required: Complete Your Profile and Reapply for Approval`,
    text: `Dear ${existedUser.fullName}, some details are missing from your profile. We have granted you permission to edit your profile. Please update the missing information accurately and apply for approval again.`,
    html: `<html lang="en">
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .email-container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    padding: 20px;
                    border: 1px solid #e0e0e0;
                }
                .header {
                    text-align: center;
                    background-color: #f0ad4e;
                    color: #ffffff;
                    padding: 20px;
                    border-bottom: 3px solid #ec971f;
                }
                .header h1 {
                    margin: 0;
                    font-size: 24px;
                }
                .content {
                    padding: 20px;
                    color: #333333;
                }
                .content h2 {
                    color: #f0ad4e;
                }
                .content p {
                    line-height: 1.6;
                }
                .button {
                  display: inline-block;
                  padding: 12px 24px;
                  background-color: #5cb85c;
                  color: white;
                  text-decoration: none;
                  border-radius: 4px;
                  margin-top: 10px;
              }
                .footer {
                    text-align: center;
                    padding: 10px;
                    color: #777777;
                    border-top: 1px solid #e0e0e0;
                }
                .footer a {
                    color: #23a3df;
                    text-decoration: none;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <h1>Update Your Profile and Reapply</h1>
                </div>
                <div class="content">
                    <p>Dear ${existedUser.fullName},</p>
                    <p>
                        We noticed that some important details are missing from your profile. To proceed with your application, you need to update the missing information.
                    </p>
                    <p>
                        We have granted you permission to edit your profile. Please ensure that all the required fields are accurately filled out and submit your application for approval again.
                    </p>
                    <p>
                        To update your profile, click the button below:
                    </p>
                    <p>
                        <a href="https://aero2-astro-data-processing.vercel.app/user/profile" class="button">Edit Your Profile</a>
                    </p>
                    <p>
                        If you have any questions or need assistance, feel free to contact us at <a href="mailto:flywithus@aero2astro.com">flywithus@aero2astro.com</a>.
                    </p>
                    <p>
                        Best regards,<br>
                        The AERO2ASTRO Tech Team<br>
                    </p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 AERO2ASTRO Tech. All rights reserved.<br>
                        <a href="mailto:flywithus@aero2astro.com">flywithus@aero2astro.com</a>
                    </p>
                </div>
            </div>
        </body>
    </html>`,
  });

  return res.status(200).json({ message: "Surveyor has been Rejected" });
});

//suspension
export const handleSurveyingSuspension = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existedUser = await User.findById(id);
  if (!existedUser) return res.status(404).json({ message: "User not exist" });
  if (existedUser?.isSuspended === true)
    return res.status(400).json({ message: "User already Suspended" });

  if (existedUser.status !== "approved")
    return res.status(400).json({ message: "User is not Approved " });

  if (existedUser.status === "approved") {
    existedUser.isSuspended = true;
  }
  await existedUser.save();
  await sendEmail({
    from: "Aero2Astro Tech <tech@aero2astro.com>",
    to: existedUser.email,
    subject: "Important Update: Account Suspension Notification",
    text: `Dear ${existedUser.fullName}, we regret to inform you that your Aero2Astro account has been suspended due to a policy violation or other concerns. Please review the details in the email and contact us if you have any questions.`,
    html: `<html lang="en">
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #f4f4f4;
                            margin: 0;
                            padding: 0;
                        }
                        .email-container {
                            max-width: 600px;
                            margin: 0 auto;
                            background-color: #ffffff;
                            padding: 20px;
                            border: 1px solid #e0e0e0;
                        }
                        .header {
                            text-align: center;
                            background-color: #d9534f;
                            color: #ffffff;
                            padding: 20px;
                            border-bottom: 3px solid #b52b27;
                        }
                        .header h1 {
                            margin: 0;
                            font-size: 24px;
                        }
                        .content {
                            padding: 20px;
                            color: #333333;
                        }
                        .content h2 {
                            color: #d9534f;
                        }
                        .content p {
                            line-height: 1.6;
                        }
                        .footer {
                            text-align: center;
                            padding: 10px;
                            color: #777777;
                            border-top: 1px solid #e0e0e0;
                        }
                        .footer a {
                            color: #23a3df;
                            text-decoration: none;
                        }
                    </style>
                </head>
                <body>
                    <div class="email-container">
                        <div class="header">
                            <h1>Account Suspension Notice</h1>
                        </div>
                        <div class="content">
                            <p>Dear ${existedUser.fullName},</p>
                            <p>
                                We regret to inform you that your Aero2Astro account has been suspended due to a violation of our policies or other concerns requiring further review.
                            </p>
                            <p>
                                If you believe this suspension was made in error or wish to appeal, please contact our support team for further clarification.
                            </p>
                            <p>
                                For assistance, reach out to us at <a href="mailto:flywithus@aero2astro.com">flywithus@aero2astro.com</a>.
                            </p>
                            <p>
                                Best regards,<br>
                                The AERO2ASTRO Tech Team<br>
                                <a href="mailto:flywithus@aero2astro.com">flywithus@aero2astro.com</a>
                            </p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2024 AERO2ASTRO Tech. All rights reserved.<br>
                                <a href="mailto:flywithus@aero2astro.com">flywithus@aero2astro.com</a>
                            </p>
                        </div>
                    </div>
                </body>
            </html>`,
  });

  return res.status(200).json({ message: "Surveyor has been Suspended" });
});

//suspension Removal
export const handleSurveyingRevokeSuspension = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existedUser = await User.findById(id);
  if (!existedUser) return res.status(404).json({ message: "User not exist" });
  if (!existedUser?.isSuspended || existedUser?.isSuspended != true)
    return res.status(400).json({ message: "User is not Suspended" });

  if (existedUser.status !== "approved")
    return res.status(400).json({ message: "User is not Approved " });

  if (existedUser.status === "approved") {
    existedUser.isSuspended = false;
  }
  await existedUser.save();
  await sendEmail({
    from: "Aero2Astro Tech <tech@aero2astro.com>",
    to: existedUser.email,
    subject: "Good News: Account Suspension Revoked",
    text: `Dear ${existedUser.fullName}, we are pleased to inform you that your Aero2Astro account suspension has been lifted. You can now access your account as usual. If you have any questions, feel free to contact us.`,
    html: `<html lang="en">
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #f4f4f4;
                            margin: 0;
                            padding: 0;
                        }
                        .email-container {
                            max-width: 600px;
                            margin: 0 auto;
                            background-color: #ffffff;
                            padding: 20px;
                            border: 1px solid #e0e0e0;
                        }
                        .header {
                            text-align: center;
                            background-color: #28a745;
                            color: #ffffff;
                            padding: 20px;
                            border-bottom: 3px solid #218838;
                        }
                        .header h1 {
                            margin: 0;
                            font-size: 24px;
                        }
                        .content {
                            padding: 20px;
                            color: #333333;
                        }
                        .content h2 {
                            color: #28a745;
                        }
                        .content p {
                            line-height: 1.6;
                        }
                        .footer {
                            text-align: center;
                            padding: 10px;
                            color: #777777;
                            border-top: 1px solid #e0e0e0;
                        }
                        .footer a {
                            color: #23a3df;
                            text-decoration: none;
                        }
                    </style>
                </head>
                <body>
                    <div class="email-container">
                        <div class="header">
                            <h1>Account Suspension Revoked</h1>
                        </div>
                        <div class="content">
                            <p>Dear ${existedUser.fullName},</p>
                            <p>
                                We are pleased to inform you that after review, your Aero2Astro account suspension has been lifted.
                            </p>
                            <p>
                                You can now access your account as usual. If you experience any issues logging in, please don't hesitate to reach out to our support team.
                            </p>
                            <p>
                                For assistance, contact us at <a href="mailto:flywithus@aero2astro.com">flywithus@aero2astro.com</a>.
                            </p>
                            <p>
                                Best regards,<br>
                                The AERO2ASTRO Tech Team<br>
                                <a href="mailto:flywithus@aero2astro.com">flywithus@aero2astro.com</a>
                            </p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2024 AERO2ASTRO Tech. All rights reserved.<br>
                                <a href="mailto:flywithus@aero2astro.com">flywithus@aero2astro.com</a>
                            </p>
                        </div>
                    </div>
                </body>
            </html>`,
  });

  return res.status(200).json({ message: "Surveyor Suspension had been Revoked" });
});

//verify data
export const handleDataVerified = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existedUser = await User.findById(id);
  if (!existedUser) return res.status(404).json({ message: "User not exist" });
  if (existedUser?.dataVerified || existedUser?.dataVerified === true)
    return res.status(400).json({ message: "Already Verified" });

  if (existedUser.status !== "approved")
    return res.status(400).json({ message: "User is not Approved " });

  if (existedUser.status === "approved") {
    existedUser.dataVerified = true;
  }
  await existedUser.save();
  await sendEmail({
    from: "Aero2Astro Tech <tech@aero2astro.com>",
    to: existedUser.email,
    subject: "Congratulations: Your Account Has Been Verified",
    text: `Dear ${existedUser.fullName}, congratulations! Your Aero2Astro account has been successfully verified. You can now access all features and share your profile with others to showcase your skills. If you have any questions, feel free to reach out to us at flywithus@aero2astro.com.`,
    html: `<html lang="en">
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border: 1px solid #e0e0e0;
          }
          .header {
            text-align: center;
            background-color: #007bff;
            color: #ffffff;
            padding: 20px;
            border-bottom: 3px solid #0056b3;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 20px;
            color: #333333;
          }
          .content h2 {
            color: #007bff;
          }
          .content p {
            line-height: 1.6;
          }
          .footer {
            text-align: center;
            padding: 10px;
            color: #777777;
            border-top: 1px solid #e0e0e0;
          }
          .footer a {
            color: #23a3df;
            text-decoration: none;
          }
          .btn {
            display: inline-block;
            margin-top: 15px;
            padding: 10px 20px;
            background-color: #007bff;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 5px;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>Account Verified Successfully</h1>
          </div>
          <div class="content">
            <p>Dear ${existedUser.fullName},</p>
            <p>
              We are excited to let you know that your Aero2Astro account has been successfully verified!
            </p>
            <p>
              You now have full access to all features and services on our platform. Even better — you can now share your verified profile and let the world see your talent and skills.
            </p>
            <p>
              Show your credibility, build your network, and unlock new opportunities by sharing your Aero2Astro profile.
            </p>
            <a href="https://aero2-astro-data-processing.vercel.app/public/${existedUser?.uniqueId}" class="btn">Share Your Profile</a>
            <p style="margin-top: 20px;">
              If you have any questions or need assistance, feel free to reach out to us anytime at 
              <a href="mailto:flywithus@aero2astro.com">flywithus@aero2astro.com</a>.
            </p>
            <p>
              Best regards,<br>
              The AERO2ASTRO Tech Team<br>
              <a href="mailto:flywithus@aero2astro.com">flywithus@aero2astro.com</a>
            </p>
          </div>
          <div class="footer">
            <p>&copy; 2024 AERO2ASTRO Tech. All rights reserved.<br>
            <a href="mailto:flywithus@aero2astro.com">flywithus@aero2astro.com</a></p>
          </div>
        </div>
      </body>
    </html>`,
  });
  

  return res.status(200).json({ message: "Surveyor Suspension had been Revoked" });
});

//send mail
export const sendEmails = asyncHandler(async (req, res) => {
  const users = await User.find({ status: "pending" });
  if (users.length === 0) {
    return res.status(200).json({ message: "No pending surveyor found." });
  }
  const userEmails = users.map((user) => user.email);
  await sendEmail({
    from: "Aero2Astro Tech <tech@aero2astro.com>",
    bcc: userEmails,
    subject: "Complete Application for Surveyor Approval",
    html: ` <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reminder: Complete Application for Surveyor  Approval</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f9f9f9;
          margin: 0;
          padding: 0;
        }
        .email-container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          border: 1px solid #ddd;
        }
        .header {
          text-align: center;
          background-color: #0056b3;
          color: #ffffff;
          padding: 20px;
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
        }
        .header h1 {
          margin: 0;
          font-size: 22px;
        }
        .content {
          padding: 20px;
          color: #333333;
          text-align: center;
        }
        .content p {
          line-height: 1.6;
          font-size: 16px;
        }
        .cta-button {
          display: inline-block;
          margin-top: 15px;
          padding: 12px 20px;
          font-size: 16px;
          color: #ffffff;
          background-color: #28a745;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          transition: background 0.3s ease-in-out;
        }
        .cta-button:hover {
          background-color: #218838;
        }
        .footer {
          text-align: center;
          padding: 15px;
          font-size: 12px;
          color: #777777;
          border-top: 1px solid #ddd;
          background-color: #f1f1f1;
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
        }
        .footer a {
          color: #0056b3;
          text-decoration: none;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>Reminder: Complete Application for Surveying  Approval</h1>
        </div>
        <div class="content">
          <p>Dear Surveyors,</p>
          <p>We noticed that you have registered but have not applied for approval.</p>
          <p>To complete your approval process, please click the button below:</p>
          <a href="https://aero2-astro-data-processing.vercel.app/gis/login" class="cta-button">Apply for Approval</a>
          <p>If you have already applied, please disregard this message.</p>
          <p>Best regards,<br><strong>Aero2Astro Team</strong></p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Aero2Astro. All rights reserved.</p>
          <p><a href="mailto:flywithus@aero2astro.com">flywithus@aero2astro.com</a></p>
        </div>
      </div>
    </body>
    </html>
    `,
  });
  res.status(200).json({ message: `Emails sent to ${users.length} surveying.` });
});


export {
  Login,
  getAdminDetail,
  verifyAdminAuth,
  resetPassword,
  verifyResetPasswordOtp,
};
