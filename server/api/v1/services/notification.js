
import notificationModel from "../../../models/notification";
import status from '../../../enums/status';




const notificationServices = {

    createNotification: async (insertObj) => {
        return await notificationModel.create(insertObj);
    },

    findNotification: async (query) => {
        return await notificationModel.findOne(query);
    },

    updateNotification: async (query, updateObj) => {
        return await notificationModel.findOneAndUpdate(query, updateObj, { new: true });
    },
    deleteNotification: async (query, updateObj) => {
        return await notificationModel.findByIdAndDelete(query, updateObj, { new: true });
    },
    updateAllNotification: async (query, updateObj) => {
        return await notificationModel.updateMany(query, updateObj);
    },
    NotificationUsListwithoutSearch: async (query) => {
        query = { status: { $ne: "DELETE" } };
        return await notificationModel.find(query);
    },

    NotificationLists: async (validatedBody) => {
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
            // populate: {
            //     path: 'userId',
            // },
            limit: parseInt(limit) || 100,
            sort: { createdAt: -1 }
        };
        const result = await notificationModel.paginate(query, options);

        // Calculate the total pages count
        const totalPages = Math.ceil(result.total / options.limit);

        // Add the total pages count to the result object
        result.totalPages = totalPages;

        return result;
    },

}

module.exports = { notificationServices };
