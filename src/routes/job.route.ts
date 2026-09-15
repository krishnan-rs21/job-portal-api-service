import { Router } from "express";
import {
  createJob,
  listJobs,
  updateJob,
  toggleJobStatus,
  deleteJob,
} from "../controllers/job.controller";
import {
  listApplications,
  updateApplicationStatus,
} from "../controllers/adminApplication.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Admin protected routes
router.use(authenticate(["ADMIN"]));

router.post("/", createJob);
router.get("/", listJobs);
router.get("/applications", listApplications);
router.patch("/applications/:uuid/status", updateApplicationStatus);
router.get("/:uuid/applications", listApplications);
router.put("/:uuid", updateJob);
router.patch("/:uuid/status", toggleJobStatus);
router.delete("/:uuid", deleteJob);

export default router;
