import User from "../models/userSchema.js";

export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 15, haveEquipments, notHavingEquipments, haveWorkExp, haveLicense, phone, fullName, city, state,status="all",isApplied } = req.query;

    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);

    let query = {};

    if (haveEquipments === 'true') {
      query['equipmentDetails'] = { $exists: true };
    }

    if (haveWorkExp === 'true') {
      query['workExp'] = { $exists: true };
    }

    if (haveLicense === 'true') {
      query['licenses'] = { $exists: true };
    }
    if (isApplied === 'true') {
      query["isApplied"] = true;
    }
    if (status === "approved") {
      query["status"] = "approved"; 
    } else if (status === "notApproved") {
      query["status"] = { $ne: "approved" }; 
    } 
    // if (email) query.email = { $regex: email, $options: 'i' };
    if (phone) query['phone.number'] = { $regex: phone, $options: 'i' };
    if (fullName) query.fullName = { $regex: fullName, $options: 'i' };
    if (city) query.city = { $regex: city, $options: 'i' };
    if (state) query.state = { $regex: state, $options: 'i' };

    const users = await User.find(query)
      .select("-password")
      .populate('equipmentDetails')
      .populate('projects')
      .populate('licenses')
      .populate('workExp')
      .limit(parsedLimit)
      .skip((parsedPage - 1) * parsedLimit)
      .exec();

    const totalCount = await User.countDocuments(query);

    const stats = {
      totalUsersWithLicense: await User.countDocuments({ licenses: { $exists: true } }),
      numberOfSurveying: await User.countDocuments({ role: 'Surveyor' }),
      numberOfAppliedUsers: await User.countDocuments({ isApplied: true }),
      numberOfUsersWithEquipments: await User.countDocuments({ equipmentDetails: { $exists: true } }),
      numberOfUsersWithWorkExp: await User.countDocuments({ workExp: { $exists: true } }),
      numberOfApprovedUser:await User.countDocuments({ status: "approved" }),
      numberOfRejectedUser:await User.countDocuments({ status: "rejected" }) ,
      numberOfUsersWithEquipmentAndLicense: await User.countDocuments({ 
        $and: [
          { equipmentDetails: { $exists: true } }, 
          { licenses: { $exists: true } }
        ] 
      }),
    };

    res.json({
      page: parsedPage,
      limit: parsedLimit,
      totalCount,
      totalPages: Math.ceil(totalCount / parsedLimit),
      users,
      stats,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};



export const getUsersRegisteredToday = async (req, res) => {
  try {
    const { fullName } = req.query;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let query = { createdAt: { $gte: today } };

    if (fullName) {
      query.fullName = { $regex: fullName, $options: 'i' };
    }

    const users = await User.find(query)
      .select("-password")
      .populate('equipmentDetails')
      .populate('projects')
      .populate('licenses')
      .populate('workExp');

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllUserLocations = async (req, res) => {
  try {
    const users = await User.find(
      { 
        "coordinates.lat": { $exists: true },
        "coordinates.lon": { $exists: true }
      },
      { "coordinates.lat": 1, "coordinates.lon": 1, _id: 0 }
    );

    const locations = users.map(u => ({
      lat: Number(u.coordinates.lat).toFixed(2),
      lng: Number(u.coordinates.lon).toFixed(2),
    }));

    res.status(200).json({
      success: true,
      count: locations.length,
      locations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching user locations",
      error: error.message,
    });
  }
};

