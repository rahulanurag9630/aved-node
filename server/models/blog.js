const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate");

const schema = mongoose.Schema;

const options = {
    collection: "blog",
    timestamps: true
};

const blogSchema = new schema(
    {
        title: {
            type: String,
            required: true
        },
        title_ar: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        description_ar: {
            type: String,
            required: true
        },
        image: {
            type: String,
            required: false
        },
        image_ar: {
            type: String,
            required: false
        },
        status: {
            type: String,
            enum: ["ACTIVE", "DELETE", "BLOCK"],
            default: "ACTIVE"
        },
    },
    options
);

blogSchema.plugin(mongoosePaginate);
blogSchema.plugin(mongooseAggregatePaginate);

module.exports = mongoose.model("blog", blogSchema);
