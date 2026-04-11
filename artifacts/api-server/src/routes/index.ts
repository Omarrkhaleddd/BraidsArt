import { Router, type IRouter } from "express";
import healthRouter from "./health";
import designsRouter from "./designs";
import availabilityRouter from "./availability";
import bookingsRouter from "./bookings";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/designs", designsRouter);
router.use("/availability", availabilityRouter);
router.use("/bookings", bookingsRouter);
router.use("/admin", adminRouter);

export default router;
