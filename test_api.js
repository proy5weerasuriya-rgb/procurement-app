const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

const env = fs.readFileSync('c:/Users/Pramodhya Kasuni/Documents/Xamk/Courses/AI in practice/Applied AI/Final project/procurement-app/.env.local', 'utf-8');
const keyMatch = env.match(/GEMINI_API_KEY=(.*)/);
const key = keyMatch ? keyMatch[1].trim().replace(/['"]/g, '') : '';

console.log("Checking API Key length:", key.length);

fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)
  .then(r => r.json())
  .then(d => {
      if (d.error) {
          console.error("API ERROR:", JSON.stringify(d.error, null, 2));
      } else {
          console.log("AVAILABLE MODELS:");
          console.log(d.models.map(m => m.name).join('\n'));
      }
  })
  .catch(console.error);
