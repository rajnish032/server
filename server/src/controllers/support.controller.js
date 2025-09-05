import Support from "../models/support.model.js";
import User from "../models/userSchema.js";
import sendEmail from "../service/sendMail.js";
import { uploadImageToCloudinary } from "../utils/cloudinary.js";

export const createTicket = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, comment, role } = req.body;
    let imageUrl = null;
    if (req.file) {
      const image = req.file;
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
      ];
      const MAX_FILE_SIZE = 500 * 1024;

      if (!allowedTypes.includes(image.mimetype)) {
        return res.status(400).json({
          message:
            "Invalid file type. Only JPG, JPEG, PNG, and WebP are allowed.",
        });
      }
      if (image.size > MAX_FILE_SIZE) {
        return res
          .status(400)
          .json({ message: "File size cannot exceed 500KB" });
      }
      const uploadResponse = await uploadImageToCloudinary(image, 70);
      imageUrl = uploadResponse.secure_url;
    }

    const ticket = await Support.create({
      type,
      comment,
      image: imageUrl,
      createdBy: userId,
      role,
    });

    const raisedBy = await User.findById(userId).select("fullName email");

    await sendEmail({
      from: "Aero2Astro Tech <tech@aero2astro.com>",
      to: process.env.ADMIN_EMAIL,
      subject: `New Support Ticket - ${type} raised by ${raisedBy.fullName}`,
      text: `
        A new support ticket has been raised.

        Type: ${type}
        Comment: ${comment}
        Raised By: ${raisedBy.fullName} (${raisedBy.email})
        Role: Surveyour
        Date: ${new Date(ticket.createdAt).toLocaleString()}
        ${imageUrl ? `Image: ${imageUrl}` : ""}
      `,
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
            .details {
                background-color: #f9f9f9;
                padding: 12px;
                margin: 20px 0;
                border: 1px solid #e0e0e0;
                border-radius: 5px;
                font-size: 14px;
            }
            .details p {
                margin: 6px 0;
            }
            .footer {
                text-align: center;
                padding: 10px;
                color: #777777;
                border-top: 1px solid #e0e0e0;
                font-size: 12px;
            }
            .footer a {
                color: #23a3df;
                text-decoration: none;
            }
            .image-preview {
                margin-top: 15px;
            }
            .image-preview img {
                max-width: 100%;
                border-radius: 5px;
                border: 1px solid #ddd;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
                <h1>AERO2ASTRO Tech</h1>
            </div>
            <div class="content">
                <h2>New Support Ticket Raised</h2>
                <p>Dear Admin,</p>
                <p>A new support ticket has been raised on the AERO2ASTRO Pilot platform. Below are the details:</p>
                <div class="details">
                    <p><strong>Type:</strong> ${type}</p>
                    <p><strong>Comment:</strong> ${comment}</p>
                    <p><strong>Raised By:</strong> ${raisedBy.fullName} (${raisedBy.email})</p>
                    <p><strong>Role :</strong> Surveyour</p>
                    <p><strong>Date:</strong> ${new Date(ticket.createdAt).toLocaleString()}</p>
                    ${imageUrl ? `<div class="image-preview"><strong>Attached Image:</strong><br><img src="${imageUrl}" alt="Ticket Image" /></div>` : ""}
                </div>
                <p>Please review and take the necessary actions.</p>
                <p>Best regards,<br>The AERO2ASTRO Tech Team</p>
            </div>
            <div class="footer">
                <p>
                    &copy; 2025 AERO2ASTRO Tech. All rights reserved.<br>
                    <a href="mailto:flywithus@aero2astro.com">flywithus@aero2astro.com</a>
                </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    res.status(201).json({
      success: true,
      message: "Support ticket created successfully",
      ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to raise ticket",
      error: error.message,
    });
  }
};


export const changeTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    const updatedTicket = await Support.findByIdAndUpdate(
      ticketId,
      { status },
      { new: true }
    ).populate("createdBy", "email fullName");

    if (!updatedTicket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const statusColors = {
      pending: "#23a3df",
      resolved: "#28a745",
      rejected: "#dc3545",
    };
    const statusColor = statusColors[updatedTicket.status] || "#23a3df";

    await sendEmail({
      from: "Aero2Astro Tech <tech@aero2astro.com>",
      to: updatedTicket.createdBy.email,
      subject: `Ticket Status Update - ${updatedTicket.status}`,
      text: `Hello ${updatedTicket.createdBy.fullName}, your ticket has been updated to "${updatedTicket.status}".`,
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
              .content p {
                  line-height: 1.6;
                  margin-bottom: 10px;
              }
              .status-badge {
                  display: inline-block;
                  background-color: ${statusColor};
                  color: #ffffff;
                  padding: 4px 10px;
                  font-size: 14px;
                  margin-left: 6px;
                  border-radius: 3px;
                  text-transform: capitalize;
              }
              .ticket-detail {
                  background-color: #f9f9f9;
                  border: 1px solid #e0e0e0;
                  padding: 15px;
                  border-radius: 5px;
                  margin-bottom: 15px;
              }
              .ticket-detail img {
                  max-width: 100%;
                  border-radius: 5px;
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
                  <h1>Ticket Status Updated</h1>
              </div>
              <div class="content">
                  <p>Dear ${updatedTicket.createdBy.fullName || "User"},</p>
                  <p>Your support ticket has been updated with the following details:</p>
                  <div class="ticket-detail">
                      <p><strong>Type:</strong> ${updatedTicket.type}</p>
                      <p><strong>Comment:</strong> ${updatedTicket.comment}</p>
                      <p><strong>Status:</strong> <span class="status-badge">${
                        updatedTicket.status
                      }</span></p>
                      ${
                        updatedTicket.image
                          ? `<p><strong>Attached Image:</strong></p>
                             <img src="${updatedTicket.image}" alt="Ticket Image" />`
                          : ""
                      }
                  </div>
                  <p>If you have any questions or need further assistance, feel free to reply to this email.</p>
                  <p>Best regards,<br>
                  The AERO2ASTRO Tech Team<br>
                  <a href="mailto:flywithus@aero2astro.com">flywithus@aero2astro.com</a></p>
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

    res.status(200).json({
      success: true,
      message: "Ticket status updated successfully",
      ticket: updatedTicket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update ticket status",
      error: error.message,
    });
  }
};

export const getAllTickets = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let filter = {};
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [
      tickets,
      totalTickets,
      pendingCount,
      resolvedCount,
      rejectedCount,
      totalFiltered
    ] = await Promise.all([
      Support.find(filter)
        .populate("createdBy", "fullName email uniqueId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Support.countDocuments(),
      Support.countDocuments({ status: "pending" }),
      Support.countDocuments({ status: "resolved" }),
      Support.countDocuments({ status: "rejected" }),
      Support.countDocuments(filter) 
    ]);

    res.status(200).json({
      success: true,
      page: parseInt(page),
      limit: parseInt(limit),
      totalFiltered, 
      totalTickets,  
      pending: pendingCount,
      resolved: resolvedCount,
      rejected: rejectedCount,
      tickets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch tickets",
      error: error.message,
    });
  }
};

export const getUserTickets = async (req, res) => {
  try {
    const userId = req.user._id; 

    const tickets = await Support.find({ createdBy: userId }).sort({
      createdAt: -1,
    }); 

    res.status(200).json({
      success: true,
      total: tickets.length,
      tickets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user tickets",
      error: error.message,
    });
  }
};
