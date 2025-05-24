import Express from "express";
import staticController from "./controller";
import auth from "../../../../helper/auth";

export default Express.Router()

  .get("/getAllStaticContent", staticController.getAllStaticContent)
  .get("/getAllStaticContentByType", staticController.getAllStaticContentByType)

  .use(auth.verifyToken)
  .post("/addStaticContent", staticController.addStaticContent)
  .put("/updateStaticContent", staticController.updateStaticContent)
  .delete("/deleteAllStaticContent", staticController.deleteAllStaticContent)