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
        property_name: {
            type: String,
            required: true
        },
        property_name_ar: {
            type: String
        },
        overview: {
            type: String
        },
        overview_ar: {
            type: String
        },
        detailed_description: {
            type: String
        },
        detailed_description_ar: {
            type: String
        },
        price: {
            type: Number,
        },
        price_min: {
            type: Number,
        },
        price_max: {
            type: Number,
        },
        apartment_number: {
            type: String
        },
        videoUrl: {
            type: String
        },
        no_of_bedrooms: {
            type: Number
        },
        no_of_bathrooms: {
            type: Number
        },
        year_of_built: {
            type: Number
        },
        amenities: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "amenities"
        }],
        area_sqft: {
            type: Number
        },
        parking_space: {
            type: String
        },
        property_type: {
            type: String
        },
        listing_type: {
            type: String
        },
        availability_status: {
            type: String
        },
        status: {
            type: String,
            enum: ["ACTIVE", "BLOCK"],
            default: "ACTIVE"
        },
        address: { type: String },
        address_ar: { type: String },
        city: { type: String },
        state: { type: String },
        brochure: { type: String },
        latitude: { type: Number },
        longitude: { type: Number },
        // ✅ New: location field for geospatial queries
        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point"
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                index: "2dsphere"
            }
        },
        images: [{ type: String }],
        interiorDesign: [{ type: String }],
        exteriorDesign: [{ type: String }],
        virtualTour: { type: String },
        partners: [{ type: String }],
        no_of_floors: { type: Number },
        floor_plan: [{
            photo: { type: String },
            description: { type: String },
            images: [{ type: String }]
        }],
        bathrooms: [{
            photo: { type: String },
            images: [{ type: String }]
        }],
        bedrooms: [{
            photo: { type: String },
            images: [{ type: String }]
        }],
        landmarks: [{
            photo: { type: String },
            description: { type: String }
        }],
        no_of_floors: {
            type: Number
        },
        floor_plan_photos: [{
            type: String
        }],
        seo_meta_titles: {
            type: String
        },
        seo_meta_tags: {
            type: String
        },
        publish_status: {
            type: String,
            enum: ["published", "draft", "Published", "Draft"],
            default: "draft"
        },
        views: {
            type: Number,
            default: 0
        }
    },
    options
);

// 🌟 Pre-save hook to set location automatically
propertySchema.pre("save", function (next) {
    if (this.latitude && this.longitude) {
        this.location = {
            type: "Point",
            coordinates: [this.longitude, this.latitude]
        };
    }
    next();
});

// Plugins
propertySchema.plugin(mongoosePaginate);
propertySchema.plugin(mongooseAggregatePaginate);

module.exports = mongoose.model("property", propertySchema);
