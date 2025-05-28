const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate");

const schema = mongoose.Schema;

const options = {
    collection: "amenities",
    timestamps: true
};

const amenitiesSchema = new schema(
    {
        title: {
            type: String,
            required: true
        },
        title_ar: {
            type: String,
            required: true
        },
        image: {
            type: String,
            required: false
        },
        status: {
            type: String,
            enum: ["ACTIVE", "DELETE", "BLOCK"],
            default: "ACTIVE"
        }
    },
    options
);

amenitiesSchema.plugin(mongoosePaginate);
amenitiesSchema.plugin(mongooseAggregatePaginate);

module.exports = mongoose.model("amenities", amenitiesSchema);
