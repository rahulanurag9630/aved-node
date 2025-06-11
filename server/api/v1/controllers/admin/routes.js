import Express from "express";
import adminController from "./controller";
import auth from "../../../../helper/auth";

export default Express.Router()

  .post("/login", adminController.login)
  .get("/getAdminDetails", adminController.getAdminDetails)
  .post("/updateAdminDetails", adminController.updateAdminDetails)
  .post("/forgetPassword", adminController.forgotPassword)
  .post("/verifyOtp", adminController.verifyOtp)
  .put("/resentOtp", adminController.resentOtp)
  .get("/blogs", adminController.listPublicBlogs)
  .get("/publicList", adminController.publicList)
  .use(auth.verifyToken)
  .get("/listAllUsers", adminController.listAllUsers)
  .post("/changePassword", adminController.changePassword)
  .post("/resetPassword", adminController.resetPassword)
  .delete("/dropDatabase", adminController.dropDatabase)
  .post("/addUpdateAmenities", adminController.addUpdateAmenity)
  .get("/listAmenities", adminController.listAmenities)
  .post("/addOrUpdateBlog", adminController.addOrUpdateBlog)
  .patch("/toggleAmenityStatus", adminController.toggleAmenityStatus)
  .post("/toggleBlockStatus", adminController.toggleBlockStatus)
  .post("/deleteBlog", adminController.deleteBlog)
  .get("/listBlogs", adminController.listBlogs)
  .post("/addOrUpdateTeam", adminController.addOrUpdateTeam)
  .get("/listTeam", adminController.listTeam)
  .post("/toggleBlockTeamStatus", adminController.toggleBlockTeamStatus)
  .post("/deleteTeam", adminController.deleteTeam)
  .get("/getDashboardData", adminController.getDashboardData)












