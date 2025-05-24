
import contactUsModel from "../../../models/contactUs";
import status from '../../../enums/status';
import { populate } from "dotenv";



const contactusServices = {

    createContact: async (insertObj) => {
        return await contactUsModel.create(insertObj);
    },

    findContactUs: async (query) => {
        return await contactUsModel.findOne(query);
    },

    updateContactUs: async (query, updateObj) => {
        return await contactUsModel.findOneAndUpdate(query, updateObj, { new: true });
    },
    deleteContactUs: async (query, updateObj) => {
        return await contactUsModel.findByIdAndDelete(query, updateObj, { new: true });
    },

    ContactUsListwithoutSearch: async (query) => {
        query = { status: { $ne: "DELETE" } };
        return await contactUsModel.find(query);
    },

    contactUsLists: async (validatedBody) => {
        let query = { status: { $ne: status.DELETE } };
        const { search, fromDate, toDate, page, limit } = validatedBody;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
            ]
        }
        if (fromDate && toDate) {
            const startOfDay = new Date(fromDate);
            const endOfDay = new Date(toDate);
            endOfDay.setHours(23, 59, 59, 999); // Set the end time of the day
            // query.createdAt = { $gte: fromDate, $lte: toDate };
            query.$and = [
                { createdAt: { $gte: startOfDay } },
                { createdAt: { $lte: endOfDay } },
            ]
        } else if (fromDate && !toDate) {
            query.createdAt = { $gte: new Date(fromDate) };
        } else if (!fromDate && toDate) {
            const endOfDay = new Date(toDate);
            endOfDay.setHours(23, 59, 59, 999); // Set the end time of the day
            query.createdAt = { $lte: endOfDay };
        }
        let options = {
            page: parseInt(page)|| 1,
            populate: {
                path: 'userId',
                select: 'email' // select only name and email
            },
            limit: parseInt(limit) || 100,
            sort: { createdAt: -1 }
        };
        const result = await contactUsModel.paginate(query, options);

        // Calculate the total pages count
        const totalPages = Math.ceil(result.total / options.limit);

        // Add the total pages count to the result object
        result.totalPages = totalPages;

        return result;
    },

}

module.exports = { contactusServices };
