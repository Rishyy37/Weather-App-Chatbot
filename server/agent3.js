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

// --- AI-Powered Theme Extraction ---
/**
 * Uses Mistral AI to extract the theme/topic from a user query.
 * @param {string} userQuery The user's input text.
 * @returns {Promise<string>} The detected theme (e.g., "weather", "travel", "fashion", "general").
 */
async function extractTheme(userQuery) {
  console.log(`Attempting theme extraction for query: "${userQuery}"`);
  
  const messages = [
    { 
      role: "system", 
      content: `You are an expert at classifying the theme or topic of user queries. Respond with a JSON object containing one key: 'theme'. 
      
      Possible themes include:
      - "weather": Any query about weather conditions, temperature, precipitation, clothing for weather, etc.
      - "travel": Questions about trips, vacations, destinations, itineraries
      - "fashion": Clothing, outfits, what to wear, style advice
      - "food": Cooking, recipes, restaurants, dining
      - "sports": Physical activities, exercise, sports events
      - "technology": Computers, software, gadgets, tech news
      - "general": Casual conversation, greetings, general questions
      
      Choose the most specific theme that fits. If uncertain, use "general".`
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
    response_format: { type: "json_object" },
  };

  try {
    const response = await axios.post(MISTRAL_URL, payload, {
      headers: {
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    
    const result = JSON.parse(response.data?.choices?.[0]?.message?.content);
    const theme = result?.theme || "general";
    
    console.log(`AI extracted theme: ${theme}`);
    return theme;
  } catch (err) {
    console.error("AI Theme Extraction API error:", err.response?.data || err.message);
    return "general";
  }
}

// --- Enhanced Location Extraction with Theme Context ---
/**
 * Extracts geographical location with theme-aware processing.
 * @param {string} userQuery The user's input text.
 * @param {string} theme The detected theme from the query.
 * @returns {Promise<{location: string, language: string}|null>} Location info or null.
 */
async function extractLocationWithAI(userQuery, theme) {
  console.log(`Attempting AI location extraction for query: "${userQuery}" with theme: ${theme}`);
  
  // Theme-aware system prompt
  const systemPrompt = theme === "weather" 
    ? "You are an expert at extracting geographical locations from user text. Focus on finding location names for weather-related queries. Respond with a JSON object containing 'location' and 'language' (2-letter ISO code). If no location is found, return {\"location\": null, \"language\": null}."
    : "You are an expert at extracting geographical locations from user text. Only extract locations if they are clearly mentioned and relevant to the query. Respond with a JSON object containing 'location' and 'language'. If no location is found or if the location is not essential, return {\"location\": null, \"language\": null}.";

  const messages = [
    { 
      role: "system", 
      content: systemPrompt
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
    response_format: { type: "json_object" },
  };

  try {
    const response = await axios.post(MISTRAL_URL, payload, {
      headers: {
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    
    const result = JSON.parse(response.data?.choices?.[0]?.message?.content);
    
    if (result && result.location) {
      console.log(`AI extracted location data:`, result);
      return result;
    }
    
    console.log("AI could not find a location in the query.");
    return null;
  } catch (err) {
    console.error("AI Location Extraction API error:", err.response?.data || err.message);
    return null; 
  }
}

// --- Structured General LLM Response (for non-weather queries) ---
/**
 * Provides a structured AI response when no location is detected.
 * @param {string} userQuery The user's input text.
 * @param {string} theme The detected theme for context-aware responses.
 * @returns {Promise<Object>} Structured response object.
 */
async function getGeneralAIResponse(userQuery, theme) {
  console.log(`Getting structured general AI response for theme: ${theme}`);
  
  const themeContext = {
    weather: "You are a helpful weather assistant. Since no specific location was mentioned, provide general weather advice or ask for clarification.",
    travel: "You are a travel expert. Provide helpful travel tips and advice.",
    fashion: "You are a fashion consultant. Provide style advice and clothing recommendations.",
    food: "You are a food expert. Provide cooking tips, recipe ideas, or dining suggestions.",
    sports: "You are a sports enthusiast. Provide sports advice, activity suggestions, or game insights.",
    technology: "You are a tech expert. Provide helpful technology advice and insights.",
    general: "You are a helpful AI assistant. Provide friendly, informative responses."
  };

  const systemMessage = themeContext[theme] || themeContext.general;

  const messages = [
    { 
      role: "system", 
      content: `${systemMessage}

Respond with a JSON object containing:
- "summary": Main response content (plain text, no markdown formatting)
- "details": Array of point objects with "title" and "description" (optional, use if relevant)
- "advice": Practical advice or recommendations (optional)
- "type": Should be "general"

Important: Use plain text only - no **bold**, - bullet points, or other markdown formatting.`
    },
    { 
      role: "user", 
      content: userQuery 
    },
  ];

  const payload = { 
    model: "mistral-small-latest", 
    messages, 
    temperature: 0.7,
    response_format: { type: "json_object" }
  };

  try {
    const response = await axios.post(MISTRAL_URL, payload, {
      headers: {
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    
    const content = response.data?.choices?.[0]?.message?.content;
    const result = JSON.parse(content);
    
    // Ensure required fields and add type
    result.type = "general";
    if (!result.summary) {
      result.summary = "I'd be happy to help with that!";
    }
    if (!result.details) {
      result.details = [];
    }
    if (!result.advice) {
      result.advice = "";
    }
    
    return result;
  } catch (err) {
    console.error("General AI Response API error:", err.response?.data || err.message);
    return {
      summary: "I apologize, but I'm having trouble responding right now. Please try again later.",
      details: [],
      advice: "",
      type: "general"
    };
  }
}

// --- Weather API Functions ---
async function getCoordinates(city, language = 'en') {
  const params = new URLSearchParams({
    name: city,
    count: '1',
    language: language,
  });
  const url = `${GEOCODING_URL}?${params.toString()}`;
  console.log(`Fetching coordinates from: ${url}`);
  
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

async function getWeather(lat, lon, timezone = "auto") {
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

// --- Structured Weather-Aware AI Response ---
/**
 * Provides a structured AI response with weather data.
 * @param {string} userQuery The user's input text.
 * @param {string} weatherSummary The weather data summary.
 * @param {string} theme The detected theme for context-aware responses.
 * @returns {Promise<Object>} Structured response object.
 */
async function askMistralWithWeather(userQuery, weatherSummary, theme = "general") {
  const themeContext = {
    weather: "weather expert",
    travel: "travel guide with weather awareness",
    fashion: "fashion consultant who considers weather conditions",
    food: "food expert who considers seasonal and weather factors",
    sports: "sports advisor who considers weather conditions",
    general: "helpful assistant with weather awareness"
  };

  const role = themeContext[theme] || themeContext.general;

  const messages = [
    { 
      role: "system", 
      content: `You are a ${role}. Your goal is to give helpful suggestions based on the user's query and the provided weather data. Be friendly, concise, and practical.

Respond with a JSON object containing:
- "summary": A brief overall summary (1-2 sentences, plain text)
- "details": Array of point objects with "title" and "description" (focus on weather aspects)
- "advice": Practical advice or recommendations based on weather and theme
- "type": Should be "weather"

Important: Use plain text only - no **bold**, - bullet points, or other markdown formatting.

Example format:
{
  "summary": "Tomorrow looks pleasant for outdoor activities in Long Beach.",
  "details": [
    {"title": "Temperature", "description": "Around 21°C with mild conditions throughout the day"},
    {"title": "Wind", "description": "Light breeze at 13 km/h, perfect for outdoor activities"}
  ],
  "advice": "It's a great day for walking along the beach or enjoying outdoor dining.",
  "type": "weather"
}`
    },
    { 
      role: "user", 
      content: `My question is: "${userQuery}"\n\nHere is the current weather data you must use:\n${weatherSummary}\n\nPlease provide a helpful response in the specified JSON format.` 
    },
  ];
  
  const payload = { 
    model: "mistral-small-latest", 
    messages, 
    temperature: 0.7,
    response_format: { type: "json_object" }
  };
  
  try {
    const response = await axios.post(MISTRAL_URL, payload, {
      headers: {
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    
    const content = response.data?.choices?.[0]?.message?.content;
    const result = JSON.parse(content);
    
    // Validate and ensure required fields
    result.type = "weather";
    if (!result.summary) {
      result.summary = "Based on the current weather conditions, here's my advice:";
    }
    if (!result.details) {
      result.details = [];
    }
    if (!result.advice) {
      result.advice = "Enjoy your day!";
    }
    
    return result;
  } catch (err) {
    console.error("Structured Weather AI Response API error:", err.response?.data || err.message);
    // Fallback structured response
    return {
      summary: "I apologize, but I'm having trouble processing the weather data right now.",
      details: [],
      advice: "Please try again later.",
      type: "weather"
    };
  }
}

// --- Enhanced High-Level Controller ---
/**
 * Main function to process user queries and return structured responses.
 * @param {string} userQuery The user's input text.
 * @returns {Promise<Object>} Structured response object.
 */
async function respondToUserQuery(userQuery) {
  try {
    // STEP 1: Extract theme from the query
    const theme = await extractTheme(userQuery);
    
    // STEP 2: Extract location with theme context
    const locationInfo = await extractLocationWithAI(userQuery, theme);
    
    // STEP 3: Handle different scenarios based on theme and location
    if (!locationInfo || !locationInfo.location) {
      // No location found - provide general AI response
      if (theme === "weather") {
        // For weather queries without location, be more specific
        const response = await getGeneralAIResponse(
          `I asked about weather but didn't specify a location: "${userQuery}". Please provide general weather advice or ask for location details.`,
          "weather"
        );
        console.log("\n--- General Weather Response (No Location) ---\n", JSON.stringify(response, null, 2));
        return response;
      } else {
        // For non-weather themes, provide theme-specific response
        const response = await getGeneralAIResponse(userQuery, theme);
        console.log(`\n--- General AI Response (Theme: ${theme}) ---\n`, JSON.stringify(response, null, 2));
        return response;
      }
    }

    // STEP 4: Location found - get weather data and provide enhanced response
    const geo = await getCoordinates(locationInfo.location, locationInfo.language);
    console.log("Geocoding result:", geo);

    const weatherData = await getWeather(geo.latitude, geo.longitude, geo.timezone);
    const summary = buildWeatherSummary(geo, weatherData);
    
    console.log("\n--- Weather Summary Sent to AI ---\n", summary);

    // STEP 5: Get theme-aware response with weather data
    const reply = await askMistralWithWeather(userQuery, summary, theme);
    
    console.log(`\n--- Final AI Response (Theme: ${theme}) ---\n`, JSON.stringify(reply, null, 2));
    return reply;
    
  } catch (err) {
    console.error("Error in respondToUserQuery:", err.message);
    return {
      summary: `I'm sorry, I ran into a problem: ${err.message}`,
      details: [],
      advice: "Please try again with a different query.",
      type: "error"
    };
  }
}

// --- Example Usage with Structured Responses ---
async function runExamples() {
  console.log("=== Testing Structured Response System ===\n");
  
  console.log("--- Example 1: Weather Query with Location ---");
  const prompt1 = "What kind of jacket should I wear for a night out in San Francisco?";
  const result1 = await respondToUserQuery(prompt1);
  console.log("Structured Response:", JSON.stringify(result1, null, 2));
  
  console.log("\n\n--- Example 2: Japanese Weather Query ---");
  const prompt2 = "今日の東京の天気はどうですか？";
  const result2 = await respondToUserQuery(prompt2);
  console.log("Structured Response:", JSON.stringify(result2, null, 2));

  console.log("\n\n--- Example 3: Weather Query without Location ---");
  const prompt3 = "Is it going to rain today?";
  const result3 = await respondToUserQuery(prompt3);
  console.log("Structured Response:", JSON.stringify(result3, null, 2));

  console.log("\n\n--- Example 4: Non-Weather Query (Travel) ---");
  const prompt4 = "What are the best places to visit in Japan?";
  const result4 = await respondToUserQuery(prompt4);
  console.log("Structured Response:", JSON.stringify(result4, null, 2));

  console.log("\n\n--- Example 5: General Conversation ---");
  const prompt5 = "Hello! How are you doing today?";
  const result5 = await respondToUserQuery(prompt5);
  console.log("Structured Response:", JSON.stringify(result5, null, 2));
}

// runExamples().catch(console.error);

module.exports = { 
  respondToUserQuery, 
  extractTheme,
  extractLocationWithAI,
  getGeneralAIResponse,
  askMistralWithWeather
};