import Express from "express";
import userController from "./controller";
import auth from "../../../../helper/auth";
import upload from '../../../../helper/uploadHandler';

export default Express.Router()

  .post("/login", userController.login)
  .post("/socialLogin", userController.socialLogin)
  .post("/resendOtp", userController.resendOtp)
  .post("/userForgotPassword", userController.forgotPassword)
  .post("/verifyOtp", userController.verifyOtp)
  .post("/uploadFile", upload.uploadFile, userController.uploadFile)
  .post("/uploadMultipleFiles", upload.uploadMultipleFiles, userController.uploadMultipleFiles)


  .use(auth.verifyToken)
  .get("/getUserDetails", userController.getUserDetails)
  .post("/logout", userController.logout)
  .put("/updateProfile", userController.updateProfile)
  .post("/verifyGuardianOtp", userController.verifyGuardianOtp)
  .post("/resendGuardianOtp", userController.resendGuardianOtp)
  .post("/updateBlockStatus", userController.updateBlockStatus)
  .post("/updateHideStatus", userController.updateHideStatus)
  .post("/changePassword", userController.changePassword)
  .post("/userResetPassword", userController.resetPassword)
