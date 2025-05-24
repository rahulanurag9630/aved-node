import staticContentModel from '../../../models/staticContent';
import status from '../../../enums/status';
// import userType from '../../enums/userType';
// import approveStatus from '../../enums/approveStatus';
// import mongoose from 'mongoose';



export const staticContentServices = {
  
  addStaticContent: async (insertObj) => {
    return await staticContentModel.create(insertObj);
  },
  updateStaticContent: async (id , updateObj) => {
    return await staticContentModel.updateOne({ _id: id}, updateObj, { new: true });
  },
  getAllStaticContent: async () => {
    return await staticContentModel.find();
  },
  deleteAllStaticContent: async () => {
    return await staticContentModel.deleteMany({});
  },
  getAllStaticContentByType: async (validatedBody) => {
          let query = { status: { $ne: status.DELETE } };
          const { search, fromDate, toDate, page, limit , contentType } = validatedBody;
          if (search) {
              query.$or = [
                  { question: { $regex: search, $options: 'i' } },
              ]
          }
          if(contentType){
            query.contentType = contentType
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
              limit: parseInt(limit) || 10,
              sort: { createdAt: -1 }
          };
          const result = await staticContentModel.paginate(query, options);
  
          // Calculate the total pages count
          const totalPages = Math.ceil(result.total / options.limit);
  
          // Add the total pages count to the result object
          result.totalPages = totalPages;
  
          return result;
      },
  
}
