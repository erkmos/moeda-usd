"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger = require("winston");
const app_1 = require("./app");
app_1.main().catch((error) => {
    logger.error(error.message);
});
//# sourceMappingURL=cli.js.map