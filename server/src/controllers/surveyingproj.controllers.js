import expressAsyncHandler from "express-async-handler";
import { SurveyingProject } from "../models/surveying/projects.model.js";
import User from "../models/userSchema.js";
import { deleteKMLFromCloudinary, uploadKmlToCloudinary } from "../utils/cloudinary.js";

export const addNewProject = expressAsyncHandler(async (req, res) => {
  const { data } = req.body;
  const file = req.file;
  if (!data)
    return res.status(400).json({ message: "All Fields are required" });

  let projectData = JSON.parse(data);
  if (file) {
    try {
      const uploadedFile = await uploadKmlToCloudinary(file);
      projectData.fileUrl = uploadedFile.secure_url;
    } catch (error) {
      return res.status(500).json({ message: "Failed to upload KML/KMZ file" });
    }
  }
  const newProj = await SurveyingProject.create({
    userId: req.user._id,
    ...projectData,
  });
//   console.log(newProj);
  if (!newProj)
    return res
      .status(500)
      .json({ message: "Could not Add Project Please try again" });

  res.status(201).json({ message: "Project Added" });
});

export const deleteProj = expressAsyncHandler(async (req, res) => {
  const { projId } = req.params;

  if (!projId) {
    return res.status(400).json({ message: "Invalid Project" });
  }

  try {
    const project = await SurveyingProject.findById(projId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    if (project.fileUrl) {
      await deleteKMLFromCloudinary(project.fileUrl);
    }

    await SurveyingProject.findByIdAndDelete(projId);

    res.status(200).json({ message: "Project Deleted" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res
      .status(500)
      .json({ message: "Could not Delete Project. Please try again" });
  }
});

export const getAllProj = expressAsyncHandler(async (req, res) => {
  const { _id } = req.user;
  if (!_id) return res.status(401).json({ message: "Kindly Login" });
  const allProj = await SurveyingProject.find({ userId: _id });

  res.status(200).json({ allProj: allProj });
});
export const getAllPublicProj = expressAsyncHandler(async (req, res) => {
  const { uniqueId } = req.query;
  if (!uniqueId) return res.status(401).json({ message: "Kindly Provide Id" });
  const user = await User.findOne({ uniqueId });
  if (!user) return res.status(401).json({ message: "Invalid Id" });

  const allProj = await SurveyingProject.find({ userId: user._id });

  res.status(200).json({ allProj: allProj });
});
