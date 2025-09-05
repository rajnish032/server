import expressAsyncHandler from "express-async-handler";
import { Equipment } from "../models/surveying/equipmentModel.js";
import { Battery } from "../models/surveying/batteryModel.js";
import { Payload } from "../models/surveying/payloadModel.js";

export const addNewEquipment= expressAsyncHandler(async (req, res) => {
    const { data } = req.body;
    console.log(data)
    if (!data)
        return res.status(400).json({ message: 'All Fields are required' });
    const newEquipment = await Equipment.create({
        userId:req.user._id,
        ...data
    });
    // console.log(newEquipment)
    if (!newEquipment)
        return res.status(500).json({ message: 'Could not Add Please try again' });

    
    res.status(201).json({ message: 'Equipment Added' });

});

export const addNewBattery= expressAsyncHandler(async (req, res) => {
    const { data } = req.body;
    console.log(data)
    if (!data)
        return res.status(400).json({ message: 'All Fields are required' });
    const newBattery = await Battery.create({
        userId:req.user._id,
        ...data
    });
    // console.log(newBattery)
    if (!newBattery)
        return res.status(500).json({ message: 'Could not Add Please try again' });
    
    res.status(201).json({ message: 'Equipment Added' });

});

export const deleteBattery = expressAsyncHandler(async (req, res) => {
    const { batteryId } = req.params;

    if (!batteryId)
        return res.status(400).json({ message: 'Invalid' });
    const data = await Battery.findByIdAndDelete(batteryId);
    if (!data)
        return res.status(500).json({ message: 'Could not Delete record Please try again' });

    res.status(200).json({ message: 'Delete success' });

});


export const addPayload = expressAsyncHandler(async (req, res) => {
    const { data } = req.body;

    if (!data || !Array.isArray(data)) {
        return res.status(400).json({ message: 'Payload data is required and must be an array' });
    }

    try {
        const existingPayload = await Payload.findOne({ userId: req.user._id });

        if (existingPayload) {
            existingPayload.payloads = [...data];
            await existingPayload.save();
            return res.status(200).json({ message: 'Payloads updated successfully' });
        } else {
            const newPayload = await Payload.create({
                userId: req.user._id,
                payloads: data,
            });
            return res.status(201).json({ message: 'Payload created successfully', payload: newPayload });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Could not process the request. Please try again.' });
    }
});

export const deleteEquipment = expressAsyncHandler(async (req, res) => {
    const { equipmentId } = req.params;

    if (!equipmentId)
        return res.status(400).json({ message: 'Invalid' });
    const data = await Equipment.findByIdAndDelete(equipmentId);
    if (!data)
        return res.status(500).json({ message: 'Could not Delete record Please try again' });

    res.status(200).json({ message: 'Delete success' });

});

export const getAllAssets = expressAsyncHandler(async (req, res) => {
    const { _id } = req.user;
    if (!_id)
        return res.status(401).json({ message: 'Kindly Login' });
    const payloadsData = await Payload.find({ userId: _id }); 
    // console.log(payloadsData)
    const equipments = await Equipment.find({ userId: _id });
    const batteries = await Battery.find({ userId: _id }); 


    res.status(200).json({ assets: {payloads:payloadsData,equipments:equipments,batteries:batteries,} });

});

