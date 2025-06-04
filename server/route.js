import user from "./api/v1/controllers/user/routes";
import admin from "./api/v1/controllers/admin/routes";

import staticContent from "./api/v1/controllers/staticContent/routes";
import contactUs from "./api/v1/controllers/contactUs/routes";
import property from "./api/v1/controllers/property/routes";



/**
 *
 *
 * @export
 * @param {any} app
 */

export default function routes(app) {
  app.use("/api/v1/user", user);
  app.use("/api/v1/admin", admin);
  app.use("/api/v1/staticContent", staticContent);

  app.use("/api/v1/contact", contactUs)
  app.use("/api/v1/property", property)

  return app;
}

