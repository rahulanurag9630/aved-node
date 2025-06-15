const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate");

const schema = mongoose.Schema;

const options = {
    collection: "property_views",
    timestamps: true
};

const propertyViewSchema = new schema(
    {
        propertyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "property", // Replace with your actual property model name if different
            required: true
        }
    },
    options
);

propertyViewSchema.plugin(mongoosePaginate);
propertyViewSchema.plugin(mongooseAggregatePaginate);

module.exports = mongoose.model("property_views", propertyViewSchema);
