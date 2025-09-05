import expressAsyncHandler from "express-async-handler";
import User from "../models/userSchema.js";
import Licenses from "../models/userSubSchemas/licenses.model.js";
import ProjectDetail from "../models/userSubSchemas/projects.model.js";
import EquipmentDetail from "../models/userSubSchemas/userequipmentDetail.model.js";
import WorkExp from "../models/userSubSchemas/workExp.model.js";
import sendEmail from "../service/sendMail.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadImage, deleteImage } from "../utils/imagekit.js";
import {
  deleteFileFromCloudinary,
  uploadImageToCloudinary,
} from "../utils/cloudinary.js";
import ActivityLog from "../models/userSubSchemas/activityLog.model.js";
import mongoose from "mongoose";
export const getUserById = expressAsyncHandler(async (req, res) => {
  try {
    const { _id } = req.user;

    if (!_id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(_id)
      .select("-password")
      .populate("workExp")
      .populate("equipmentDetails")
      .populate("projects")
      .populate("licenses");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error("Error fetching user by ID:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export const getSurveyingById = expressAsyncHandler(async (req, res) => {
  try {
    const { uniqueId } = req.body;
    // console.log(uniqueId)
    if (!uniqueId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findOne({ uniqueId })
      .select("-password")
      .populate("workExp")
      .populate("equipmentDetails")
      .populate("projects")
      .populate("licenses");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error("Error fetching user by ID:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// *------------GENERAL UPDATE------------
export const updateUserDetails = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const updateData = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating user details:", error);
    res.status(500).json({ message: "Server Error. Please try again!" });
  }
});

// *------------Apply for approval ------------
export const handleApply = asyncHandler(async (req, res) => {
  const { _id } = req.user;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      { $set: { isApplied: true, status: "review", appliedTime: new Date() } },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    await sendEmail({
      from: "Aero2Astro Tech <tech@aero2astro.com>",
      to: process.env.ADMIN_EMAIL,
      subject: `Approval Request - ${updatedUser.fullName} has applied for approval`,
      text: `${updatedUser.fullName} has applied for approval with phone: ${updatedUser.phone.countryCode} ${updatedUser.phone.number} for the ${updatedUser.role} role from ${updatedUser.city}, ${updatedUser.state}.`,
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
          <h2>Approval Request</h2>
          <p>
              Dear Admin,
          </p>
          <p>
              A new user has applied for approval on the AERO2ASTRO Tech platform. Here are the details:
          </p>
          <div class="details">
              <p><strong>Name:</strong> ${updatedUser.fullName}</p>
              <p><strong>Email:</strong> ${updatedUser.email}</p>
              <p><strong>Phone:</strong>${updatedUser.phone.countryCode} ${updatedUser.phone.number}</p>
              <p><strong>Role:</strong> ${updatedUser.role}</p>
              <p><strong>Location:</strong> ${updatedUser.locality}</p>
              <p><strong>Pincode:</strong> ${updatedUser.areaPin}</p>
              <p><strong>State:</strong> ${updatedUser.state}</p>
              <p><strong>City:</strong> ${updatedUser.city}</p>
          </div>
          <p>
              Please review and take the necessary actions.
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
      `,
    });

    await sendEmail({
      from: "Aero2Astro Technologies",
      to: updatedUser.email,
      subject: `Application Submission Confirmation for ${updatedUser.fullName}`,
      text: `Hello ${updatedUser.fullName}, thank you for applying for the partnership with us! Your application is now under review, and we will get back to you soon with status updates via email.`,
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
            <h2>Thank You for Applying </h2>
            <p>
                Dear ${updatedUser.fullName},
            </p>
            <p>
               Thank you for applying for the Surveying partnership with us! Your application is now under review, and we will get back to you soon, you will recieve call or status updates through emails. So stay Tuned!
            </p>
         
          
            <p>
                If you have any questions or need assistance, feel free to contact our support team.
            </p>
            <p>
                Best regards,<br>
                The AERO2ASTRO Tech Team
                <a href="mailto:flywithus@aero2astro.com">flywithus@aero2astro.com</a>
                <br>
                +91 6006535445
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
    await ActivityLog.create({
      userId: updatedUser._id,
      action: "Applied for approval",
    });
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error applying user:", error);
    res.status(500).json({ message: "Server Error. Please try again!" });
  }
});

export const addProjExperience = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      fields,
      clientName,
      projectTitle,
      projectDesc,
      industry,
      application,
      projectScope,
      equipmentModels,
      startMon,
      endMon,
    } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "User not found" });
    }

    let proj = await ProjectDetail.findOne({ userId }).session(session);
    if (!proj) {
      proj = new ProjectDetail({ userId });
    }

    if (fields) {
      Object.assign(proj, fields);
    }

    if (
      clientName &&
      projectTitle &&
      projectDesc &&
      industry &&
      application &&
      projectScope &&
      equipmentModels &&
      startMon &&
      endMon
    ) {
      const newProject = {
        clientName,
        projectTitle,
        projectDesc,
        industry,
        application,
        projectScope,
        equipmentModels,
        startMon,
        endMon,
      };

      if (req.file) {
        const uploadResult = await uploadImage(
          req.file.buffer,
          req.file.originalname
        );
        newProject.image = uploadResult.url;
        newProject.fileId = uploadResult.fileId;
      }

      proj.projects.push(newProject);
    }

    const projectSaved = await proj.save({ session });

    user.projects = projectSaved._id;
    await user.save({ session });

    const activityLog = new ActivityLog({
      userId,
      action: "Added a new project experience",
    });
    await activityLog.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ message: "Project experience added successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error adding project experience:", error);
    res.status(500).json({ message: "Server Error. Please try again!" });
  }
};

export const deleteProjExperience = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;
    const { id } = req.params;

    const projectDetail = await ProjectDetail.findOne({ userId }).session(
      session
    );
    if (!projectDetail) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Project details not found" });
    }

    const projectToDelete = projectDetail.projects.id(id);
    if (!projectToDelete) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Project not found" });
    }

    if (projectToDelete.fileId) {
      try {
        await deleteImage(projectToDelete.fileId);
      } catch (error) {
        console.error("Error deleting image from storage:", error);
        await session.abortTransaction();
        session.endSession();
        return res
          .status(500)
          .json({ message: "Error deleting project image" });
      }
    }

    projectDetail.projects.pull({ _id: id });

    const updatedProjectDetail = await projectDetail.save({ session });

    logActivity(userId, `Deleted a project experience`).catch((logError) =>
      console.error("Activity logging failed:", logError)
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "Project experience deleted successfully",
      updatedProjectDetail,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error deleting project experience:", error);
    res.status(500).json({ message: "Server Error. Please try again!" });
  }
};

// *----------------------- WORK EXPERIENCE CRUD----------------------

export const addWorkExperience = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { jobType, companyName, designation, startMon, endMon } = req.body;
    if (!(jobType && companyName && designation && startMon && endMon)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "All fields are required" });
    }

    const userId = req.user._id;
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "User not found" });
    }

    let workExp = await WorkExp.findOne({ userId }).session(session);
    if (!workExp) {
      workExp = new WorkExp({ userId });
    }

    const work = {
      jobType,
      companyName,
      designation,
      startMon,
      endMon,
    };

    if (req.file) {
      const uploadResult = await uploadImage(
        req.file.buffer,
        req.file.originalname
      );
      work.image = uploadResult.url;
      work.fileId = uploadResult.fileId;
    }

    workExp.works.push(work);
    const worksaved = await workExp.save({ session });

    user.workExp = worksaved._id;
    await user.save({ session });

    logActivity(userId, `Added new work experience at ${companyName}`).catch(
      (logError) => console.error("Activity logging failed:", logError)
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ message: "Work experience added successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error adding work experience:", error.message);

    const message =
      error.message ===
      "Overlapping periods for Employed in company jobs are not allowed."
        ? "Overlapping periods for Employed in company jobs are not allowed."
        : "Server Error. Please try again!";

    res.status(500).json({ message });
  }
};

export const deleteWorkExperience = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;
    const { id } = req.params;

    const workExpDoc = await WorkExp.findOne({ userId }).session(session);
    if (!workExpDoc) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json({ message: "Work experience document not found" });
    }

    const work = workExpDoc.works.id(id);
    if (!work) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Work experience not found" });
    }

    const { fileId } = work;
    if (fileId) {
      try {
        await deleteImage(fileId);
      } catch (error) {
        console.error("Error deleting image from ImageKit:", error);
      }
    }

    workExpDoc.works.pull({ _id: id });
    await workExpDoc.save({ session });

    logActivity(userId, `Deleted work experience`).catch((logError) =>
      console.error("Activity logging failed:", logError)
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: "Work experience deleted successfully" });
  } catch (error) {
    console.error("Error deleting work experience:", error);
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: "Server Error. Please try again!" });
  }
});

// ---------------------------------------------------------

//*----------------------------EQUIPMENT DETAILS CRUD---------------------------
export const addEquipmentDetail = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { equipments, fields } = req.body;
    const user = await User.findById(req.user._id).session(session);

    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "User not found" });
    }

    let equipmentDetail = await EquipmentDetail.findOne({
      userId: req.user._id,
    }).session(session);

    if (!equipmentDetail) {
      if (!equipments || equipments.length === 0) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(400)
          .json({ message: "At least one equipment must be added." });
      }
      equipmentDetail = new EquipmentDetail({ userId: req.user._id, equipments: [] });
    } else {
      if ((!equipments || equipments.length === 0) && equipmentDetail.equipments.length === 0) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(400)
          .json({ message: "At least one equipment must be present." });
      }
    }

    if (equipments) {
      equipmentDetail.equipments.push(equipments);
    }
    if (fields) {
      Object.assign(equipmentDetail, fields);
    }

    const savedEquipmentDetail = await equipmentDetail.save({ session });
    user.equipmentDetails = savedEquipmentDetail._id;
    await user.save({ session });

    try {
      await logActivity(req.user._id, "Added a equipment detail", { equipments });
    } catch (logError) {
      console.error("Activity logging failed:", logError);
      await session.abortTransaction();
      session.endSession();
      return res
        .status(500)
        .json({ message: "Failed to log activity, transaction aborted." });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json(savedEquipmentDetail);
  } catch (error) {
    console.error("Error adding equipment detail:", error);
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: "Server Error. Please try again!" });
  }
};

export const deleteEquipmentDetail = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { _id } = req.user;
    const { id } = req.params;

    const updatedEquipmentDetail = await EquipmentDetail.findOneAndUpdate(
      { userId: _id },
      { $pull: { equipments: { _id: id } } },
      { new: true, session }
    );

    if (!updatedEquipmentDetail) {
      return res.status(404).json({ message: "Equipment detail not found" });
    }

    await logActivity(_id, "Deleted a equipment detail");

    await session.commitTransaction();
    session.endSession();

    res.status(200).json(updatedEquipmentDetail);
  } catch (error) {
    console.error("Error deleting equipment detail:", error);
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({ message: "Server Error. Please try again!" });
  }
};

//--------------------------------------------------------------------------------------

//*------------------------------LICENSE---------------------------

export const addLicense = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const user = await User.findById(_id).session(session);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { licenseNumber, classUas, surveyingName, licenseName, dateOfIssuance } =
      req.body;

    if (
      !(licenseNumber && classUas && licenseName && surveyingName && dateOfIssuance)
    ) {
      return res.status(400).json({ message: "All Fields are required" });
    }

    if (req.file && req.file.size > 1 * 1024 * 1024) {
      return res.status(400).json({ message: "File size cannot exceed 1MB" });
    }

    const image = req.file;
    const uploadResponse = await uploadImage(image.buffer, image.originalname);

    let licenseDoc = await Licenses.findOne({ userId: _id }).session(session);
    if (!licenseDoc) {
      licenseDoc = new Licenses({ userId: _id, licenses: [] });
    }

    const newLicense = {
      licenseName,
      licenseNumber,
      surveyingName,
      classUas,
      dateOfIssuance,
      image: uploadResponse.url,
      fileId: uploadResponse.fileId,
    };

    licenseDoc.licenses.push(newLicense);
    await licenseDoc.save({ session });

    user.licenses = licenseDoc._id;
    await user.save({ session });

    await logActivity(_id, "Added a license");

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ message: "Successfully saved" });
  } catch (error) {
    console.error("Error adding license:", error);
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({ message: "Internal server error" });
  }
});

export const deleteLicense = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { licenseId } = req.params;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const user = await User.findById(userId).session(session);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const licenseDoc = await Licenses.findOne({ userId }).session(session);
    if (!licenseDoc) {
      return res.status(404).json({ message: "Licenses document not found" });
    }

    const license = licenseDoc.licenses.id(licenseId);
    if (!license) {
      return res.status(404).json({ message: "License not found" });
    }

    const fileId = license.fileId;
    if (fileId) {
      try {
        await deleteImage(fileId);
      } catch (error) {
        return res
          .status(500)
          .json({ message: "Error deleting image from ImageKit", error });
      }
    }

    licenseDoc.licenses.pull({ _id: licenseId });
    await licenseDoc.save({ session });

    await logActivity(userId, "Deleted a license");

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: "License deleted successfully" });
  } catch (error) {
    console.error("Error deleting license:", error);
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({ message: "Internal server error" });
  }
});
// ================== Survey ==========================
export const getSurveyResponse = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { answer } = req.body;

  try {
    const isUser = await User.findByIdAndUpdate(_id);

    if (!isUser) {
      return res.status(404).json({ message: "User not found" });
    }
    isUser.surveyAnswer = answer;
    await isUser.save();
    res.status(200).json({ message: "Thankyou for this response" });
  } catch (error) {
    console.error("Something went wront while saving response", error);
    res.status(500).json({
      message: "Something went wront while saving response, Please Try Again !",
    });
  }
});

// ================== Portfolio ==========================

export const addToPortfolioImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const { _id } = req.user;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const user = await User.findById(_id).session(session);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.portfolioImage && user.portfolioImage.length >= 10) {
      return res
        .status(400)
        .json({ message: "You can only add up to 10 items" });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    const image = req.file;
    if (!allowedTypes.includes(image.mimetype)) {
      return res.status(400).json({
        message:
          "Invalid file type. Only JPG, JPEG, PNG, and WebP are allowed.",
      });
    }

    if (image.size > 500 * 1024) {
      return res.status(400).json({ message: "File size cannot exceed 500KB" });
    }

    const uploadResponse = await uploadImageToCloudinary(image, 70);
    const imageUrl = uploadResponse.secure_url;
    user.portfolioImage.push(imageUrl);

    await user.save({ session });

    await logActivity(_id, "Added a portfolio image");

    await session.commitTransaction();
    session.endSession();
    res.status(201).json({
      secure_url: imageUrl,
      message: "Successfully added to portfolio",
    });
  } catch (error) {
    console.error("Error adding to portfolio:", error);
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({ message: "Internal server error" });
  }
});

export const deletePortfolioImage = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const user = await User.findById(_id).session(session);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { index, url } = req.body;
    if (
      !Array.isArray(user.portfolioImage) ||
      index < 0 ||
      index >= user.portfolioImage.length
    ) {
      return res
        .status(400)
        .json({ message: "Invalid index or portfolioImage array" });
    }

    await deleteFileFromCloudinary(url);

    user.portfolioImage = user?.portfolioImage?.filter((img, i) => i !== index);

    await user.save({ session });

    await logActivity(_id, "Deleted a portfolio image");

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "Image Deleted Successfully",
      portfolioImage: user.portfolioImage,
    });
  } catch (error) {
    console.error("Error Deleting From Portfolio:", error);
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({ message: "Internal Server Error" });
  }
});

// add Video to portfolio

export const addToPortfolioVideo = asyncHandler(async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const regex =
    /^(https:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com)\/(watch\?v=|shorts\/)[a-zA-Z0-9_-]{11}$/;
  if (!regex.test(url)) {
    return res.status(400).json({ message: "Invalid YouTube video URL" });
  }

  const { _id } = req.user;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const user = await User.findById(_id).session(session);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.portfolioVideo.includes(url)) {
      return res
        .status(400)
        .json({ message: "This video is already in your portfolio" });
    }

    user.portfolioVideo.push(url);
    await user.save({ session });

    await logActivity(_id, "Added a portfolio video");

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      videoUrl: url,
      message: "Successfully added to portfolio",
    });
  } catch (error) {
    console.error("Error adding to portfolio:", error);
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({ message: "Internal server error" });
  }
});

// delete Portfolio image
export const deletePortfolioVideo = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const user = await User.findById(_id).session(session);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { url } = req.body;

    const updatedVideos = user?.portfolioVideo?.filter(
      (videoUrl) => videoUrl !== url
    );

    user.portfolioVideo = updatedVideos;
    await user.save({ session });

    await logActivity(_id, "Deleted a portfolio video");

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "Video Deleted Successfully",
      portfolioImage: user.portfolioImage,
    });
  } catch (error) {
    console.error("Error Deleting From Portfolio:", error);
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Activity log controller
export const logActivity = async (userId, action) => {
  try {
    const log = new ActivityLog({ userId, action });
    await log.save();
  } catch (error) {
    console.error("Error logging activity:", error);
  }
};

export const getActivityLog = async (req, res) => {
  try {
    const { _id } = req.user;
    const { page = 1, limit = 10 } = req.query;

    const logs = await ActivityLog.find({ userId: _id })
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalLogs = await ActivityLog.countDocuments({ userId: _id });

    res.status(200).json({
      logs,
      totalPages: Math.ceil(totalLogs / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    res.status(500).json({ message: "Server Error. Please try again!" });
  }
};
