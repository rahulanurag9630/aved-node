import Joi from "joi";
import apiError from "../../../../helper/apiError";
import response from "../../../../../assets/response";
import responseMessage from "../../../../../assets/responseMessage";
import { propertyServices } from "../../services/property";
import { userServices } from "../../services/user";
import userType from "../../../../enums/userType";
import { propertyViewServices } from "../../services/view";

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
    *             videoUrl:
    *               type: string
    *             price:
    *               type: number
    *             price_min:
    *               type: number
    *             price_max:
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
    *                   images:
    *                     type: array
    *                     items:
    *                       type: string
    *             landmarks:
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
    *               enum: [published, draft, Published, Draft]
    *             status:
    *               type: string
    *               enum: [ACTIVE, BLOCK, Published, Draft]
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
            videoUrl: Joi.string().optional(),
            brochure: Joi.string().optional(),
            price: Joi.number().optional(),
            price_min: Joi.number().optional(),
            price_max: Joi.number().optional(),
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
            address_ar: Joi.string().optional(),
            latitude: Joi.number().optional(),
            longitude: Joi.number().optional(),
            images: Joi.array().items(Joi.string()).optional(),
            interiorDesign: Joi.array().items(Joi.string()).optional(),
            exteriorDesign: Joi.array().items(Joi.string()).optional(),
            virtualTour: Joi.string().optional(),

            partners: Joi.array().items(Joi.string()).optional(),
            no_of_floors: Joi.number().optional(),
            floor_plan: Joi.array().items(
                Joi.object({
                    photo: Joi.string().optional(),
                    description: Joi.string().optional(),
                    images: Joi.array().items(Joi.string()).optional()
                })
            ).optional(),
            bathrooms: Joi.array().items(
                Joi.object({
                    photo: Joi.string().optional(),
                    images: Joi.array().items(Joi.string()).optional()
                })
            ).optional(),
            bedrooms: Joi.array().items(
                Joi.object({
                    photo: Joi.string().optional(),
                    images: Joi.array().items(Joi.string()).optional()
                })
            ).optional(),
            landmarks: Joi.array().items(
                Joi.object({
                    photo: Joi.string().optional(),
                    description: Joi.string().optional()
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
                result = await propertyServices.updateProperty(validatedBody.id, validatedBody);
                if (!result) throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
            } else {
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
            // let adminData = await findUser({
            //     _id: req.userId,
            //     userType: { $in: [userType.ADMIN, userType.SUBADMIN] },
            // });
            // if (!adminData) throw apiError.notFound(responseMessage.ADMIN_NOT_FOUND);

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
                if (validatedBody.min_price) query.price_min.$gte = validatedBody.min_price;
                if (validatedBody.max_price) query.price_max.$lte = validatedBody.max_price;
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


    /**
 * @swagger
 * /property/listPropertiesUser:
 *   get:
 *     tags:
 *       - PROPERTY MANAGEMENT (PUBLIC)
 *     summary: Public list and filter properties
 *     description: Publicly filter properties by keyword, property type, bedrooms, bathrooms, price range, area range, status, publish status, availability status, city, and geolocation. No token required.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: search
 *         description: Search keyword
 *         in: query
 *         required: false
 *         type: string
 *       - name: property_type
 *         in: query
 *         required: false
 *         type: string
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
 *       - name: min_area_sqft
 *         in: query
 *         type: number
 *         required: false
 *         description: Minimum area in sqft
 *       - name: max_area_sqft
 *         in: query
 *         type: number
 *         required: false
 *         description: Maximum area in sqft
 *       - name: status
 *         in: query
 *         enum: [ACTIVE, BLOCK]
 *         required: false
 *         type: string
 *       - name: publish_status
 *         in: query
 *         enum: [published, draft, Published, Draft]
 *         required: false
 *         type: string
 *       - name: availability_status
 *         in: query
 *         type: string
 *         required: false
 *         description: Availability status of the property (e.g., available, sold, rented)
 *       - name: city
 *         in: query
 *         required: false
 *         type: string
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
 *       400:
 *         description: Validation or filter error.
 *       404:
 *         description: No properties found.
 */


    async listPropertiesUserPublic(req, res, next) {
        const Joi = require("joi");
        const validationSchema = Joi.object({
            search: Joi.string().optional(),
            property_type: Joi.string().optional(),
            no_of_bedrooms: Joi.number().optional(),
            no_of_bathrooms: Joi.number().optional(),
            min_price: Joi.number().optional(),
            max_price: Joi.number().optional(),
            status: Joi.string().valid("ACTIVE", "BLOCK").optional(),
            publish_status: Joi.string().valid("published", "draft", "Published", "Draft").optional(),
            availability_status: Joi.string().optional(), // ✅ New filter
            city: Joi.string().optional(),
            latitude: Joi.number().optional(),
            longitude: Joi.number().optional(),
            min_area_sqft: Joi.number().optional(),  // ✅ Add this
            max_area_sqft: Joi.number().optional(),  // ✅ Add this
            page: Joi.number().optional().default(1),
            limit: Joi.number().optional().default(10),
        });

        try {
            const validatedBody = await validationSchema.validateAsync(req.query);

            const query = { status: "ACTIVE" };

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
            if (validatedBody.no_of_bedrooms !== undefined)
                query.no_of_bedrooms = { $lte: validatedBody.no_of_bedrooms };

            if (validatedBody.no_of_bathrooms !== undefined)
                query.no_of_bathrooms = { $lte: validatedBody.no_of_bathrooms };

            if (validatedBody.status) query.status = validatedBody.status;
            if (validatedBody.publish_status) query.publish_status = validatedBody.publish_status;
            if (validatedBody.city) query.city = validatedBody.city;

            console.log(validatedBody.min_price, validatedBody.max_price, query.price_min)
            if (validatedBody.min_price || validatedBody.max_price) {
                query.price_min = {}
                query.price_max = {}
                if (validatedBody.min_price) query.price_min.$gte = validatedBody.min_price;
                if (validatedBody.max_price) query.price_max.$lte = validatedBody.max_price;
            }

            if (validatedBody.latitude && validatedBody.longitude) {
                query.latitude = { $exists: true, $ne: null };
                query.longitude = { $exists: true, $ne: null };
            }
            if (validatedBody.min_area_sqft || validatedBody.max_area_sqft) {
                query.area_sqft = {};
                if (validatedBody.min_area_sqft) query.area_sqft.$gte = validatedBody.min_area_sqft;
                if (validatedBody.max_area_sqft) query.area_sqft.$lte = validatedBody.max_area_sqft;
            }
            if (validatedBody.availability_status)
                query.availability_status = validatedBody.availability_status;

            const options = {
                page: validatedBody.page,
                limit: validatedBody.limit,
                sort: { createdAt: -1 },
                populate: "amenities"
            };

            const paginatedProperties = await propertyServices.paginateProperties(query, options);
            if (!paginatedProperties.docs.length) {
                throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
            }

            return res.json(new response(paginatedProperties, responseMessage.DATA_FOUND));
        } catch (error) {
            console.log("❌ Error at listPropertiesUserPublic --->>", error);
            return next(error);
        }
    }



    /**
 * @swagger
 * /property/toggleBlockProperty:
 *   put:
 *     tags:
 *       - PROPERTY MANAGEMENT
 *     summary: Toggle property status between ACTIVE and BLOCK
 *     description: Toggles the status of a property. If it's ACTIVE, it will become BLOCK. If it's BLOCK, it will become ACTIVE.
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: header
 *         name: authToken
 *         required: true
 *         description: Admin authorization token
 *         type: string
 *       - in: body
 *         name: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - propertyId
 *           properties:
 *             propertyId:
 *               type: string
 *               example: "664f998ddeab793dfcb7ba10"
 *     responses:
 *       200:
 *         description: Property status toggled successfully.
 *       400:
 *         description: Bad request.
 *       401:
 *         description: Unauthorized access.
 *       404:
 *         description: Property or Admin not found.
 */
    async toggleBlockProperty(req, res, next) {
        const Joi = require("joi");

        const schema = Joi.object({
            propertyId: Joi.string().required(),
        });

        try {
            const { propertyId } = await schema.validateAsync(req.body);

            // Check admin authentication
            const adminData = await findUser({
                _id: req.userId,
                userType: { $in: [userType.ADMIN, userType.SUBADMIN] },
            });
            if (!adminData) throw apiError.notFound(responseMessage.ADMIN_NOT_FOUND);

            // Fetch property
            const property = await propertyServices.getPropertyById(propertyId);
            if (!property) throw apiError.notFound(responseMessage.DATA_NOT_FOUND);

            // Toggle status
            const newStatus = property.status === "ACTIVE" ? "BLOCK" : "ACTIVE";

            const updatedProperty = await propertyServices.updatePropertyStatus(propertyId, newStatus);

            return res.json(new response(updatedProperty, `Property status updated to ${newStatus}`));
        } catch (error) {
            console.log("❌ Error at toggleBlockProperty --->>", error);
            return next(error);
        }
    }

    /**
 * @swagger
 * /property/deleteProperty:
 *   delete:
 *     tags:
 *       - PROPERTY MANAGEMENT
 *     summary: Delete a property by ID
 *     description: Permanently deletes a property based on the provided ID.
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: header
 *         name: authToken
 *         required: true
 *         description: Admin authorization token
 *         type: string
 *       - in: body
 *         name: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - propertyId
 *           properties:
 *             propertyId:
 *               type: string
 *               example: "664f998ddeab793dfcb7ba10"
 *     responses:
 *       200:
 *         description: Property deleted successfully.
 *       400:
 *         description: Bad request.
 *       401:
 *         description: Unauthorized access.
 *       404:
 *         description: Property or Admin not found.
 */
    async deleteProperty(req, res, next) {
        const Joi = require("joi");

        const schema = Joi.object({
            propertyId: Joi.string().required(),
        });

        try {
            const { propertyId } = await schema.validateAsync(req.body);

            // Check admin
            const adminData = await findUser({
                _id: req.userId,
                userType: { $in: [userType.ADMIN, userType.SUBADMIN] },
            });
            if (!adminData) throw apiError.notFound(responseMessage.ADMIN_NOT_FOUND);

            // Delete property
            const deleted = await propertyServices.deletePropertyById(propertyId);
            if (!deleted) throw apiError.notFound(responseMessage.DATA_NOT_FOUND);

            return res.json(new response({}, "Property deleted successfully."));
        } catch (error) {
            console.log("❌ Error at deleteProperty --->>", error);
            return next(error);
        }
    }


    /**
 * @swagger
 * /property/listPaginatedProperties:
 *   get:
 *     tags:
 *       - PROPERTY MANAGEMENT
 *     summary: List properties with pagination
 *     description: Fetch a paginated list of properties. You can apply filters, page number, and limit.
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: header
 *         name: authToken
 *         required: true
 *         description: Admin authorization token
 *         type: string
 *       - in: query
 *         name: page
 *         required: false
 *         type: integer
 *         default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         required: false
 *         type: integer
 *         default: 10
 *         description: Number of records per page
 *       - in: query
 *         name: status
 *         required: false
 *         type: string
 *         enum: [ACTIVE, BLOCK]
 *         description: Filter properties by status
 *     responses:
 *       200:
 *         description: Properties retrieved successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
    async listPaginatedProperties(req, res, next) {
        try {
            const { page = 1, limit = 10, status } = req.query;

            const filter = {};
            if (status) filter.status = status;

            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                populate: "amenities"
            };

            const result = await propertyServices.paginateProperties(filter, options);
            return res.json(new response(result, "Properties fetched successfully"));
        } catch (error) {
            console.log("❌ Error at listPaginatedProperties --->>", error);
            return next(error);
        }
    }
    /**
     * @swagger
     * /property/getPropertyById:
     *   post:
     *     tags:
     *       - PROPERTY MANAGEMENT
     *     summary: Get a property by ID
     *     description: Retrieves a single property by its ID, including populated amenities.
     *     consumes:
     *       - application/json
     *     produces:
     *       - application/json
     *     parameters:
     *       - in: header
     *         name: authToken
     *         required: true
     *         description: Admin authorization token
     *         type: string
     *       - in: body
     *         name: body
     *         required: true
     *         schema:
     *           type: object
     *           required:
     *             - propertyId
     *           properties:
     *             propertyId:
     *               type: string
     *               example: "68449238434bac4e49db4c16"
     *     responses:
     *       200:
     *         description: Property retrieved successfully.
     *       400:
     *         description: Bad request.
     *       401:
     *         description: Unauthorized access.
     *       404:
     *         description: Property or Admin not found.
     */
    async getPropertyById(req, res, next) {
        const schema = Joi.object({
            propertyId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
                "string.pattern.base": "Invalid property ID format.",
                "any.required": "Property ID is required.",
            }),
        });

        try {
            const { propertyId } = await schema.validateAsync(req.body);


            // Fetch property
            const view = await propertyViewServices.createView({ propertyId: propertyId });
            // 2. Get the current property
            const property1 = await propertyServices.getPropertyById(propertyId);
            if (!property1) return next(apiError.notFound("Property not found"));

            // 3. Increment views using updateProperty
            await propertyServices.updateProperty(propertyId, {
                views: (property1.views || 0) + 1
            });
            const property = await propertyServices.getPropertyById(propertyId);
            if (!property) throw apiError.notFound("Property not found");

            return res.json(new response(property, "Property retrieved successfully"));
        } catch (error) {
            console.log("❌ Error at getPropertyById --->>", error);
            return next(error);
        }
    }

    /**
     * @swagger
     * /property/createView:
     *   post:
     *     summary: Create a property view
     *     description: Records a view for a property by propertyId.
     *     tags: [PropertyView]
     *     parameters:
     *       - name: authToken
     *         in: header
     *         required: true
     *         description: Auth token
     *         type: string
     *       - in: body
     *         name: body
     *         required: true
     *         description: propertyId to create a view for
     *         schema:
     *           type: object
     *           properties:
     *             propertyId:
     *               type: string
     *               example: "666b12345c9ef9..."
     *     responses:
     *       '200':
     *         description: Property view created successfully.
     *       '400':
     *         description: Bad Request.
     *       '500':
     *         description: Internal Server Error.
     */
    async createView(req, res, next) {
        const schema = Joi.object({
            propertyId: Joi.string().required(),
        });

        const { error, value } = schema.validate(req.body);
        if (error) return next(apiError.badRequest(error.details[0].message));

        try {
            const view = await propertyViewServices.createView(value);
            // 2. Get the current property
            const property = await propertyServices.getPropertyById(value.propertyId);
            if (!property) return next(apiError.notFound("Property not found"));

            // 3. Increment views using updateProperty
            await propertyServices.updateProperty(value.propertyId, {
                views: (property.views || 0) + 1
            });

            return res.json({ message: "View recorded successfully", view });
        } catch (err) {
            return next(err);
        }
    }

}

export default new propertyController();