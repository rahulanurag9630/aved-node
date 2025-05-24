
import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth";
import upload from '../../../../helper/uploadHandler';

export default Express.Router()

   .use(auth.verifyToken)
   .use(upload.uploadFile)
   .post("/createSubadmin", controller.createSubadmin)
   .get("/listSubadmin", controller.listSubadmin)
   .patch('/editSubAdmin' , controller.editSubAdmin)
   .put("/blockUnblockSubAdmin", controller.blockUnblockSubAdmin)
   .delete("/deleteSubAdmin", controller.deleteSubAdmin)
   .get("/viewSubAdmin", controller.viewSubAdmin)

  