import Mongoose, { Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import bcrypt from "bcryptjs";
import status from "../enums/status";
import userType from "../enums/userType";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";

const userSchema = new Mongoose.Schema(
  {
    userType: { 
      type: String,
      enum: [userType.USER, userType.ADMIN , userType.SUBADMIN],
      default: userType.USER
    },
    socialId: { type: String,  unique: true, sparse: true    },
    provider: { type: String },
 name: { type: String },
    email: { type: String, unique: true, sparse: true },
     profilePic: { type: String },
    mobileNumber: { type: String, unique: true, sparse: true },
    password: { type: String, required: false },
    permissions: { type: Object},
    otp: { type: String },
    otpExpiresAt: { type: String },
    isVerified: { type: Boolean, default: false },
    isProfileCompleted: { type: Boolean, default: false },
    deviceTokens: [{ type: String }],
    isActive: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: [status.ACTIVE, status.BLOCK, status.DELETE],
      default: status.ACTIVE
    },
    blockedUsers: [{
      type: Mongoose.Schema.Types.ObjectId,
      ref: "users"
    }],
    hiddenMatches: [{
      type: Mongoose.Schema.Types.ObjectId,
      ref: "users"
    }],
    isActive: {
      type: Boolean,
      default: false
    },
    pushNotification: {
      type: Boolean,
      default: false
    },
    sendEmail: {
      type: Boolean,
      default: false
    },
    showOnlineStatus: {
      type: Boolean,
      default: false
    },
  
  },
  { timestamps: true }
);

userSchema.plugin(mongoosePaginate);
userSchema.plugin(mongooseAggregatePaginate);
module.exports = Mongoose.model("users", userSchema);

Mongoose.model("users", userSchema)
  .find({ userType: userType.ADMIN, status: status.ACTIVE })
  .then((existingUser) => {
    if (existingUser.length != 0) {
      console.log("👨 Default Admin already created.");
    } else {
      let userObj = {
        userType: userType.ADMIN,
        email: "avedadmin@mailinator.com",
        mobileNumber: "+91 1234567890",
        password: bcrypt.hashSync("aved@1"),
        isVerified: true,
        socialId: "ADMIN",
        name: "Vipul"
      };
      return Mongoose.model("users", userSchema).create(userObj);
    }
  })
  .then((createdUser) => {
    if (createdUser) {
      console.log("Default Admin Created", createdUser);
    }
  })
  .catch((err) => {
    console.log("Error:", err);
  });
