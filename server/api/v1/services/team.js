import teamModel from "../../../models/team";
import status from "../../../enums/status";

export const teamServices = {
  // Add a new team member
  addTeam: async (insertObj) => {
    return await teamModel.create(insertObj);
  },

  // Update an existing team member
  updateTeam: async (id, updateObj) => {
    return await teamModel.findByIdAndUpdate(id, updateObj, { new: true });
  },

  // Get all team members (optional query filter)
  getAllTeams: async (query = {}) => {
    return await teamModel.find(query);
  },

  // Get team member by ID
  getTeamById: async (id) => {
    return await teamModel.findById(id);
  },

  // Delete one team member by ID
  deleteTeamById: async (id) => {
    return await teamModel.findByIdAndDelete(id);
  },

  // Delete all team members
  deleteAllTeams: async () => {
    return await teamModel.deleteMany({});
  },

  // Paginate team members
  paginateTeams: async (query = {}, options = {}) => {
    return await teamModel.paginate(query, options);
  }
};
