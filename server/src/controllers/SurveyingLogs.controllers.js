import expressAsyncHandler from "express-async-handler";
import { SurveyingLog } from "../models/surveying/surveyingLogs.model.js";
import DJIParser from "dji-log-parser"
import fs from "fs"
import User from "../models/userSchema.js";
export const addNewLog = expressAsyncHandler(async (req, res) => {
    const { data } = req.body;
    // console.log(data)
    if (!data)
        return res.status(400).json({ message: 'All Fields are required' });
    const newLog = await SurveyingLog.create({
        userId:req.user._id,
        ...data
    });
    console.log(newLog)
    if (!newLog)
        return res.status(500).json({ message: 'Could not Add Record Please try again' });

    
    res.status(201).json({ message: 'Record Added' });

});

export const deleteLog = expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id)
        return res.status(400).json({ message: 'Invalid Record' });
    const data = await SurveyingLog.findByIdAndDelete({ _id:id });
    if (!data)
        return res.status(500).json({ message: 'Could not Delete record Please try again' });

    res.status(200).json({ message: 'Record Deleted' });

});

export const getAllLog = expressAsyncHandler(async (req, res) => {
    const { _id } = req.user;
    if (!_id)
        return res.status(401).json({ message: 'Kindly Login' });
    const allLog = await SurveyingLog.find({ userId: _id }).populate("project");

    res.status(200).json({ allLog: allLog });

});
export const getPublicAllLog = expressAsyncHandler(async (req, res) => {
  const { uniqueId } = req.query;
  if (!uniqueId){
      return res.status(401).json({ message: 'No Id Found' });}
    const user=await User.findOne({uniqueId})
    if(!user){
      return res.status(401).json({ message: 'Invalid User Id' });}
   const allLog = await SurveyingLog.find({ userId:user._id }).populate("project");

  res.status(200).json({ allLog: allLog });

});
export const fileupload = async (req, res) => {
    const file = req.file;
    if (!file) {
      return res.status(400).send("No file uploaded.");
    }
  
    try {
      const fileBuffer = fs.readFileSync(file.path);
      const parser = new DJIParser();
  
      const infos = {};
      const frames = [];
      let currentFlyTime;
      let currentFrame;
  
      const newFrame = (flyTime) => {
        const lastFrame = frames.slice(-1)[0];
  
        // Detect droped frames and fill it with a copy of the last frame
        if (frames.length && flyTime - currentFlyTime > 1) {
          for (let i = currentFlyTime + 1; i < flyTime; i += 1) {
            frames.push(lastFrame);
          }
        }
  
        // Add a new frame
        currentFlyTime = flyTime;
        if (currentFrame) {
          frames.push({ ...lastFrame, ...currentFrame });
        }
        currentFrame = {};
      };
  
      parser.on("DETAILS", (obj) => {
        // infos.subStreet = ''; // obj.getSubStreet();
        // infos.street = obj.getStreet();
        // infos.city = obj.getCity();
        // infos.area = obj.getArea();
        infos.longitude = obj.getLongitude();
        infos.latitude = obj.getLatitude();
        infos.totalDistance = obj.getTotalDistance();
        infos.totalTime = obj.getTotalTime();
        infos.maxHeight = obj.getMaxHeight();
        infos.maxHSpeed = obj.getMaxHSpeed();
        infos.maxVSpeed = obj.getMaxVSpeed();
        infos.updateTime = obj.getUpdateTime();
        infos.linecount = obj.getRecordLineCount();
        // infos.aircraftName =  obj.getAircraftName();
      });
      parser.parse(fileBuffer);
      res.json({
        infos,
        // frames,
      });
    } catch (error) {
      console.error("Error processing file:", error);
      res.status(500).send("Internal server error.");
    } finally {
      // removing the file after processing
      fs.unlink(file.path, (err) => {
        if (err) {
          console.error(`Failed to delete file: ${file.path}`, err);
        } else {
          // console.log(`File deleted: ${file.path}`);
        }
      });
    }
  };
  
