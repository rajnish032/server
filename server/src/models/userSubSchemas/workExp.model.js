import { Schema, model } from "mongoose";

const workExpSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    yearsOfExp: {
        type: Number,
        required: true,
        default: 0
    },
    works: [{
        jobType: {
            type: String,
            enum: ["Employed in company", "Freelancer"],
            required: true
        },
        companyName: {
            type: String,
            required: true
        },
        designation: {
            type: String,
            required: true
        },
        startMon: {
            type: String,
            required: true
        },
        endMon: {
            type: String,
            required: true
        },
        image: {
            type: String,
        },
        fileId: {
            type: String,
        }
    }],
});

workExpSchema.pre('save', function (next) {
    const calculateExperience = (startMon, endMon) => {
        const [startMonth, startYear] = startMon.split('-').map(Number);
        const [endMonth, endYear] = endMon.split('-').map(Number);

        const totalMonthsDiff = (endYear - startYear) * 12 + (endMonth - startMonth + 1);

        return totalMonthsDiff / 12; 
    };

    const hasOverlappingCompanyPeriods = (works) => {
        const companyWorks = works.filter(work => work.jobType === 'Employed in company');

        for (let i = 0; i < companyWorks.length; i++) {
            for (let j = i + 1; j < companyWorks.length; j++) {
                const work1 = companyWorks[i];
                const work2 = companyWorks[j];

                const [startMon1, startYear1] = work1.startMon.split('-').map(Number);
                const [endMon1, endYear1] = work1.endMon.split('-').map(Number);
                const [startMon2, startYear2] = work2.startMon.split('-').map(Number);
                const [endMon2, endYear2] = work2.endMon.split('-').map(Number);

                const start1 = new Date(startYear1, startMon1 - 1);
                const end1 = new Date(endYear1, endMon1 - 1);
                const start2 = new Date(startYear2, startMon2 - 1);
                const end2 = new Date(endYear2, endMon2 - 1);

                if (start1 <= end2 && start2 <= end1) {
                    return true; 
                }
            }
        }

        return false;
    };

    if (hasOverlappingCompanyPeriods(this.works)) {
        return next(new Error('Overlapping periods for Employed in company jobs are not allowed.'));
    }

    let totalExperience = 0;
    const companyWorks = this.works.filter(work => work.jobType === 'Employed in company');
    const freelancerWorks = this.works.filter(work => work.jobType === 'Freelancer');

    totalExperience += companyWorks.reduce((total, work) => {
        return total + calculateExperience(work.startMon, work.endMon);
    }, 0);

    const processedFreelancerPeriods = new Set();
    freelancerWorks.forEach(work => {
        let overlapping = false;
        for (const period of processedFreelancerPeriods) {
            const [startMon, startYear] = work.startMon.split('-').map(Number);
            const [endMon, endYear] = work.endMon.split('-').map(Number);
            const [pStartMon, pStartYear] = period.startMon.split('-').map(Number);
            const [pEndMon, pEndYear] = period.endMon.split('-').map(Number);

            const start1 = new Date(startYear, startMon - 1);
            const end1 = new Date(endYear, endMon - 1);
            const start2 = new Date(pStartYear, pStartMon - 1);
            const end2 = new Date(pEndYear, pEndMon - 1);

            if (start1 <= end2 && start2 <= end1) {
                overlapping = true;
                break;
            }
        }

        if (!overlapping) {
            totalExperience += calculateExperience(work.startMon, work.endMon);
            processedFreelancerPeriods.add(work);
        }
    });

    this.yearsOfExp = Math.round(totalExperience * 10) / 10; 

    next();
});

const WorkExp = model("WorkExp", workExpSchema);

export default WorkExp;
