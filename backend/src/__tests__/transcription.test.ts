// src/__tests__/transcription.test.ts
import mongoose from "mongoose";
import { createTranscription, getRecentTranscriptions, createAzureTranscription } from "../controllers/transcription";
import Transcription from "../models/Transcription";
import fs from "node:fs";

// ---------------------
// Mock MongoDB
// ---------------------
jest.mock("../models/Transcription");

// ---------------------
// Mock Azure SDK
// ---------------------
jest.mock("microsoft-cognitiveservices-speech-sdk", () => {
  const mSdk = {
    SpeechConfig: {
      fromSubscription: jest.fn(() => ({ speechRecognitionLanguage: "" })),
    },
    AudioConfig: {
      fromWavFileInput: jest.fn(),
    },
    ResultReason: {
      RecognizedSpeech: "RecognizedSpeech",
    },
    SpeechRecognizer: class {
      recognizing: any = null;
      recognized: any = null;
      canceled: any = null;
      sessionStopped: any = null;
      startContinuousRecognitionAsync(success?: Function, error?: Function) {
        if (success) success();
      }
      stopContinuousRecognitionAsync(success?: Function, error?: Function) {
        if (success) success();
      }
    },
  };
  return mSdk;
});

// ---------------------
// Mock ffmpeg
// ---------------------
jest.mock("fluent-ffmpeg", () => {
  const mockFfmpeg = {
    setFfmpegPath: jest.fn(),
    output: jest.fn().mockReturnThis(),
    audioCodec: jest.fn().mockReturnThis(),
    format: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    run: jest.fn(),
  };
  return jest.fn(() => mockFfmpeg);
});

// ---------------------
// Mock fs
// ---------------------
jest.mock("node:fs", () => ({
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(() => Buffer.from("dummy audio")),
  unlinkSync: jest.fn(),
}));

// ---------------------
// Helper for mock req/res
// ---------------------
const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Transcription Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("createTranscription should create a new transcription", async () => {
    const req: any = { body: { audioUrl: "sample.mp3" } };
    const res = mockResponse();

    (Transcription.create as jest.Mock).mockResolvedValue({ _id: "123" });

    await createTranscription(req, res);

    expect(Transcription.create).toHaveBeenCalledWith({
      audioUrl: "sample.mp3",
      transcription: "transcribed text",
    });
    expect(res.json).toHaveBeenCalledWith({ _id: "123" });
  });

  it("getRecentTranscriptions should return last 30 days", async () => {
    const req: any = {};
    const res = mockResponse();

    const mockRecords = [{ _id: "1" }, { _id: "2" }];
    (Transcription.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue(mockRecords),
      }),
    });

    await getRecentTranscriptions(req, res);

    expect(res.json).toHaveBeenCalledWith(mockRecords);
  });

  it("createAzureTranscription should save transcription", async () => {
    const req: any = { body: { audioUrl: "audio.mp3", language: "en-US" } };
    const res = mockResponse();

    (Transcription as any).mockImplementation(() => ({
      save: jest.fn().mockResolvedValue({ audioUrl: "audio.mp3", transcription: "hello world" }),
    }));

    await createAzureTranscription(req, res);

    expect(res.json).toHaveBeenCalled();
  });
});
