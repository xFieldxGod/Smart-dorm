import serverless from "serverless-http";
import app from "../../backend/app.js";

// Wrap Express app for Netlify Functions
export const handler = serverless(app);
