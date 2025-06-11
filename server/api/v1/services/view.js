import propertyViewModel from "../../../models/views"; // path may vary

export const propertyViewServices = {
    createView: async (insertObj) => {
        return await propertyViewModel.create(insertObj);
    },

    getAllViews: async (query = {}) => {
        return await propertyViewModel.find(query);
    }
};
