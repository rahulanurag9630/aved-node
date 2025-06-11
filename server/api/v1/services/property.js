import propertyModel from "../../../models/property";
import status from "../../../enums/status";

export const propertyServices = {
    addProperty: async (insertObj) => {
        return await propertyModel.create(insertObj);
    },

    updateProperty: async (id, updateObj) => {
        return await propertyModel.findByIdAndUpdate(id, updateObj, { new: true });
    },

    getAllProperties: async (query = {}) => {
        return await propertyModel.find(query).populate("amenities");
    },

    getPropertyById: async (id) => {
        return await propertyModel.findById(id).populate("amenities");
    },

    deletePropertyById: async (id) => {
        return await propertyModel.findByIdAndDelete(id);
    },

    deleteAllProperties: async () => {
        return await propertyModel.deleteMany({});
    },

    paginateProperties: async (query = {}, options = {}) => {
        return await propertyModel.paginate(query, options);
    },

    aggregatePaginateProperties: async (aggregateQuery, options) => {
        return await propertyModel.aggregatePaginate(aggregateQuery, options);
    },

    getPropertiesByStatus: async (statusValue) => {
        return await propertyModel.find({ status: statusValue }).populate("amenities");
    },

    updatePropertyStatus: async (id, newStatus) => {
        return await propertyModel.findByIdAndUpdate(
            id,
            { status: newStatus },
            { new: true }
        );
    },

    searchProperties: async (searchQuery) => {
        const regex = new RegExp(searchQuery, "i");
        return await propertyModel.find({
            $or: [
                { property_name: regex },
                { overview: regex },
                { detailed_description: regex },
                { address: regex }
            ]
        }).populate("amenities");
    }
};