import { Router } from "express";
import { getMetadata } from "../controllers/meta.controller";
import { getLandingData, listJobs, getJobByUuid } from "../controllers/publicJob.controller";
import { applyForJob, getMyApplications } from "../controllers/application.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Metadata
router.get("/meta/config", getMetadata);

// Public Jobs
router.get("/jobs/landing", getLandingData);
router.get("/jobs", listJobs);
router.get("/jobs/:uuid", getJobByUuid);

// User Applications
router.post("/jobs/:uuid/apply", authenticate(), applyForJob);
router.get("/users/me/applications", authenticate(), getMyApplications);

export default router;
