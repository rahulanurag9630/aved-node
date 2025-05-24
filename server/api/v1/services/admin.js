import userModel from '../../../models/users';
import statuss from '../../../enums/status';
import userType from '../../../enums/userType';
import mongoose from 'mongoose';



export const adminServices = {
    listSubAdmin: async (validatedBody) => {
        const { search, status, fromDate, toDate, page, limit } = validatedBody;
    
        // Base query: Filter by userType SUBADMIN
        const query = {
          userType: userType.SUBADMIN,
          status: { $ne: statuss.DELETE },
        };
    
        // Add search condition
        if (search) {
          query.$or = [
            { fullName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ];
        }
    
        // Add status filter
        if (status) query.status = status;
    
        // Add date range filter
        if (fromDate || toDate) {
          query.createdAt = {};
          if (fromDate) query.createdAt.$gte = new Date(fromDate);
          if (toDate) query.createdAt.$lte = new Date(`${toDate}T23:59:59.999Z`);
        }
    
        // Pagination options
        const options = {
          page: parseInt(page) || 1,
          limit: parseInt(limit) || 10,
          sort: { createdAt: -1 },
          // select: ["firstName", "lastName", "email", "mobileNumber", "status", "createdAt"], // Adjust fields as needed
        };
        const totalSubadmin = await userModel.countDocuments({
          userType: "SUBADMIN",
          status: { $ne: "DELETE" }, // Exclude deleted users
        });
        const totalActiveSubadmin = await userModel.countDocuments({
          status: "ACTIVE",
          userType: "SUBADMIN",
        });
        const totalBlockedSubadmin = await userModel.countDocuments({
          status: "BLOCKED",
          userType: "SUBADMIN",
        });
    
        try {
          // Execute paginated query
          const data = await userModel.paginate(query, options);
          return { data, totalSubadmin, totalActiveSubadmin, totalBlockedSubadmin };
        } catch (error) {
          console.error("Error in listSubAdmin:", error);
          throw error;
        }
      },

}
