import axios from "axios";

const API_BASE = "http://localhost:5000/api";// match backend port

export const postTranscription = async (audioUrl: string) => {
  const res = await axios.post(`${API_BASE}/transcribe`, { audioUrl });
  return res.data;
};

export const getRecentTranscriptions = async () => {
  const res = await axios.get(`${API_BASE}/transcriptions/recent`);
  return res.data;
};

export const postAzureTranscription = async (audioUrl: string, language = "en-US") => {
  const res = await axios.post(`${API_BASE}/azure-transcription`, { audioUrl, language });
  return res.data;
};
