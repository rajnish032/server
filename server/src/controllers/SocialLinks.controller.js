import expressAsyncHandler from "express-async-handler";
import User from "../models/userSchema.js";

export const addNewLink = expressAsyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { data } = req.body;
    const { title, url } = data
    if (!title || !url) {
        return res.status(400).json({ message: 'Title and URL are required' });
    }
    try {
        const user = await User.findById(_id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.socialLinks.push({ title, url });
        await user.save();

        res.status(201).json({ message: 'Social link added successfully', socialLinks: user.socialLinks });
    } catch (error) {
        res.status(500).json({ message: 'Could not add social link, please try again', error: error.message });
    }
});




export const deleteLink = expressAsyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { id } = req.body;  

    if (!id) {
        return res.status(400).json({ message: 'Link ID is required' });
    }

    try {
        const user = await User.findById(_id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.socialLinks = user.socialLinks.filter(link => link._id.toString() !== id);
        await user.save();

        res.status(200).json({ message: 'Social link deleted successfully', socialLinks: user.socialLinks });
    } catch (error) {
        res.status(500).json({ message: 'Could not delete social link, please try again', error: error.message });
    }
});
