import { Schema } from "mongoose";

const professionalDetailSchema = new Schema({
    employmentStatus: {
        type: String,
        enum: ['Employed', 'Self employed', 'Not employed'],
        required: true
    },
    companyName: {
        type: String,
        trim: true
    },
    place: {
        type: String,
        trim: true
    },
    workType: {
        type: String,
        trim: true
    },
    employmentType: {
        type: String,
        enum: ['Freelancer', 'Company'],
        trim: true
    },
    seCompanyName: {
        type: String
    },
    sePlace: {
        type: String
    },
    workNature: {
        type: String
    }
});

professionalDetailSchema.pre('validate', function (next) {
    if (this.employmentStatus === 'Employed' && (!this.companyName || !this.place || !this.workType)) {
        return next(new Error('Company Name, Place, and Work Type are required when employment status is "Employed".'));
    }
    if (this.employmentStatus === 'Self employed') {
        if (!this.employmentType) {
            return next(new Error('Employment Type is required when employment status is "Self employed".'));
        }

        if (this.employmentType === "Company" && !this.seCompanyName) {
            return next(new Error('Company Name  is required .'));
        }
        if (!this.sePlace) {
            return next(new Error('Place for Self Employed is required when employment status is "Self employed".'));
        }
        if (!this.workNature) {
            return next(new Error('Work Nature is required when employment status is "Self employed".'));
        }
    }
    next();
});

export default professionalDetailSchema;
