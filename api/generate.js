/**
 * Vercel Serverless Function — Secure Gemini API Proxy
 * 
 * This function runs on the server side. The API key is read from
 * the Vercel Environment Variable `GEMINI_API_KEY` and is NEVER
 * exposed to the browser/client.
 * 
 * Endpoint: POST /api/generate
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Read API key from server-side environment variable (NOT VITE_ prefix)
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set in Vercel Environment Variables.');
    return res.status(500).json({ error: 'Server configuration error. API key not found.' });
  }

  try {
    const { name, role, company, skills, jobDescription, resumeText } = req.body;

    // Basic validation
    if (!name || !role || !company) {
      return res.status(400).json({ error: 'Missing required fields: name, role, company.' });
    }

    // Build the prompt (same logic as client-side buildSystemPrompt)
    const prompt = buildPrompt(name, role, company, skills, jobDescription, resumeText);

    // Call Google Gemini API from the server
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.6,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.json().catch(() => ({}));
      const errorMessage = errorBody.error?.message || `Gemini API error: ${geminiResponse.status}`;
      console.error('Gemini API Error:', errorMessage);
      return res.status(geminiResponse.status).json({ error: errorMessage });
    }

    const data = await geminiResponse.json();
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResult) {
      return res.status(500).json({ error: 'Empty response from Gemini API.' });
    }

    // Return the generated cover letter text
    return res.status(200).json({ text: textResult });

  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({ error: 'Internal server error. Please try again.' });
  }
}

/**
 * Build the LLM prompt for cover letter generation.
 * This is the server-side copy of the prompt builder.
 */
function buildPrompt(name, role, company, skills, jobDescription, resumeText) {
  const resumeSnippet = resumeText
    ? `\nCandidate Resume Details (Parsed from PDF):\n${resumeText}\n`
    : '';

  const skillsSnippet = skills
    ? `- Candidate Key Skills: ${skills}`
    : '';

  const jdSnippet = jobDescription
    ? `- Target Job Description / Requirements: ${jobDescription}`
    : '';

  return `You are a highly seasoned executive career consultant. Your objective is to write an exceptionally professional, personalized, and high-impact cover letter for ${name} applying for the ${role} position at ${company}.

Key inputs:
- Candidate Name: ${name}
- Target Role: ${role}
- Target Company: ${company}
${skillsSnippet}
${jdSnippet}
${resumeSnippet}

Guidelines to ensure it DOES NOT sound AI-generated:
1. DO NOT use generic template intro lines (e.g. "I am writing to express my enthusiastic interest...", "It is with great pleasure that I submit my application...", "I am delighted to apply..."). Start with a strong, natural, hook-based intro showing immediate value alignment.
2. DO NOT use typical AI buzzwords/cliches (e.g., "pleased", "excited", "beacon", "testament", "cutting-edge", "synergy", "dynamic interface", "passionate", "furthermore", "delighted", "revolutionize"). Use direct, clear, professional language.
3. Establish a confident, clear, and humble tone. Speak like a highly competent human professional.
4. Structure the cover letter neatly:
   - Header: Candidate Name, Target Role, and Target Company info.
   - Opening Hook: Instant value hook connecting candidate's focus to the company's domain or target challenge.
   - Core Accomplishment Paragraph: Combine candidate's key skills (${skills}) and target job requirements (${jobDescription || role}) along with resume details to show direct proof of ability. Don't just list skills; state achievements and outcomes.
   - Alignment Paragraph: Showcase specific context showing why this company (${company}) is a logical next step (use details from the JD/skills to show you researched them).
   - Professional closing: Brief, call to action regarding interviews, and sign-off.
5. Keep the length balanced (around 250 - 350 words). Ensure there are clean markdown headings and paragraphs. DO NOT output code blocks or generic wrappers. Just output the clean cover letter text in markdown.`;
}
