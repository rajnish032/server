import express from "express"
import verifyUserJwt from "../middlewares/verifyUserJwt.js";
import { addNewProject, deleteProj, getAllProj, getAllPublicProj } from "../controllers/surveyingproj.controllers.js";
import { addNewLog, deleteLog, getAllLog,fileupload, getPublicAllLog } from "../controllers/SurveyingLogs.controllers.js";
import { addNewBattery, addNewEquipment, addPayload, deleteEquipment, deleteBattery,  getAllAssets } from "../controllers/SurveyingAssets.controller.js";
import { addNewLink, deleteLink } from "../controllers/SocialLinks.controller.js";

import { hideDetails, updateAvatar, updateBio, userLogin } from "../controllers/user.controller.js";
import uploadAvatar from "../utils/multerForImg.js"
import multer from "multer";
import upload from "../utils/multerconfig.js";
import uploadKmlKmz from "../utils/multerForKml.js"
const uploadLoc = multer({ dest: "uploads/" });
import { getUserById, getSurveyingById, addWorkExperience, deleteWorkExperience } from "../controllers/userDetail.controller.js";
import { deleteUnavailability, getUnavailableUsers, getUserAvailability, markUnavailable } from "../controllers/unavailability.controller.js";
import { addNewJob, deleteJob, deleteShareProj, getAllJob, getAllShareProj, shareNewProject } from "../controllers/postJob.controller.js";
import uploadImage from "../utils/multerForImg.js";
//import { uploadImage } from "../utils/imagekit.js";

const router = express.Router();



const multerErrorHandler = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: "File size cannot exceed 1MB" });
        }
    } else if (err) {
        return res.status(400).json({ message: err.message });
    }
    next();
};

// login route
router.post("/login", userLogin);
router.get("/detail", verifyUserJwt, getUserById);
router.post("/public/detail", getSurveyingById);

//  surveying avatar update 
router.put('/updateAvatar', verifyUserJwt, uploadAvatar.single('avatar'), multerErrorHandler, updateAvatar);

// work exp routes
router.post('/add/workexp', verifyUserJwt, addWorkExperience);
router.delete('/delete/workexp/:id', verifyUserJwt, deleteWorkExperience);

// Projects routes
router.get('/projects/all', verifyUserJwt, getAllProj)
router.get('/public/projects/all', getAllPublicProj)
router.delete('/project/delete/:projId', verifyUserJwt, deleteProj)
router.post('/project/new', verifyUserJwt,uploadKmlKmz.single("file"),addNewProject)


// Share Projects routes & Post Job routes

router.get('/shareproj/all', verifyUserJwt, getAllShareProj);
router.delete('/shareproj/delete/:projId', verifyUserJwt, deleteShareProj);
router.post('/shareproj/new', verifyUserJwt, uploadKmlKmz.single('file'), shareNewProject); 


router.get('/jobs/all', verifyUserJwt, getAllJob);
//router.get('/public/jobs/all', getAllPublicJob);

router.post("/postjob/new", verifyUserJwt, uploadImage.single('companyLogo'),multerErrorHandler, addNewJob);
router.delete('/job/delete/:jobId', verifyUserJwt, deleteJob);


// Logs Routes
router.get('/logs/all', verifyUserJwt, getAllLog)
router.get('/public/logs/all', getPublicAllLog)
router.delete('/delete/log/:id', verifyUserJwt, deleteLog)
router.post('/log/new', verifyUserJwt, addNewLog)
router.post("/uploadlogfile", uploadLoc.single("file"), fileupload);
// Assets Routes
router.get('/assets/all', verifyUserJwt, getAllAssets);
router.post('/assets/equipment/new', verifyUserJwt, addNewEquipment);
router.delete('/equipment/delete/:equipmentId', verifyUserJwt, deleteEquipment)
router.post('/assets/battery/new', verifyUserJwt, addNewBattery);
router.delete('/battery/delete/:batteryId', verifyUserJwt, deleteBattery);
router.post('/assets/payloads/update', verifyUserJwt, addPayload);

// social links
router.post('/add/socialLink', verifyUserJwt, addNewLink)
router.delete('/delete/socialLink', verifyUserJwt, deleteLink)

// work exp
router.post('/add/work', verifyUserJwt, upload.single('file'), multerErrorHandler, addWorkExperience);
router.delete('/delete/work/:id', verifyUserJwt, deleteWorkExperience);

//unavailability
router.post("/unavailable/mark", verifyUserJwt, markUnavailable);
router.get("/unavailable/all", getUnavailableUsers);
router.get("/unavailable/check/:userId", getUserAvailability);
router.delete("/unavailable/delete/:id", verifyUserJwt, deleteUnavailability);

//Bio
router.post('/updateBio', verifyUserJwt,updateBio);
router.post('/hideDetails', verifyUserJwt,hideDetails);
export default router;