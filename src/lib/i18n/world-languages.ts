/**
 * Languages the AI translation provider (Lovable AI Gateway / Gemini) can translate into.
 * Languages without a reviewed static dictionary are translated live and cached server-side.
 */
export type WorldLanguage = { code: string; label: string; nativeLabel: string; dir: "ltr" | "rtl" };

const RTL = new Set(["ar", "ur", "fa", "he", "ps", "sd", "ug", "yi", "dv", "ckb"]);

const raw: Array<[string, string, string]> = [
  ["af", "Afrikaans", "Afrikaans"], ["sq", "Albanian", "Shqip"], ["am", "Amharic", "አማርኛ"], ["ar", "Arabic", "العربية"],
  ["hy", "Armenian", "Հայերեն"], ["as", "Assamese", "অসমীয়া"], ["ay", "Aymara", "Aymar aru"], ["az", "Azerbaijani", "Azərbaycan"],
  ["bm", "Bambara", "Bamanankan"], ["eu", "Basque", "Euskara"], ["be", "Belarusian", "Беларуская"], ["bn", "Bengali", "বাংলা"],
  ["bs", "Bosnian", "Bosanski"], ["bg", "Bulgarian", "Български"], ["my", "Burmese", "မြန်မာ"], ["ca", "Catalan", "Català"],
  ["ceb", "Cebuano", "Cebuano"], ["ny", "Chichewa", "Chichewa"], ["zh", "Chinese (Simplified)", "简体中文"], ["zh-TW", "Chinese (Traditional)", "繁體中文"],
  ["co", "Corsican", "Corsu"], ["hr", "Croatian", "Hrvatski"], ["cs", "Czech", "Čeština"], ["da", "Danish", "Dansk"],
  ["dv", "Dhivehi", "ދިވެހި"], ["nl", "Dutch", "Nederlands"], ["en", "English", "English"], ["eo", "Esperanto", "Esperanto"],
  ["et", "Estonian", "Eesti"], ["ee", "Ewe", "Eʋegbe"], ["fil", "Filipino", "Filipino"], ["fi", "Finnish", "Suomi"],
  ["fr", "French", "Français"], ["ff", "Fula", "Fulfulde"], ["gl", "Galician", "Galego"], ["ka", "Georgian", "ქართული"],
  ["de", "German", "Deutsch"], ["el", "Greek", "Ελληνικά"], ["gn", "Guarani", "Avañe'ẽ"], ["gu", "Gujarati", "ગુજરાતી"],
  ["ht", "Haitian Creole", "Kreyòl ayisyen"], ["ha", "Hausa", "Hausa"], ["haw", "Hawaiian", "ʻŌlelo Hawaiʻi"], ["he", "Hebrew", "עברית"],
  ["hi", "Hindi", "हिन्दी"], ["hmn", "Hmong", "Hmoob"], ["hu", "Hungarian", "Magyar"], ["is", "Icelandic", "Íslenska"],
  ["ig", "Igbo", "Igbo"], ["id", "Indonesian", "Bahasa Indonesia"], ["ga", "Irish", "Gaeilge"], ["it", "Italian", "Italiano"],
  ["ja", "Japanese", "日本語"], ["jv", "Javanese", "Basa Jawa"], ["kn", "Kannada", "ಕನ್ನಡ"], ["kk", "Kazakh", "Қазақ"],
  ["km", "Khmer", "ខ្មែរ"], ["rw", "Kinyarwanda", "Ikinyarwanda"], ["ko", "Korean", "한국어"], ["ku", "Kurdish (Kurmanji)", "Kurdî"],
  ["ckb", "Kurdish (Sorani)", "کوردی"], ["ky", "Kyrgyz", "Кыргызча"], ["lo", "Lao", "ລາວ"], ["la", "Latin", "Latina"],
  ["lv", "Latvian", "Latviešu"], ["ln", "Lingala", "Lingála"], ["lt", "Lithuanian", "Lietuvių"], ["lg", "Luganda", "Luganda"],
  ["lb", "Luxembourgish", "Lëtzebuergesch"], ["mk", "Macedonian", "Македонски"], ["mg", "Malagasy", "Malagasy"], ["ms", "Malay", "Bahasa Melayu"],
  ["ml", "Malayalam", "മലയാളം"], ["mt", "Maltese", "Malti"], ["mi", "Maori", "Māori"], ["mr", "Marathi", "मराठी"],
  ["mn", "Mongolian", "Монгол"], ["ne", "Nepali", "नेपाली"], ["no", "Norwegian", "Norsk"], ["or", "Odia", "ଓଡ଼ିଆ"],
  ["om", "Oromo", "Afaan Oromoo"], ["ps", "Pashto", "پښتو"], ["fa", "Persian", "فارسی"], ["pl", "Polish", "Polski"],
  ["pt", "Portuguese", "Português"], ["pa", "Punjabi", "ਪੰਜਾਬੀ"], ["qu", "Quechua", "Runasimi"], ["ro", "Romanian", "Română"],
  ["ru", "Russian", "Русский"], ["sm", "Samoan", "Gagana Samoa"], ["gd", "Scottish Gaelic", "Gàidhlig"], ["sr", "Serbian", "Српски"],
  ["st", "Sesotho", "Sesotho"], ["sn", "Shona", "chiShona"], ["sd", "Sindhi", "سنڌي"], ["si", "Sinhala", "සිංහල"],
  ["sk", "Slovak", "Slovenčina"], ["sl", "Slovenian", "Slovenščina"], ["so", "Somali", "Soomaali"], ["es", "Spanish", "Español"],
  ["su", "Sundanese", "Basa Sunda"], ["sw", "Swahili", "Kiswahili"], ["sv", "Swedish", "Svenska"], ["tg", "Tajik", "Тоҷикӣ"],
  ["ta", "Tamil", "தமிழ்"], ["tt", "Tatar", "Татар"], ["te", "Telugu", "తెలుగు"], ["th", "Thai", "ไทย"],
  ["ti", "Tigrinya", "ትግርኛ"], ["ts", "Tsonga", "Xitsonga"], ["tr", "Turkish", "Türkçe"], ["tk", "Turkmen", "Türkmen"],
  ["tw", "Twi", "Twi"], ["uk", "Ukrainian", "Українська"], ["ur", "Urdu", "اردو"], ["ug", "Uyghur", "ئۇيغۇرچە"],
  ["uz", "Uzbek", "Oʻzbek"], ["vi", "Vietnamese", "Tiếng Việt"], ["cy", "Welsh", "Cymraeg"], ["wo", "Wolof", "Wolof"],
  ["xh", "Xhosa", "isiXhosa"], ["yi", "Yiddish", "ייִדיש"], ["yo", "Yoruba", "Yorùbá"], ["zu", "Zulu", "isiZulu"],
];

export const worldLanguages: WorldLanguage[] = raw
  .map(([code, label, nativeLabel]) => ({ code, label, nativeLabel, dir: RTL.has(code) ? "rtl" as const : "ltr" as const }))
  .sort((a, b) => a.label.localeCompare(b.label));

const byCode = new Map(worldLanguages.map((item) => [item.code, item]));

export function isWorldLanguage(value: unknown): value is string {
  return typeof value === "string" && byCode.has(value);
}

export function worldLanguage(code: string): WorldLanguage {
  return byCode.get(code) ?? byCode.get("en")!;
}
