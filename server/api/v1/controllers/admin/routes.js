import Express from "express";
import adminController from "./controller";
import auth from "../../../../helper/auth";

export default Express.Router()
   
  .post("/login", adminController.login)
  .post("/forgetPassword", adminController.forgotPassword)
  .post("/verifyOtp", adminController.verifyOtp)
  .put("/resentOtp", adminController.resentOtp)
  .post("/addBlog", adminController.addBlog)
  .use(auth.verifyToken)
  .get("/listAllUsers", adminController.listAllUsers)
  .post("/changePassword" , adminController.changePassword)
  .post("/resetPassword" , adminController.resetPassword)
  .delete("/dropDatabase", adminController.dropDatabase)
  .post("/addOrUpdateBlog", adminController.addOrUpdateBlog)
  .post("/toggleBlockStatus", adminController.toggleBlockStatus)
  .post("/deleteBlog", adminController.deleteBlog)
  

  



