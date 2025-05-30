const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate");

const schema = mongoose.Schema;

const options = {
    collection: "properties",
    timestamps: true
};

const propertySchema = new schema(
    {
        property_name: { type: String, required: true },
        property_name_ar: { type: String },
        overview: { type: String },
        overview_ar: { type: String },
        detailed_description: { type: String },
        detailed_description_ar: { type: String },
        price: { type: Number, required: true },
        apartment_number: { type: String },
        no_of_bedrooms: { type: Number },
        no_of_bathrooms: { type: Number },
        year_of_built: { type: Number },
        amenities: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "amenities"
        }],
        area_sqft: { type: Number },
        parking_space: { type: String },
        property_type: { type: String },
        listing_type: { type: String },
        availability_status: { type: String },
        status: {
            type: String,
            enum: ["ACTIVE", "BLOCK"],
            default: "ACTIVE"
        },
        address: { type: String },
        latitude: { type: Number },
        longitude: { type: Number },
        images: [{ type: String }],
        no_of_floors: { type: Number },
        floor_plan: [{
            photo: { type: String },
            description: { type: String }
        }],
        seo_meta_titles: { type: String },
        seo_meta_tags: { type: String },
        publish_status: {
            type: String,
            enum: ["published", "draft"],
            default: "draft"
        }
    },
    options
);

propertySchema.plugin(mongoosePaginate);
propertySchema.plugin(mongooseAggregatePaginate);

module.exports = mongoose.model("property", propertySchema);
