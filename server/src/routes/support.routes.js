import express from "express";
const router = express.Router();
import uploadAvatar from "../utils/multerForImg.js";
import verifyUserJwt from "../middlewares/verifyUserJwt.js";
import { verifyAdminAuth } from "../controllers/admin.controller.js";
import { changeTicketStatus, createTicket, getAllTickets, getUserTickets } from "../controllers/support.controller.js";

const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File size cannot exceed 1MB" });
    }
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

router.post(
  "/createTicket",
  verifyUserJwt,
  uploadAvatar.single("image"),
  multerErrorHandler,
  createTicket
);
router.patch("/tickets/:ticketId/status", verifyAdminAuth, changeTicketStatus);

router.get("/tickets", verifyAdminAuth, getAllTickets);

router.get("/tickets/user", verifyUserJwt, getUserTickets);

export default router;
