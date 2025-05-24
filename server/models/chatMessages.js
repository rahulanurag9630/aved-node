import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
import status from "../enums/status";
import messageType from "../enums/messageType";

const chatMessageSchema = new Schema(
  {
    senderId: { 
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "chatRooms",
      required: true,
    },
    content: {
      type: String,
    },
    messageType: {
      type: String,
      enum: [messageType.MESSAGE, messageType.IMAGE, messageType.VIDEO, messageType.DOCUMENT],
      default: messageType.MESSAGE,
    },
    caption: {
      type: String,
    },
    thumbnail: {
      type: String,
    },
    status: {
      type: String,
      default: status.ACTIVE,
    }
  },
  { timestamps: true }
);

chatMessageSchema.plugin(mongoosePaginate);
chatMessageSchema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model("chatMessages", chatMessageSchema);
