import User from "../models/userSchema.js";
import Unavailability from "../models/userSubSchemas/unavailability.model.js";
import { logActivity } from "./userDetail.controller.js";

export const markUnavailable = async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;
    const userId = req.user._id;

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ message: "Invalid date range." });
    }
    const overlapping = await Unavailability.findOne({
      userId,
      $or: [{ startDate: { $lte: endDate }, endDate: { $gte: startDate } }],
    });

    if (overlapping) {
      return res
        .status(400)
        .json({ message: "Overlapping unavailability period exists." });
    }

    const newUnavailability = new Unavailability({
      userId,
      startDate,
      endDate,
      reason,
    });
    await newUnavailability.save();
    
    await logActivity(userId,"Added unavailability")
    res.status(200).json({ message: "Unavailability marked successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getUnavailableUsers = async (req, res) => {
  try {
    const today = new Date();

    const unavailableUsers = await Unavailability.find({
      startDate: { $lte: today },
      endDate: { $gte: today },
    }).populate("userId", "fullName email city state");

    res.status(200).json({ unavailableUsers });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getUserAvailability = async (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().split("T")[0];

    const unavailableDates = await Unavailability.find({ userId });
    const isUnavailableToday = unavailableDates.some(
      (date) =>
        today >= date.startDate.toISOString().split("T")[0] &&
        today <= date.endDate.toISOString().split("T")[0]
    );

    res.status(200).json({
      isAvailable: !isUnavailableToday,
      unavailabilityDates: unavailableDates,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const deleteUnavailability = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user._id;
      const unavailability = await Unavailability.findOneAndDelete({ _id: id, userId });
      
      if (!unavailability) {
        return res.status(404).json({ message: "Record not found or unauthorized." });
      }
      await logActivity(userId,"Deleted unavailability")
      res.status(200).json({ message: "Unavailability deleted successfully." });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  };
  
