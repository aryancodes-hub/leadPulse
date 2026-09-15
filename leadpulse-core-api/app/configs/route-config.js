const path = require("path");
const routes = require("./route.config.json");
const middleware = require("../middleware");
require("../components/auth/auth.controller.js");

module.exports = (app) => {
  const controllers = new Map();
  routes.forEach((route) => {
    const controllerPath = path.resolve(
      __dirname,
      `../components/${route.controller}/${route.controller}.controller.js`,
    );
    if (!controllers.has(controllerPath)) {
      controllers.set(controllerPath, new (require(controllerPath))());
    }
    const controller = controllers.get(controllerPath);
    if (typeof app[route.method] !== "function") {
      throw new Error(`Unknown method: ${route.method}`);
    }
    if (typeof controller[route.action] !== "function") {
      throw new Error(`Unknown method: ${route.action}`);
    }
    const chain = route.middlewareNameList.map((name) => {
      if (!middleware[name]) {
        throw new Error(`Unknown middleware: ${name}`);
      }
      return middleware[name];
    });
    app[route.method](
      route.route,
      ...chain,
      controller[route.action].bind(controller),
    );
  });
};
