import swaggerUi from "swagger-ui-express";
import type { Express } from "express";

/**
 * OpenAPI/Swagger documentation for Jekyll Forge API
 */
const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Jekyll Forge API",
    version: "1.0.0",
    description:
      "API documentation for Jekyll Forge - Content repurposing and social media management",
    contact: {
      name: "Jekyll Forge Team",
    },
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Development server",
    },
    {
      url: "https://jekyll-forge.manus.space",
      description: "Production server",
    },
  ],
  paths: {
    "/api/trpc/posts.create": {
      post: {
        summary: "Create a new post",
        tags: ["Posts"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  content: { type: "string" },
                  tags: { type: "array", items: { type: "string" } },
                },
                required: ["title", "content"],
              },
            },
          },
        },
        responses: {
          200: {
            description: "Post created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    title: { type: "string" },
                    content: { type: "string" },
                    createdAt: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
          400: {
            description: "Invalid request",
          },
          401: {
            description: "Unauthorized",
          },
        },
      },
    },
    "/api/trpc/posts.list": {
      get: {
        summary: "List all posts",
        tags: ["Posts"],
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10 },
          },
          {
            name: "offset",
            in: "query",
            schema: { type: "integer", default: 0 },
          },
        ],
        responses: {
          200: {
            description: "List of posts",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      title: { type: "string" },
                      content: { type: "string" },
                      createdAt: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/trpc/social.publish": {
      post: {
        summary: "Publish content to social media",
        tags: ["Social Media"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  postId: { type: "string" },
                  platforms: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: ["twitter", "linkedin", "facebook", "instagram"],
                    },
                  },
                },
                required: ["postId", "platforms"],
              },
            },
          },
        },
        responses: {
          200: {
            description: "Content published successfully",
          },
          400: {
            description: "Invalid request",
          },
          429: {
            description: "Rate limit exceeded",
          },
        },
      },
    },
    "/api/trpc/stats.getOverview": {
      get: {
        summary: "Get analytics overview",
        tags: ["Analytics"],
        responses: {
          200: {
            description: "Analytics overview",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    totalPosts: { type: "integer" },
                    totalEngagement: { type: "integer" },
                    averageEngagementRate: { type: "number" },
                    topPost: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        title: { type: "string" },
                        engagement: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

/**
 * Register Swagger UI documentation endpoint
 */
export function registerSwaggerUI(app: Express) {
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      swaggerOptions: {
        persistAuthorization: true,
        displayOperationId: true,
      },
      customCss: ".swagger-ui .topbar { display: none }",
    })
  );

  // Serve OpenAPI JSON
  app.get("/api/openapi.json", (req, res) => {
    res.json(swaggerDocument);
  });

  console.log("Swagger UI available at /api/docs");
}
