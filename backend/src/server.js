import app from "./app.js";
import { assertRequiredEnv, env } from "./config/env.js";
import { checkDbConnection } from "./config/db.js";

async function bootstrap() {
  try {
    assertRequiredEnv();
    await checkDbConnection();

    app.listen(env.port, () => {
      console.log(`Server running on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

bootstrap();
