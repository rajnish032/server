import expressAsyncHandler from "express-async-handler";
import User from "../models/userSchema.js";
import jwt from "jsonwebtoken"
import { deleteImage, uploadImage } from "../utils/imagekit.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import MailChecker from 'mailchecker';
import otpGenerator from "otp-generator"
import sendEmail from "../service/sendMail.js";
//import otpless from "otpless-node-js-auth-sdk"
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import axios from "axios"

const userLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and Password are required" });
    }

    const user = await User.findOne({ email });


    if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password)


    if (!isMatch) {
        return res.status(401).json({ message: "Incorrect email or password" });
    }

    const payload = {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        status: user.status,
        isSuspended:user.isSuspended||false
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });


    return res.status(200).json({
        message: "Login successful",
        user: payload,
        token: token
    });
});

const userRegister = asyncHandler(async (req, res) => {
    const { phoneNumber, role, coordinates, city, email, password, state, areaPin, locality, countryCode, fullName } = req.body;

    try {
        const isUserExist = await User.findOne({ 'phone.number': phoneNumber, 'phone.countryCode': countryCode });

        if (isUserExist) {
            return res.status(409).json({
                message: "This User is already registered"
            });
        }
        const existingUserWithEmail = await User.findOne({ email });
        if (existingUserWithEmail) {
            return res.status(409).json({
                message: "This email is already associated with an account"
            });
        }

        const token = req.headers.phoneauth ||  req.headers.cookie.split('phoneAuth=')[1];

        if (!token) {
            return res.status(440).json({ message: "Sorry! Your Session Expired, Kindly Register again." });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return res.status(440).json({ message: "Invalid or Expired Session" });
        }

        if (!decoded.verified || phoneNumber !== decoded.phoneNumber) {
            return res.status(401).json({ message: "Please verify phone" });
        }

        const user = new User({
            role,
            fullName,
            phone: {
                number: phoneNumber,
                countryCode
            },
            coordinates,
            city,
            locality,
            email,
            password,
            areaPin,
            state,
            isPhoneVerified: true,
            isEmailVerified: true
        });

        await user.save();

        const payload = {
            _id: user._id,
            email: user.email,
            fullName: user.fullName
        };

        const Authtoken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });


        await sendEmail({
            from:"Aero2Astro Tech <tech@aero2astro.com> ",
            to: process.env.ADMIN_EMAIL,
            subject: `New User Registration  - ${fullName} has registered for onboarding`,
            text: `${fullName} has registered with phone: ${countryCode} ${phoneNumber}. for the ${role} role from ${city}, ${state}`,
            html: `
            <html lang="en">
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
        .details {
            background-color: #f4f4f4;
            padding: 10px;
            margin: 20px 0;
            border: 1px solid #e0e0e0;
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
            <h2>New User Registration</h2>
            <p>
                Dear Admin,
            </p>
            <p>
                A new user has registered on the AERO2ASTRO Tech platform. Here are the details of the new user:
            </p>
            <div class="details">
                <p><strong>Name:</strong> ${fullName}</p>
                <p><strong>Email:</strong>${email}</p>
                <p><strong>Phone:</strong> ${phoneNumber}</p>
                <p><strong>Role:</strong> ${role}</p>
                <p><strong>Location:</strong> ${locality}</p>
                <p><strong>Pincode:</strong> ${areaPin}</p>
                <p><strong>State:</strong> ${state}</p>
                <p><strong>City:</strong> ${city}</p>
            </div>
            <p>
                Please take the necessary actions as needed.
            </p>
            <p>
                Best regards,<br>
                The AERO2ASTRO Tech Team
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
    
    
            `
        });


        res.status(201).json({ token: Authtoken, user: payload, message: "Registered successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error, Please Try Again!" });
    }
});


export const registerationConfirmationMail = asyncHandler(async (req, res) => {
    const { email, fullName, password } = req.body;
    if (!(email && fullName && password))
        res.status(400)

    await sendEmail({
        from:"Aero2Astro Tech <tech@aero2astro.com> ",
        to: email,
        subject: `Registration Confirmation for ${fullName}`,
        text: `Hello ${fullName}, thank you for registering with Aero2Astro as a dedicated Partner! Kindly visit the Dashboard and complete the Profile Detail then Apply for approval, so that we can confirm and connect to you`,
        html: `
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
    .credentials {
        background-color: #f4f4f4;
        padding: 10px;
        margin: 20px 0;
        border: 1px solid #e0e0e0;
        border-radius: 5px;
    }
    .button {
        display: inline-block;
        background-color: #23a3df;
        color: #ffffff;
        font-weight:600;
        padding: 10px 20px;
        font-size: 16px;
        margin: 20px 0;
        border-radius: 5px;
        text-decoration: none;
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
        <h2>Welcome to AERO2ASTRO Tech!</h2>
        <p>
            Dear ${fullName},
        </p>
        <p>
            Thank you for registering with AERO2ASTRO Tech! We are excited to have you on board.
        </p>
        <p>
            As Aero2astro Surveying Equipment Partner, you now have access to our onboarding platform. We are committed to providing you with the best service and support.
        </p>
        <p>
            Here are your login credentials:
        </p>
        <div class="credentials">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${password}<p>
        </div>
        <p>
            Please login to your dashboard and complete your profile and apply for approval, if already done then kindly ignore and wait for approval:
        </p>
        <p>
            <a href="https://aero2-astro-data-processing.vercel.app/user/dashboard" class="button">Go to Dashboard</a>
        </p>
        <p>
            If you have any questions or need assistance, feel free to contact our support team.
        </p>
        <p>
            Best regards,<br>
            The AERO2ASTRO Tech Team
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

        `

    });


    res.status(200)

})

const verifySession = asyncHandler(async (req, res, next) => {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authorizationHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded._id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "user not found" });
        }
        res.status(200).json({ _id: user._id, fullName: user.fullName, status: user.status, isSuspended:user.isSuspended||false });

    } catch (error) {
        console.error(error);
        res.status(401).json({ message: "Unauthorized" });
    }
});


const getUser = asyncHandler(async (req, res) => {
    const { _id } = req.user;

    if (!_id) {
        return res.status(400).json({ message: "User ID is required" });
    }

    try {
        const user = await User.findById(_id)
            .select('-password')
            .populate('equipmentDetails')
            .populate('projects')
            .populate('licenses')
            .populate('workExp');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        return res.status(500).json({ message: "Server Error. Please try again!" });
    }
});

const generateAndSendEmailOTP = async (req, res) => {
    try {
        const { isPhoneVerified, phoneNumber, email } = req.body;
  
        if (!isPhoneVerified || !phoneNumber) {
           return res.status(400).json({ message: "Kindly verify Phone first" })
        }

        const allowedDomains = [
            "gmail.com", "yahoo.com","outlook.com","outlook.in","microsoft.com", "hotmail.com", "aol.com", "hotmail.co.uk", "hotmail.fr",
            "msn.com", "yahoo.fr", "wanadoo.fr", "orange.fr", "comcast.net", "yahoo.co.uk",
            "yahoo.com.br", "yahoo.co.in", "live.com", "rediffmail.com", "free.fr", "gmx.de",
            "web.de", "yandex.ru"
        ]; 

        if (!email) {
            return res.status(400).json({
                message: "Please provide an email"
            });
        }

        if (!MailChecker.isValid(email)) {
            return res.status(400).json({
                message: "Disposable mail is not allowed"
            });
        }

        const emailDomain = email.split('@')[1];
        if (!allowedDomains.includes(emailDomain)) {
            return res.status(400).json({
                message: "This Email domain is not allowed"
            });
        }

        const existingUserWithEmail = await User.findOne({ email });

        if (existingUserWithEmail) {
            let message = "This email is already associated with an account";
            return res.status(409).json({
                message: message
            });
        }

        const generatedEmailOTP = otpGenerator.generate(6, {
            digits: true,
            lowerCaseAlphabets: false,
            upperCaseAlphabets: false,
            specialChars: false
        });

        const expirationTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
        const hashedOTP = await bcrypt.hash(generatedEmailOTP, 10);
        const token = jwt.sign({ email, expirationTime, hashedOTP }, process.env.JWT_SECRET);

        await sendEmail({
            from:"Aero2Astro Tech <tech@aero2astro.com> ",
            to: email,
            subject: `Aero2Astro Email Verification for ${email}. Your OTP is ${generatedEmailOTP}`,
            text: `Your Email OTP code: ${generatedEmailOTP}\nIt is valid for 5 minutes only. Please use this code to verify your email.`,
            html: `
            <html lang="en">
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
            <h2>Email Verification</h2>
            <p>
                for ${email},
            </p>
            <p>
                Thank you for registering with AERO2ASTRO Tech. To complete your registration, please verify your email address by using the OTP (One-Time Password) provided below:
            </p>
            <div class="otp">
                ${generatedEmailOTP}
            </div>
            <p>
                Please enter this code in the verification form to confirm your email address. This OTP is valid for the next 5 minutes.
            </p>
            <p>
                If you did not request this verification, please ignore this email.
            </p>
            <p>
                Best regards,<br>
                The AERO2ASTRO Tech Team
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
            `
        });

        res.status(200).json({ message: "Check email for OTP", token: token });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server error, please try again!" });
    }
};


const verifyEmailOTP = asyncHandler(async (req, res) => {
    const { otp } = req.body;

    if (!otp) {
        return res.status(400).json({ message: "Please Enter the OTP" });
    }
    const token = req.headers.mailauth || (req.headers.cookie && req.headers.cookie.split('mailAuth=')[1]);

    if (!token) {
        return res.status(400).json({ message: "OTP not found in cookies" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const hashedOTP = decoded.hashedOTP;
        const isMatch = await bcrypt.compare(String(otp), hashedOTP);
        if (!isMatch) {
            return res.status(400).json({ message: "OTP is incorrect" });
        }

        const expirationTime = decoded.expirationTime;
        if (expirationTime < new Date()) {
            return res.status(400).json({ message: "OTP has expired" });
        }


        return res.status(200).json({ isVerified: true, message: "Email verified" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server Error" });
    }
});


const resendEmailOTP = asyncHandler(async (req, res) => {

    if (!req.body.email) {
        return res.status(400).json({ message: "Please provide email" });
    }

    try {
        await generateAndSendEmailOTP(req, res);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server Error aaya" });
    }
});


export const generateAndSendForgotPasswordOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Please provide an email"
            });
        }

        if (!MailChecker.isValid(email)) {
            return res.status(400).json({
                message: "Disposable mail is not allowed"
            });
        }

        const isUser = await User.findOne({ email });

        if (!isUser) {
            return res.status(400).json({ message: "User not found please check the Email and Try Again!" });
        }

        const generatedEmailOTP = otpGenerator.generate(6, {
            digits: true,
            lowerCaseAlphabets: false,
            upperCaseAlphabets: false,
            specialChars: false
        });

        const expirationTime = new Date(Date.now() + 5 * 60 * 1000);
        const hashedOTP = await bcrypt.hash(generatedEmailOTP, 10);
        const token = jwt.sign({ email, expirationTime, hashedOTP }, process.env.JWT_SECRET);



        await sendEmail({
            from:"Aero2Astro Tech <tech@aero2astro.com> ",
            to: email,
            subject: `Forgot Password for ${email} - Your OTP is ${generatedEmailOTP}`,
            text: `Your OTP for resetting the password is: ${generatedEmailOTP}. It is valid for 5 minutes.`,
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
            <h2>Password Reset OTP</h2>
            <p>
                Dear ${isUser.fullName},
            </p>
            <p>
                We received a request to reset the password for your account. To proceed with the password reset, please use the following One-Time Password (OTP):
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
`
        });

     
        res.status(200).json({ message: "Check email for OTP", token: token });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error, please try again!" });
    }
};

export const verifyForgotPassOTP = async (req, res) => {
    try {
        const { otp } = req.body;

        const token = req.headers.forgotauth || (req.headers.cookie && req.headers.cookie.split('forgotAuth=')[1]);

        if (!otp || !token) {
            return res.status(400).json({ message: "OTP is required" });
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        if (Date.now() > decodedToken.expirationTime) {
            return res.status(400).json({ message: "OTP expired. Please try again!" });
        }

        const isOTPValid = await bcrypt.compare(otp, decodedToken.hashedOTP);

        if (!isOTPValid) {
            return res.status(400).json({ message: "Invalid OTP. Please try again!" });
        }

        const changePassToken = jwt.sign(
            { email: decodedToken.email },
            process.env.JWT_SECRET,
            { expiresIn: "10m" }
        );

        res.status(200).json({ message: "OTP verified successfully", token: changePassToken });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error, please try again!" });
    }
};

export const updatePassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const token = req.headers['changepasstoken'];
        if (!token) {
            return res.status(400).json({ message: "Something went wrong kindly contact the support team or Try Again!" });
        }
        if (!token) {
            return res.status(400).json({ message: "Something went wrong kindly contact the support team or Try Again!" });
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        if (!newPassword || !decodedToken.email) {
            return res.status(400).json({ message: "New password and email are required" });
        }

        if (Date.now() > decodedToken.expirationTime) {
            return res.status(400).json({ message: "Token expired. Please try again!" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await User.findOneAndUpdate({ email: decodedToken.email }, { password: hashedPassword });

        res.status(200).json({ message: "Password updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error, please try again!" });
    }
};


// OTP less mobile otp sms service 
//const { sendOTP, verifyOTP, resendOTP } = otpless


const generateAndSendPhoneOTP = asyncHandler(async (req, res) => {
    const { phoneNumber, countryCode } = req.body;
    const WA_PHONE_ID = process.env.WA_PHONE_ID;
    const WA_TOKEN = process.env.WA_TOKEN;
    const isUserExist = await User.findOne({
      "phone.number": phoneNumber,
      "phone.countryCode": countryCode,
    });
  
    if (isUserExist) {
      if (!isUserExist.email) {
        return res.status(200).json({
          isExist:true,
          phoneNumber: isUserExist.phone.number,
          countryCode: isUserExist.phone.countryCode,
          message: "Phone is Already Verified. Create Account Credentials.",
        });
      } else {
        return res.status(200).json({
          isExist:true,
          phoneNumber: isUserExist.phone.number,
          countryCode: isUserExist.phone.countryCode,
          email: isUserExist.email,
          message: "User Already Registered. Kindly Login.",
        });
      }
    }
  
    const phone = `+${countryCode}${phoneNumber}`;
  
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const orderId = uuidv4();
  
    try {
      const payload = {
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
          name: "send_otp",
          language: { code: "en_US" },
          components: [
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  text: otp.toString(),
                },
              ],
            },
            {
              type: "button",
              sub_type: "url",
              index: 0,
              parameters: [
                {
                  type: "text",
                  text: otp.toString(),
                },
              ],
            },
          ],
        },
      };
  
      const headers = {
        Authorization: `Bearer ${WA_TOKEN}`,
        "Content-Type": "application/json",
      };
  
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${WA_PHONE_ID}/messages`,
        payload,
        { headers }
      );
      const expirationTime = new Date(Date.now() + 10 * 60 * 1000);
      const hashedOTP = await bcrypt.hash(otp, 10);
      const token = jwt.sign(
        { phone, expirationTime, hashedOTP },
        process.env.JWT_SECRET
      );
      res.status(200).json({ message: "Check Whatsapp for OTP", token: token });
    } catch (error) {
      console.error("Error sending OTP:", error.response?.data || error.message);
      res.status(500).json({ message: "Failed to send OTP via WhatsApp" });
    }
  });
  
  const verifyPhoneOTP = async (req, res) => {
    const { otp, countryCode, phoneNumber } = req.body;
    if (!otp) {
      return res.status(400).json({ message: "Please Enter the OTP" });
    }
    const token =
      req.headers.phoneauth ||
      (req.headers.cookie && req.headers.cookie.split("phoneauth=")[1]);
    if (!token) {
      return res.status(400).json({ message: "OTP not found in cookies" });
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const hashedOTP = decoded.hashedOTP;
      const isMatch = await bcrypt.compare(String(otp), hashedOTP);
      const phone = `+${countryCode}${phoneNumber}`;
      if (phone.toString() != decoded.phone.toString()) {
        return res.status(400).json({ message: "OTP is incorrect" });
      }
      if (!isMatch) {
        return res.status(400).json({ message: "OTP is incorrect" });
      }
  
      const checkExpirationTime = decoded.expirationTime;
      if (checkExpirationTime < new Date()) {
        return res.status(400).json({ message: "OTP has expired" });
      }
      const expirationTime = new Date(Date.now() + 20 * 60 * 1000);
      const verified = true;
      const tokenToSend = jwt.sign(
        { phoneNumber, verified, expirationTime },
        process.env.JWT_SECRET
      );
      res.status(200).json({ token:tokenToSend });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Server Error" });
    }
  };
  
  const resendPhoneOTP = asyncHandler(async (req, res) => {
    const { phoneNumber, countryCode } = req.body;
    
    if (!phoneNumber || !countryCode) {
      return res.status(400).json({ message: "Please provide Phone" });
    }
  
    try {
      await generateAndSendPhoneOTP(req, res);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Server Error" });
    }
  });

const updateAvatar = async (req, res) => {
    const { _id } = req.user;

    if (!req.file) {
        return res.status(400).json({ error: 'Avatar file is required' });
    }
    if (req.file.size > 1 * 1024 * 1024) {
        return res.status(400).json({ error: 'File size cannot exceed 1MB' });
    }

    try {
        const user = await User.findById(_id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (user.fileId) {
            await deleteImage(user.fileId);
        }

        const uploadResponse = await uploadImage(req.file.buffer, req.file.originalname);

        if (!uploadResponse)
            res.status(500).json({ message: "Uploading server issue Try Again!" });

        user.avatar = uploadResponse.url;
        user.fileId = uploadResponse.fileId;
        await user.save();
        res.status(201).json({ message: "Profile Pic Updated Successfully" });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while updating the avatar' });
    }
};

const updateBio = async (req, res) => {
    const { _id } = req.user;
    const { bio } = req.body;
    try {
        const user = await User.findById(_id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        user.bioSection.bio = bio;
        await user.save();
        res.status(201).json({ message: "Bio Updated Successfully" });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'An error occurred while updating the Bio' });
    }
};
const hideDetails = async (req, res) => {
    const { _id } = req.user;
    const { hideDetails } = req.body;
    try {
        const user = await User.findById(_id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        user.bioSection.hideBio = hideDetails;
        await user.save();

        res.status(201).json({ message: "Bio Updated Successfully" });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'An error occurred while updating the Bio' });
    }
};


export {
    userRegister,
    userLogin,
    updateAvatar,
    verifySession,
    getUser,

    generateAndSendEmailOTP,
    verifyEmailOTP,
    resendEmailOTP,

    generateAndSendPhoneOTP,
    resendPhoneOTP,
    verifyPhoneOTP,
    updateBio,
    hideDetails
}
