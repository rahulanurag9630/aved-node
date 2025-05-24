import Mongoose, { Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
import status from '../enums/status';
import notificationStatus from '../enums/notificationStatus';


const notificationSchema = new Schema({
    userId: {
        type: Mongoose.Schema.ObjectId,
        ref: "users",
        required: true
    },
    title: {
        type: String
    },
    body: {
        type: String
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isHide: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        default: status.ACTIVE
    },
    type: {
        type: String,
        enum: [notificationStatus.INFO, notificationStatus.WARNING, notificationStatus.MESSAGE, notificationStatus.ALERT],
        default: notificationStatus.INFO
    },
}, {
    timestamps: true
})
notificationSchema.plugin(mongoosePaginate);
module.exports = Mongoose.model("notification", notificationSchema);
