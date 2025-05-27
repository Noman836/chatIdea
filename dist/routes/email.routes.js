"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const emailVerify_controller_1 = require("../controllers/emailVerify.controller");
const router = (0, express_1.Router)();
// import { authMiddleware } from '../middlewares/auth.middleware';
router.post('/email', async (req, res) => {
    await (0, emailVerify_controller_1.emailVerification)(req, res);
});
exports.default = router;
