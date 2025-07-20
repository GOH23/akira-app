import Module from "./espeakng.worker.js";

const workerPromise = new Promise((resolve) => {
  if (Module.calledRun) {
    resolve(new Module.eSpeakNGWorker());
  } else {
    Module.onRuntimeInitialized = () => resolve(new Module.eSpeakNGWorker());
  }
});

const SUPPORTED_LANGUAGES = [
  "en", // English
];

const initCache = workerPromise.then((worker) => {
  const voices = (worker as any)
    .list_voices()
    .map(({ name, identifier, languages }: { name: string, identifier: string, languages: { name: string, priority: number }[] }) => ({
      name,
      identifier,
      languages: languages.filter((lang) =>
        SUPPORTED_LANGUAGES.includes(lang.name.split("-")[0]),
      ),
    }))
    .filter((voice: { languages: { name: string, priority: number }[] }) => voice.languages.length > 0);

  // Generate list of supported language identifiers:
  const identifiers = new Set();
  for (const voice of voices) {
    identifiers.add(voice.identifier);
    for (const lang of voice.languages) {
      identifiers.add(lang.name);
    }
  }

  return { voices, identifiers };
});

/**
 * List the available voices for the specified language.
 * @param {string} [language] The language identifier
 * @returns {Promise<{name: string; identifier: string; languages: {name: string; priority: number}[]}>} A list of available voices
 */
export const list_voices = async (language: string) => {
  const { voices } = await initCache;
  if (!language) return voices;
  const base = language.split("-")[0];
  return voices.filter((voice: { languages: { name: string, priority: number }[] }) =>
    voice.languages.some(
      (lang: { name: string, priority: number }) => lang.name === base || lang.name.startsWith(base + "-"),
    ),
  );
};

/**
 * Multilingual text to phonemes converter
 *
 * @param {string} text The input text
 * @param {string} [language] The language identifier
 * @returns {Promise<string[]>} A phonemized version of the input
 */
export const phonemize = async (text: string, language = "en-us") => {
  const worker = await workerPromise;

  const { identifiers } = await initCache;
  if (!identifiers.has(language)) {
    throw new Error(
      `Invalid language identifier: "${language}". Should be one of: ${Array.from(identifiers).sort().join(", ")}.`,
    );
  }
  (worker as any).set_voice(language);

  return (
    (worker as any)
      .synthesize_ipa(text)
      .ipa?.split("\n")
      .filter((x: string) => x.length > 0) ?? []
  );
};
