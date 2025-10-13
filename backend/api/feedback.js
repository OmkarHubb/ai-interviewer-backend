const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // We need this to make API calls from the server

const app = express();
const corsMiddleware = cors();

app.use((req, res, next) => {
    // Run CORS middleware
    corsMiddleware(req, res, next);
});

app.use(express.json());

// This is the only endpoint we need in this file
app.post('/api/feedback', async (req, res) => {
    const { userAnswers } = req.body; // We'll get the answers from the frontend
    const API_KEY = process.env.GEMINI_API_KEY; // Vercel will provide this
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

    if (!userAnswers || userAnswers.length === 0) {
        return res.status(400).json({ error: "No interview answers provided." });
    }

    try {
        const prompt = `You are a helpful and experienced hiring manager for a software engineering role. Analyze the following interview questions and the candidate's answers. Provide a concise summary of the candidate's performance, including one key strength and one specific area for improvement with an example of how they could have answered better. Format your response in markdown.
    
        Here is the interview transcript:
        ${userAnswers.map(ua => `Question: ${ua.question}\nAnswer: ${ua.answer}`).join('\n\n')}
        `;
        
        const apiResponse = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!apiResponse.ok) {
            const errorData = await apiResponse.json();
            console.error("Error from Gemini API:", errorData);
            throw new Error('Failed to get feedback from Gemini API.');
        }

        const data = await apiResponse.json();
        const feedback = data.candidates[0].content.parts[0].text;
        
        res.json({ feedback });

    } catch (error) {
        console.error("Error generating AI feedback:", error);
        res.status(500).json({ error: "Failed to get feedback from AI." });
    }
});

// Vercel handles the server listening, so we don't need app.listen()
module.exports = app;