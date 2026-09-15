const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Leadpulse API',
      version: '1.0.0',
      description: 'API documentation for the Leadpulse platform',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  // Scan all controller/route files for Swagger annotations
  apis: ['./app/components/**/*.js'], 
};

const specs = swaggerJsdoc(options);

module.exports = specs;
