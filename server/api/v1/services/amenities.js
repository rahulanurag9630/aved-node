import amenitiesModel from "../../../models/amenities";
import status from "../../../enums/status";

export const amenitiesServices = {
    addAmenities: async (insertObj) => {
        return await amenitiesModel.create(insertObj);
    },

    updateAmenities: async (id, updateObj) => {
        return await amenitiesModel.findByIdAndUpdate(id, updateObj, { new: true });
    },

    getAllAmenities: async (query = {}) => {
        return await amenitiesModel.find(query);
    },

    getAmenitiesById: async (id) => {
        return await amenitiesModel.findById(id);
    },

    deleteAmenitiesById: async (id) => {
        return await amenitiesModel.findByIdAndDelete(id);
    },

    deleteAllAmenities: async () => {
        return await amenitiesModel.deleteMany({});
    },

    paginateAmenities: async (query = {}, options = {}) => {
        return await amenitiesModel.paginate(query, options);
    }
};
