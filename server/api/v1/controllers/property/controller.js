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
 * /property/addUpdateProperty:
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

    /**
 * @swagger
 * /property/listProperties:
 *   get:
 *     tags:
 *       - PROPERTY MANAGEMENT
 *     summary: List and filter properties
 *     description: Filter properties by search keyword, property type, bedrooms, bathrooms, price range, status, publish status, city, and geolocation.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: authToken
 *         description: token
 *         in: header
 *         required: true
 *       - name: search
 *         description: search keyword
 *         in: query
 *         required: false
 *       - name: property_type
 *         in: query
 *         required: false
 *       - name: no_of_bedrooms
 *         in: query
 *         type: number
 *         required: false
 *       - name: no_of_bathrooms
 *         in: query
 *         type: number
 *         required: false
 *       - name: min_price
 *         in: query
 *         type: number
 *         required: false
 *       - name: max_price
 *         in: query
 *         type: number
 *         required: false
 *       - name: status
 *         in: query
 *         enum: [ACTIVE, BLOCK]
 *         required: false
 *       - name: publish_status
 *         in: query
 *         enum: [published, draft, Published, Draft]
 *         required: false
 *       - name: city
 *         in: query
 *         required: false
 *       - name: latitude
 *         in: query
 *         type: number
 *         required: false
 *       - name: longitude
 *         in: query
 *         type: number
 *         required: false
 *       - name: page
 *         in: query
 *         type: number
 *         required: false
 *       - name: limit
 *         in: query
 *         type: number
 *         required: false
 *     responses:
 *       200:
 *         description: Data found successfully.
 *       401:
 *         description: Unauthorized.
 */
    async listProperties(req, res, next) {
        const Joi = require("joi");

        let validationSchema = Joi.object({
            search: Joi.string().optional(),
            property_type: Joi.string().optional(),
            no_of_bedrooms: Joi.number().optional(),
            no_of_bathrooms: Joi.number().optional(),
            min_price: Joi.number().optional(),
            max_price: Joi.number().optional(),
            status: Joi.string().valid("ACTIVE", "BLOCK").optional(),
            publish_status: Joi.string().valid("published", "draft", "Published", "Draft").optional(),
            city: Joi.string().optional(),
            latitude: Joi.number().optional(),
            longitude: Joi.number().optional(),
            page: Joi.number().optional().default(1),
            limit: Joi.number().optional().default(10),
        });

        try {
            let validatedBody = await validationSchema.validateAsync(req.query);

            // Check admin
            let adminData = await findUser({
                _id: req.userId,
                userType: { $in: [userType.ADMIN, userType.SUBADMIN] },
            });
            if (!adminData) throw apiError.notFound(responseMessage.ADMIN_NOT_FOUND);

            let query = {};

            if (validatedBody.search) {
                const regex = new RegExp(validatedBody.search, "i");
                query.$or = [
                    { property_name: regex },
                    { overview: regex },
                    { detailed_description: regex },
                    { address: regex }
                ];
            }

            if (validatedBody.property_type) query.property_type = validatedBody.property_type;
            if (validatedBody.no_of_bedrooms) query.no_of_bedrooms = validatedBody.no_of_bedrooms;
            if (validatedBody.no_of_bathrooms) query.no_of_bathrooms = validatedBody.no_of_bathrooms;
            if (validatedBody.status) query.status = validatedBody.status;
            if (validatedBody.publish_status) query.publish_status = validatedBody.publish_status;
            if (validatedBody.city) query.city = validatedBody.city;

            if (validatedBody.min_price || validatedBody.max_price) {
                query.price = {};
                if (validatedBody.min_price) query.price.$gte = validatedBody.min_price;
                if (validatedBody.max_price) query.price.$lte = validatedBody.max_price;
            }

            // Pagination
            let options = {
                page: validatedBody.page,
                limit: validatedBody.limit,
                sort: { createdAt: -1 },
                populate: "amenities"
            };

            // Geolocation filter (if both provided)
            if (validatedBody.latitude && validatedBody.longitude) {
                const lat = validatedBody.latitude;
                const lon = validatedBody.longitude;
                query.latitude = { $exists: true, $ne: null };
                query.longitude = { $exists: true, $ne: null };

                // Optional: filter by a radius (e.g., 10km)
                // If using MongoDB geospatial queries with GeoJSON "location" field:
                // query.location = {
                //   $nearSphere: {
                //     $geometry: {
                //       type: "Point",
                //       coordinates: [lon, lat],
                //     },
                //     $maxDistance: 10000, // 10 km
                //   },
                // };
            }

            // Use propertyServices to paginate
            let paginatedProperties = await propertyServices.paginateProperties(query, options);
            if (paginatedProperties.docs.length === 0)
                throw apiError.notFound(responseMessage.DATA_NOT_FOUND);

            return res.json(new response(paginatedProperties, responseMessage.DATA_FOUND));
        } catch (error) {
            console.log("❌ Error occurred at listProperties --->>", error);
            return next(error);
        }
    }

}

export default new propertyController();