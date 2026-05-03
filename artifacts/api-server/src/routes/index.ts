import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import registrationRouter from "./registration";
import usersRouter from "./users";
import uploadsRouter from "./uploads";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(registrationRouter);
router.use(usersRouter);
router.use(uploadsRouter);

export default router;
