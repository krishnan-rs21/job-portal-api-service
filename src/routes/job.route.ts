import { Router } from "express";
import {
  createJob,
  listJobs,
  updateJob,
  toggleJobStatus,
  deleteJob,
} from "../controllers/job.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Admin protected routes
router.use(authenticate(["ADMIN"]));

router.post("/", createJob);
router.get("/", listJobs);
router.put("/:uuid", updateJob);
router.patch("/:uuid/status", toggleJobStatus);
router.delete("/:uuid", deleteJob);

export default router;
