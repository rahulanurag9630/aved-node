import chatRooms from "../../../models/chatRooms";
import chatMessages from "../../../models/chatMessages";

export const socketServices = {
  checkUserChatRoom: async (obj) => {
    return await chatRooms.findOne(obj);
  },
  findUserChatRoom: async (roomId) => {
    return await chatRooms.findOne({roomId: roomId});
  },
  createChatRoom: async (insertObj) => {
    return await chatRooms.create(insertObj);
  },
  updateUserChatRoom: async (obj, query) => {
    return await chatRooms.findOneAndUpdate(obj, { $set: query }, { new: true });
  },

  findUserExistingMessages: async (query, page = 1, limit = 50) => {
    const options = {
      page: page,
      limit: limit,
      sort: { createdAt: 1 },
    };
    return await chatMessages.paginate(query, options);
  },
  saveUserMessage: async (insertObj) => {
    return await chatMessages.create(insertObj);
  },
};