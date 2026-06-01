import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CLUBBBB API",
      version: "1.0.0",
      description: "CLUB API documentation",
    },
    servers: [
      {
        url: "http://localhost:5001",
      },
    ],
  },

  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerSpec, swaggerUi };
