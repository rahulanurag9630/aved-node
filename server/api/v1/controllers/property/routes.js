import Express from "express";
import auth from "../../../../helper/auth";
import propertyController from "./controller";
export default Express.Router()
    .use(auth.verifyToken)

    .post("/addUpdateProperty", (req, res, next) => propertyController.addUpdateProperty(req, res, next))
//   .get("/listProperties", (req, res, next) => propertyController.listProperties(req, res, next))
//   .get("/getPropertyById/:id", (req, res, next) => propertyController.getPropertyById(req, res, next))
//   .delete("/deleteProperty/:id", (req, res, next) => propertyController.deleteProperty(req, res, next));
