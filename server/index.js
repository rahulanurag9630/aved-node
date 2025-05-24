import Config from "config";
import Routes from "./route";
import Server from "./common/server";

// const mongoUrl = `mongodb+srv://${process.env.ATLAS_CONFIG_DATABASE_USER}:${process.env.ATLAS_CONFIG_DATABASE_PASS}@${process.env.ATLAS_CONFIG_CLUSTER_HOST}/${process.env.ATLAS_CONFIG_DATABASE_NAME}`;
const mongoUrl = `mongodb+srv://anuragsinghkushwaha45:Anurag9630@cluster0.b5alv2o.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const server = new Server()
  .router(Routes)
  .configureSwagger(Config.get('swaggerDefinition'))
  .handleError()
  .configureDb(mongoUrl)
  .then((_server) => _server.listen(process.env.PORT));

export default server;