import expressAsyncHandler from 'express-async-handler';
import {PostJob} from '../models/postjob.model.js';
import User from "../models/userSchema.js";
import { uploadImageToCloudinary } from '../utils/cloudinary.js';
import { uploadKmlToCloudinary, deleteKMLFromCloudinary } from '../utils/cloudinary.js';
import { ShareProj } from '../models/shareProj.js';

export const addNewJob = expressAsyncHandler(async (req, res) => {
  const {title,subtitle,date,location,companyname,jobtype,salary,industrytype,category,jobsummary,phoneNumber,email } = req.body;

  if (!title ||!subtitle ||!date ||!location ||!companyname ||!jobtype ||!salary ||!industrytype ||!category ||!jobsummary ||!phoneNumber ||!email) {
    return res.status(400).json({ message: "All fields are required" });
  }

  let companyLogoUrl = null;

  if (req.file) {
    try {
      const result = await uploadImageToCloudinary(req.file);
      companyLogoUrl = result.secure_url;
    } catch (error) {
      console.error("Error uploading image to Cloudinary:", error.message);
      return res.status(500).json({ message: "Failed to upload company image" });
    }
  }

  try {
    const newJob = await PostJob.create({
      userId: req.user._id,
      title,
      subtitle,
      date,
      location,
      companyname,
      jobtype,
      salary,
      industrytype,
      category,
      jobsummary,
      companyLogo: companyLogoUrl,
      phoneNumber,
      email
    });

    console.log(newJob);

    if (!newJob) {
      return res.status(400).json({ message: "Failed to create job posting" });
    }

    return res.status(201).json({ job: newJob });
  } catch (error) {
    console.error("Error creating job posting:", error.message);
    return res
      .status(500)
      .json({ message: "Could not add job. Try again!", error: error.message });
  }
});

  

export const deleteJob = expressAsyncHandler(async (req, res) => {
  const { jobId } = req.params;
  if (!jobId) {
    return res.status(400).json({ message: "Invalid Job" });
  }
  try {
    const job = await PostJob.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    await PostJob.findByIdAndDelete(jobId);

    res.status(200).json({ message: "Job Deleted" });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({ message: "Could not Delete Job. Please try again" });
  }
}
);
export const getAllJob = expressAsyncHandler(async (req, res) => {
  const { _id } = req.user;
  if (!_id) return res.status(401).json({ message: "Kindly Login" });
  const allJob = await PostJob.find({ userId: _id });

  res.status(200).json({ allJob: allJob });
}); 


export const shareNewProject = expressAsyncHandler(async (req, res) => {
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
  const newProj = await ShareProj.create({
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
export const deleteShareProj = expressAsyncHandler(async (req, res) => {
  const { projId } = req.params;

  if (!projId) {
    return res.status(400).json({ message: "Invalid Project" });
  }

  try {
    const project = await ShareProj.findById(projId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    if (project.fileUrl) {
      await deleteKMLFromCloudinary(project.fileUrl);
    }

    await ShareProj.findByIdAndDelete(projId);

    res.status(200).json({ message: "Project Deleted" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res
      .status(500)
      .json({ message: "Could not Delete Project. Please try again" });
  }
});

export const getAllShareProj = expressAsyncHandler(async (req, res) => {
  const { _id } = req.user;
  if (!_id) return res.status(401).json({ message: "Kindly Login" });
  const allProj = await ShareProj.find({ userId: _id });
 
  res.status(200).json({ allProj: allProj });
});


