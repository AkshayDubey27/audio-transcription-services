import Transcription from "../models/Transcription";
import axios from "axios";
import fs from "node:fs";
import path from "node:path";
import * as sdk from "microsoft-cognitiveservices-speech-sdk"; // Azure SDK
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static"; // ✅ precompiled ffmpeg binary

// types error handling
if (!ffmpegPath) {
  throw new Error("ffmpeg-static did not provide a binary path");
}
ffmpeg.setFfmpegPath(ffmpegPath);

//This is mock transcription
export const createTranscription = async (req: any, res: any) => {
  try {
    const { audioUrl } = req.body;
    if (!audioUrl) return res.status(400).json({ error: "audioUrl required" });

    const transcriptionText = "transcribed text"; // mock
    const record = await Transcription.create({ audioUrl, transcription: transcriptionText });
    res.json({ _id: record._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// get the recent trancriptions (last 30 days)

export const getRecentTranscriptions = async (req: any, res: any) => {
 try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const records = await Transcription.find({
      createdAt: { $gte: thirtyDaysAgo }
    })
    .sort({ createdAt: -1 })  // ensure descending order (newest first)
    .limit(1000); // optional: limit results to avoid huge payloads

    res.json(records);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Create transcription using the Azure speech services ( use the real keys)
export const createAzureTranscription = async (req: any, res: any) => {
  try {
    const { audioUrl, language = "en-US" } = req.body;

    const AZURE_KEY = process.env.AZURE_KEY!;
    const AZURE_REGION = process.env.AZURE_REGION!;

    if (!AZURE_KEY || !AZURE_REGION) {
      return res.status(500).json({ error: "Azure credentials not set" });
    }

    // Download audio
    const response = await axios.get(audioUrl, { responseType: "arraybuffer" });
    const originalFile = path.join(__dirname, "input_audio_temp");
    fs.writeFileSync(originalFile, Buffer.from(response.data));

    // Convert to WAV (PCM16)
    const wavFile = path.join(__dirname, "converted_temp.wav");
    await new Promise<void>((resolve, reject) => {
      ffmpeg(originalFile)
        .output(wavFile)
        .audioCodec("pcm_s16le")
        .format("wav")
        .on("end", () => resolve())
        .on("error", reject)
        .run();
    });

    //  Azure continuous recognition
    const speechConfig = sdk.SpeechConfig.fromSubscription(AZURE_KEY, AZURE_REGION);
    speechConfig.speechRecognitionLanguage = language;

    const audioConfig = sdk.AudioConfig.fromWavFileInput(fs.readFileSync(wavFile));
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    let fullTranscription = "";

    recognizer.recognizing = (s, e) => {
      console.log("Partial:", e.result.text);
    };

    recognizer.recognized = (s, e) => {
      if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
        fullTranscription += e.result.text + " ";
      }
    };

    recognizer.canceled = (s, e) => {
      console.error("Recognition canceled:", e.errorDetails);
    };

    await new Promise<void>((resolve, reject) => {
      recognizer.sessionStopped = () => {
        recognizer.stopContinuousRecognitionAsync(() => resolve(), reject);
      };

      recognizer.startContinuousRecognitionAsync(() => {}, reject);
    });

    //  Save to MongoDB database
    const record = new Transcription({
      audioUrl,
      transcription: fullTranscription.trim(),
      language,
      createdAt: new Date(),
    });
    await record.save();

    // Cleanup
    fs.unlinkSync(originalFile);
    fs.unlinkSync(wavFile);

    res.json(record);
  } catch (err: any) {
    console.error("Azure Speech Error:", err);
    res.status(500).json({
      error: "Azure Speech-to-Text failed",
      details: err?.message || err,
    });
  }
};




