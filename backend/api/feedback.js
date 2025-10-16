const fetch = require('node-fetch');

// This is the Vercel serverless function handler.
module.exports = async (req, res) => {
    // --- Manually set CORS headers to allow requests from any website ---
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allows all origins
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // The browser sends an OPTIONS request first to check permissions.
    // We need to handle this "preflight" request and send a successful response.
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // --- Proceed with the actual POST request logic ---
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { userAnswers } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;
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
        
        res.status(200).json({ feedback });

    } catch (error) {
        console.error("Error in serverless function:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};