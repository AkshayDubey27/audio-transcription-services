import { Schema, model } from "mongoose";

interface ITranscription {
  audioUrl: string;
  transcription: string;
  language?: string;
  createdAt: Date;
}

const transcriptionSchema = new Schema<ITranscription>({
  audioUrl: { type: String, required: true },
  transcription: { type: String, required: true },
  language: { type: String, default: "en-US" },
  createdAt: { type: Date, default: Date.now }
});
// Add descending index on createdAt for fast recent queries
// 1. Get recent transcriptions per language
transcriptionSchema.index({ language: 1, createdAt: -1 });

// 2. Lookup by audio URL
transcriptionSchema.index({ audioUrl: 1 }, { unique: true });

// 3. Optional full-text search
transcriptionSchema.index({ transcription: "text" });

export default model<ITranscription>("Transcription", transcriptionSchema);
