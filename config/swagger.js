import swaggerJSDoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Expense Tracker API Documentation',
      version: '1.0.0',
      description: 'API documentation for the MEVN Expense Tracker application',
    },
    servers: [
      {
        url: process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}` 
          : `http://localhost:${process.env.PORT || 5000}`,
        description: process.env.VERCEL_URL ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Path to the API docs (scans route files for JSDoc comments)
  apis: ['./routes/*.js'],
}

const swaggerSpec = swaggerJSDoc(options)

// CDN options to prevent local file-resolution bugs and missing bundles on Vercel
const swaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customJs: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.min.js',
  ],
  customCssUrl: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
  ],
}

export { swaggerSpec, swaggerUiOptions }