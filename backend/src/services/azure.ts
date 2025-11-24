export const transcribeAzure = async (audioUrl: string, language: string) => {
  console.log(`Mock Azure transcription for ${audioUrl} in ${language}`);
  await new Promise((r) => setTimeout(r, 500));
  return `Dummy Azure transcription (${language})`;
};

