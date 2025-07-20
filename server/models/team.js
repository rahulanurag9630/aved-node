const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate");

const schema = mongoose.Schema;

const options = {
    collection: "team",
    timestamps: true
};

const teamSchema = new schema(
    {
        name: {
            type: String,
            required: true
        },
        position: {
            type: String,
            required: true
        },
        thoughts: {
            type: String,
            required: true
        },
        name_ar: {
            type: String,
            required: true
        },
        position_ar: {
            type: String,
            required: true
        },
        thoughts_ar: {
            type: String,
            required: true
        },
        facebook: {
            type: String,
            required: false
        },
        instagram: {
            type: String,
            required: false
        },
        linkedin: {
            type: String,
            required: false
        },

        image: {
            type: String,
            required: false
        },
        status: {
            type: String,
            enum: ["ACTIVE", "DELETE", "BLOCK"],
            default: "ACTIVE"
        },
        order: {
            type: Number,
            default: 0,
        }

    },
    options
);

teamSchema.plugin(mongoosePaginate);
teamSchema.plugin(mongooseAggregatePaginate);

module.exports = mongoose.model("team", teamSchema);
