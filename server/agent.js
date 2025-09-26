const path = require("path");
const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config({ path: path.join(__dirname, ".env") });

// --- Configuration ---
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

if (!MISTRAL_API_KEY) {
  console.error("MISTRAL_API_KEY is not set in your .env file.");
  process.exit(1);
}
console.log("Mistral API Key loaded successfully.");

const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";

// --- AI-Powered Location Extraction (MODIFIED to return structured JSON) ---
/**
 * Uses Mistral AI to extract a geographical location and its language from a user query.
 * Responds with a structured object for more reliable API calls.
 * @param {string} userQuery The full text or voice input from the user.
 * @returns {Promise<{location: string, language: string}|null>} An object with location and language code, or null.
 */
async function extractLocationWithAI(userQuery) {
  console.log(`Attempting AI location extraction for query: "${userQuery}"`);
  
  // NEW PROMPT: Asks for a JSON object. This is a much more robust pattern.
  const messages = [
    { 
      role: "system", 
      content: "You are an expert at extracting a geographical location from user text. Respond with a JSON object containing two keys: 'location' (the name of the place) and 'language' (the 2-letter ISO 639-1 code of the location's language, e.g., 'en' for English, 'ja' for Japanese). If no location is found, return {\"location\": null, \"language\": null}."
    },
    { 
      role: "user", 
      content: userQuery 
    },
  ];

  const payload = {
    model: "mistral-small-latest",
    messages,
    temperature: 0.0,
    response_format: { type: "json_object" }, // Ask for JSON output explicitly
  };

  try {
    const response = await axios.post(MISTRAL_URL, payload, {
      headers: {
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    
    // Parse the JSON string from the AI's response
    const result = JSON.parse(response.data?.choices?.[0]?.message?.content);
    
    if (result && result.location) {
      console.log(`AI extracted data:`, result);
      return result;
    }
    
    console.log("AI could not find a location in the query.");
    return null;
  } catch (err) {
    console.error("AI Location Extraction API error:", err.response?.data || err.message);
    return null; 
  }
}

// --- Weather API Functions ---

/** 
 * Get latitude/longitude for a city using Open-Meteo geocoding.
 * (MODIFIED to accept a language parameter)
 */
async function getCoordinates(city, language = 'en') { // Default to English
  const params = new URLSearchParams({
    name: city,
    count: '1',
    language: language, // Pass the detected language to the API
  });
  const url = `${GEOCODING_URL}?${params.toString()}`;
  console.log(`Fetching coordinates from: ${url}`); // Log the URL for debugging
  
  const res = await axios.get(url);
  const result = res.data?.results?.[0];
  if (!result) throw new Error(`Could not find coordinates for "${city}". Please try a different location name.`);
  return {
    name: result.name,
    country: result.country,
    latitude: result.latitude,
    longitude: result.longitude,
    timezone: result.timezone,
  };
}

// Unchanged functions
async function getWeather(lat, lon, timezone = "auto") {
  // ... (this function remains the same)
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current_weather: "true",
    hourly: "temperature_2m,relativehumidity_2m,apparent_temperature,windspeed_10m",
    timezone,
  });
  const url = `${OPEN_METEO_URL}?${params.toString()}`;
  const res = await axios.get(url);
  if (!res.data) throw new Error("Empty weather response from API.");
  return res.data;
}

function buildWeatherSummary(geo, weatherData) {
  // ... (this function remains the same)
  const cw = weatherData.current_weather || {};
  const temp = cw.temperature;
  const wind = cw.windspeed;
  const time = cw.time;
  const location = `${geo.name}${geo.country ? ", " + geo.country : ""}`;
  return `Current Weather Data for: ${location}
- Time (local): ${time}
- Temperature: ${temp}°C
- Wind speed: ${wind} km/h`;
}

async function askMistralWithWeather(userQuery, weatherSummary, theme = "travel") {
  // ... (this function remains the same)
  const messages = [
    { 
      role: "system", 
      content: `You are a helpful and creative AI assistant with a theme of "${theme}". Your goal is to give suggestions based on the user's query and the provided weather data. Be friendly, concise, and inspiring.`
    },
    { 
      role: "user", 
      content: `My question is: "${userQuery}"\n\nHere is the current weather data you must use:\n${weatherSummary}\n\nPlease provide a creative, user-friendly suggestion based on this.` 
    },
  ];
  const payload = { model: "mistral-small-latest", messages, temperature: 0.7 };
  try {
    const response = await axios.post(MISTRAL_URL, payload, {
      headers: {
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    return response.data?.choices?.[0]?.message?.content;
  } catch (err) {
    console.error("Mistral API error:", err.response?.data || err.message);
    throw new Error("Failed to get a response from the AI assistant.");
  }
}

// --- High-Level Controller (MODIFIED to handle the new data structure) ---
async function respondToUserQuery(userQuery) {
  try {
    // STEP 1: Get the structured location data from the AI.
    const locationInfo = await extractLocationWithAI(userQuery);
    
    // STEP 2: Handle cases where no location is found.
    if (!locationInfo || !locationInfo.location) {
      const clarification = "I couldn't identify a location in your request. Could you please tell me which city you're interested in?";
      console.log("Bot response:", clarification);
      return clarification;
    }

    // STEP 3: Pass BOTH location and language to getCoordinates.
    const geo = await getCoordinates(locationInfo.location, locationInfo.language);
    console.log("Geocoding result:", geo);

    const weatherData = await getWeather(geo.latitude, geo.longitude, geo.timezone);
    const summary = buildWeatherSummary(geo, weatherData);
    
    console.log("\n--- Weather Summary Sent to AI ---\n", summary);

    // STEP 4: Get the final, creative response.
    const reply = await askMistralWithWeather(userQuery, summary, "fashion");
    
    console.log("\n--- Final AI Response ---\n", reply);
    return reply;
    
  } catch (err) {
    console.error("Error in respondToUserQuery:", err.message);
    return `I'm sorry, I ran into a problem: ${err.message}`;
  }
}

// --- Example Usage ---
async function runExamples() {
  console.log("--- Running Example 1: Complex English Query ---");
  const prompt1 = "What kind of jacket should I wear for a night out in San Francisco?";
//   await respondToUserQuery(prompt1);
  
  console.log("\n\n--- Running Example 2: Japanese Language Query (NOW WORKING!) ---");
  const prompt2 = "今日の東京の天気はどうですか？"; // "How is the weather in Tokyo today?"
//   await respondToUserQuery(prompt2);

  console.log("\n\n--- Running Example 3: No Location Query ---");
  const prompt3 = "Is it cold outside?";
//   await respondToUserQuery(prompt3);
}

// runExamples();

module.exports = { respondToUserQuery };