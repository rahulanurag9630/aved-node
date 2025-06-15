import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth";
import upload from '../../../../helper/uploadHandler';


export default Express.Router()

.post('/createContactUs', controller.createContactUs)
    .use(auth.verifyToken)
    .get('/listContactUs', controller.listContactUs)
    .get('/viewcontactus', controller.viewcontactus)
    .post("/replyContactUs" , controller.replyContactUs)
    .delete("/deleteContactUs" , controller.deleteContactUs)
    .use(upload.uploadFile)
    // .post('/createContactUs', controller.createContactUs)

