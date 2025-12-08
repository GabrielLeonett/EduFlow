import { startServerBackend } from "./src/backend-server.js";
import { startServerFrontend } from "./src/frontend-server.js";
import { loadEnv } from "./src/utils/utilis.js";

loadEnv();

startServerBackend(3000);
startServerFrontend(3001)