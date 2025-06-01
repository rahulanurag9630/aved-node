import Joi from "joi";
import apiError from "../../../../helper/apiError";
import response from "../../../../../assets/response";
import responseMessage from "../../../../../assets/responseMessage";
import { propertyServices } from "../../services/property";
import { userServices } from "../../services/user";
import userType from "../../../../enums/userType";

const { findUser } = userServices;

export class propertyController {
    /**
 * @swagger
 * /admin/addUpdateProperty:
 *   post:
 *     tags:
 *       - PROPERTY MANAGEMENT
 *     description: Create a new property or update an existing one based on the presence of an ID.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: authToken
 *         in: header
 *         required: true
 *         description: Admin authentication token
 *       - in: body
 *         name: body
 *         description: Property details
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: Property ID (if updating)
 *             property_name:
 *               type: string
 *             property_name_ar:
 *               type: string
 *             overview:
 *               type: string
 *             overview_ar:
 *               type: string
 *             detailed_description:
 *               type: string
 *             detailed_description_ar:
 *               type: string
 *             price:
 *               type: number
 *             apartment_number:
 *               type: string
 *             no_of_bedrooms:
 *               type: number
 *             no_of_bathrooms:
 *               type: number
 *             year_of_built:
 *               type: number
 *             amenities:
 *               type: array
 *               items:
 *                 type: string
 *             area_sqft:
 *               type: number
 *             parking_space:
 *               type: string
 *             property_type:
 *               type: string
 *             listing_type:
 *               type: string
 *             availability_status:
 *               type: string
 *             address:
 *               type: string
 *             latitude:
 *               type: number
 *             longitude:
 *               type: number
 *             images:
 *               type: array
 *               items:
 *                 type: string
 *             no_of_floors:
 *               type: number
 *             floor_plan:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   photo:
 *                     type: string
 *                   description:
 *                     type: string
 *             seo_meta_titles:
 *               type: string
 *             seo_meta_tags:
 *               type: string
 *             publish_status:
 *               type: string
 *               enum: [published, draft]
 *             status:
 *               type: string
 *               enum: [ACTIVE, BLOCK]
 *     responses:
 *       200:
 *         description: Property created/updated successfully.
 *       400:
 *         description: Invalid input.
 *       401:
 *         description: Unauthorized access.
 */
    async addUpdateProperty(req, res, next) {
        const validationSchema = Joi.object({
            id: Joi.string().optional(),
            property_name: Joi.string().required(),
            property_name_ar: Joi.string().optional(),
            overview: Joi.string().optional(),
            overview_ar: Joi.string().optional(),
            detailed_description: Joi.string().optional(),
            detailed_description_ar: Joi.string().optional(),
            price: Joi.number().required(),
            apartment_number: Joi.string().optional(),
            no_of_bedrooms: Joi.number().optional(),
            no_of_bathrooms: Joi.number().optional(),
            year_of_built: Joi.number().optional(),
            amenities: Joi.array().items(Joi.string()).optional(),
            area_sqft: Joi.number().optional(),
            parking_space: Joi.string().optional(),
            property_type: Joi.string().optional(),
            listing_type: Joi.string().optional(),
            availability_status: Joi.string().optional(),
            address: Joi.string().optional(),
            latitude: Joi.number().optional(),
            longitude: Joi.number().optional(),
            images: Joi.array().items(Joi.string()).optional(),
            no_of_floors: Joi.number().optional(),
            floor_plan: Joi.array().items(
                Joi.object({
                    photo: Joi.string(),
                    description: Joi.string()
                })
            ).optional(),
            seo_meta_titles: Joi.string().optional(),
            seo_meta_tags: Joi.string().optional(),
            publish_status: Joi.string().valid("published", "draft", "Published", "Draft").optional(),
            status: Joi.string().valid("ACTIVE", "BLOCK", "Published", "Draft").optional()
        });

        try {
            const validatedBody = await validationSchema.validateAsync(req.body);

            // Check for admin permissions
            const adminData = await findUser({
                _id: req.userId,
                userType: { $in: [userType.ADMIN, userType.SUBADMIN] }
            });
            if (!adminData) throw apiError.notFound(responseMessage.ADMIN_NOT_FOUND);

            let result;
            if (validatedBody.id) {
                // Update property
                result = await propertyServices.updateProperty(validatedBody.id, validatedBody);
                if (!result) throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
            } else {
                // Create new property
                result = await propertyServices.addProperty(validatedBody);
            }

            return res.json(new response(result, responseMessage.PROPERTY_ADD_UPDATED_SUCESS));
        } catch (error) {
            console.log("❌ Error in addUpdateProperty --->>", error);
            return next(error);
        }
    }
}

export default new propertyController();