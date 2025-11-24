import express from "express";
import {
  createTranscription,
  getRecentTranscriptions,
  createAzureTranscription,
} from "./controllers/transcription";

const router = express.Router();

router.post("/transcribe", createTranscription);
router.get("/transcriptions/recent", getRecentTranscriptions);
router.post("/azure-transcription", createAzureTranscription);

export default router;
