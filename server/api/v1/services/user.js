import userModel from '../../../models/users';

export const userServices = {

  async checkUserExists(query) {
    try {
      const user = await userModel.findOne(query);
      return user;
    } catch (error) {
      throw error;
    }
  },
  createUser: async (insertObj) => {
    return await userModel.create(insertObj);
  },
  updateUser: async (query, updateObj) => {
    // if (updateObj.status === status.DELETE) {
    //   userModel.destroy(query);
    // }
    return await userModel.findOneAndUpdate(query, { $set: updateObj }, { new: true, runValidators: true });
  },
  findUser: async (query) => {
    return await userModel.findOne(query)
  },
  updateUserById: async (query, updateObj) => {
    return await userModel.findByIdAndUpdate(query, { $set: updateObj }, { new: true })
      .select({ otp: 0 });
  },
  findAllUsers: async (whereClause, skip = 0, limit = 10) => {
    const usersList = await userModel
      .find(whereClause)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const totalUsersCount = await userModel.countDocuments(whereClause);
    const totalPages = limit ? Math.ceil(totalUsersCount / limit) : 1;
    return {
      usersList,
      totalPages,
      currentPage: Math.ceil(skip / limit) + 1,
      limit,
    };
  },


}
