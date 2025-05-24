import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
import status from "../enums/status";

const chatRoomSchema = new Schema(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    roomKey: {
      type: String,
      unique: true,
      required: true,
    },
    senderSocketId: {
      type: String,
    },
    receiverSocketId: {
      type: String,
    },
    lastMessage: {
      type: String,
    },
    lastMessageAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: [status.ACTIVE, status.INACTIVE],
      default: status.ACTIVE,
    },
  },
  { timestamps: true }
);

chatRoomSchema.pre("validate", function (next) {
  if (this.senderId && this.receiverId) {
    const ids = [this.senderId.toString(), this.receiverId.toString()].sort();
    this.roomKey = ids.join("_");
  }
  next();
});

chatRoomSchema.plugin(mongoosePaginate);
chatRoomSchema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model("chatRooms", chatRoomSchema);
