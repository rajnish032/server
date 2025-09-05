import { Schema, model } from "mongoose";

const userEquipmentDetailSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    equipments: [{
        equipmentModel: {
            type: String,
            required: true
        },

        purchasedOn: {
            type: Number,
            required: true
        },
   
        serial: {
            type: String,
            required: true
        },

        uin: {
            type: String,
            default :"N/A"
        },

        equipmentType: {
            type: String,
            required: true
        },

        batteries: {
            type: Number,
            required: true
        }

    }],
    payloads: [{
        type: String,
        required: true
    }],
    addons: [{
        type: String,
        required: true
    }]
});


const EquipmentDetail = model("EquipmentDetail", userEquipmentDetailSchema);

export default EquipmentDetail;
