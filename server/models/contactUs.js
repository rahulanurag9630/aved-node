const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
var mongooseAggregatePaginate = require("mongoose-aggregate-paginate");
import status from '../enums/status';
const schema = mongoose.Schema;

const options = {
    collection: "contactUs",
    timestamps: true
};

var contactUsSchema = new schema(
    {
        userId: {
            type: schema.Types.ObjectId,
            ref: "users"
        },
        name: { type: String },
        email: { type: String },
        message: { type: String },
        attachFile:  { type: String },
        replayMessage: {
            type:  String,
            default: ""
        },
        replayStatus: {
            type: Boolean,
            default: false
        },
        status: {
            type: String,
            enum: [status.ACTIVE, status.DELETE, status.BLOCK],
            default: status.ACTIVE
        },
    },
    options
);

contactUsSchema.plugin(mongoosePaginate);
contactUsSchema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model("contactUs", contactUsSchema);







