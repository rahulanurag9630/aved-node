import Express from "express";
import auth from "../../../../helper/auth";
import propertyController from "./controller";
export default Express.Router()

    .get("/listPropertiesUser", propertyController.listPropertiesUserPublic)
    .post("/getPropertyById", propertyController.getPropertyById)
    .post("/createView", propertyController.createView)


    .use(auth.verifyToken)

    .post("/addUpdateProperty", (req, res, next) => propertyController.addUpdateProperty(req, res, next))
    .get("/listProperties", (req, res, next) => propertyController.listProperties(req, res, next))
    .put("/toggleBlockProperty", (req, res, next) => propertyController.toggleBlockProperty(req, res, next))
    .delete("/deleteProperty", (req, res, next) => propertyController.deleteProperty(req, res, next))
//   .get("/listProperties", (req, res, next) => propertyController.listProperties(req, res, next))
//   .get("/getPropertyById/:id", (req, res, next) => propertyController.getPropertyById(req, res, next))
//   .delete("/deleteProperty/:id", (req, res, next) => propertyController.deleteProperty(req, res, next));
