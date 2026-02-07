import { Router } from "express";
import { getMapLocations } from "./map.controller";

const router = Router();

router.get("/locations", getMapLocations);

export default router;
