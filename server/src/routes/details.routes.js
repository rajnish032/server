import express from "express"

import {
    addEquipmentDetail,
    addLicense, addProjExperience, addWorkExperience, deleteEquipmentDetail, deleteLicense,
      deleteProjExperience,
      deleteWorkExperience,
 getSurveyResponse,
 handleApply,
 updateUserDetails, 
 addToPortfolioImage,
 deletePortfolioImage,
 addToPortfolioVideo,
 deletePortfolioVideo,
 getActivityLog,
 } from "../controllers/userDetail.controller.js";

import verifyUserJwt from "../middlewares/verifyUserJwt.js";
import upload from "../utils/multerconfig.js";
import uploadAvatar from "../utils/multerForImg.js";
import { handleSurveyingApproval, verifyAdminAuth,handleSurveyingRejection, handleSurveyingSuspension, handleSurveyingRevokeSuspension, sendEmails, handleEnablingEdit,  handleDataVerified } from "../controllers/admin.controller.js";
import { getAllUsers, getUsersRegisteredToday } from "../controllers/userfetch.controller.js";
import multer from "multer";
import { updateAvatar } from "../controllers/user.controller.js";
import uploadXlsx from "../utils/multerForXlsx.js";
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

router.put("/user/details/update", verifyUserJwt, updateUserDetails);
router.put('/user/updateAvatar',verifyUserJwt, uploadAvatar.single('avatar'),multerErrorHandler, updateAvatar);


router.post('/user/details/work', verifyUserJwt,upload.single('file'),multerErrorHandler, addWorkExperience);
router.delete('/user/details/work/:id', verifyUserJwt, deleteWorkExperience);


router.post('/user/details/project', verifyUserJwt, upload.single('projectFile'),multerErrorHandler,addProjExperience);
router.delete('/user/details/project/:id', verifyUserJwt, deleteProjExperience);

// equipments routes
router.post('/user/details/equipment', verifyUserJwt, addEquipmentDetail);
router.delete('/user/details/equipment/:id', verifyUserJwt, deleteEquipmentDetail);


router.post('/user/details/licenses',verifyUserJwt, upload.single('image'),multerErrorHandler, addLicense);
router.delete('/user/details/licenses/:licenseId',verifyUserJwt, deleteLicense);

router.post("/user/details/addPortfolioImage",verifyUserJwt,uploadAvatar.single('image'),multerErrorHandler,addToPortfolioImage)
router.delete("/user/details/deletePortfolioImage",verifyUserJwt,deletePortfolioImage)
router.post("/user/details/addPortfolioVideo",verifyUserJwt,addToPortfolioVideo)
router.delete("/user/details/deletePortfolioVideo",verifyUserJwt,deletePortfolioVideo)
router.get("/user/details/getLogs",verifyUserJwt,getActivityLog)

router.post('/user/survey', verifyUserJwt, getSurveyResponse);
router.get("/user/approval",verifyUserJwt,handleApply);

router.get("/user/all",verifyAdminAuth,getAllUsers);
router.get("/user/all/new",verifyAdminAuth,getUsersRegisteredToday);
router.put("/user/approve/:id",verifyAdminAuth,handleSurveyingApproval);
router.put("/user/reject/:id",verifyAdminAuth,handleSurveyingRejection);
router.put("/user/enableEdit/:id",verifyAdminAuth,handleEnablingEdit);
router.put("/user/suspend/:id",verifyAdminAuth,handleSurveyingSuspension);
router.put("/user/resume/:id",verifyAdminAuth,handleSurveyingRevokeSuspension);
router.put("/user/verify/:id",verifyAdminAuth,handleDataVerified);
router.post("/user/pending/mail",verifyAdminAuth,sendEmails)


export default router; 