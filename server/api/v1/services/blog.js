import blogModel from "../../../models/blog";
import status from "../../../enums/status";

export const blogServices = {
  addBlog: async (insertObj) => {
    return await blogModel.create(insertObj);
  },

  updateBlog: async (id, updateObj) => {
    return await blogModel.findByIdAndUpdate(id, updateObj, { new: true });
  },

  getAllBlogs: async (query = {}) => {
    return await blogModel.find(query);
  },

  getBlogById: async (id) => {
    return await blogModel.findById(id);
  },

  deleteBlogById: async (id) => {
    return await blogModel.findByIdAndDelete(id);
  },

  deleteAllBlogs: async () => {
    return await blogModel.deleteMany({});
  },

  paginateBlogs: async (query = {}, options = {}) => {
    return await blogModel.paginate(query, options);
  }
};
