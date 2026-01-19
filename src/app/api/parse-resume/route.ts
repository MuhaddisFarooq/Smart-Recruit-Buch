import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import PDFParser from "pdf2json";
import mammoth from "mammoth";

// Tell Next.js to use Node.js runtime for this route (required for fs/buffer ops usually)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Types for response
type ResumeData = {
    personalInfo: {
        name: string;
        email: string;
        phone: string;
        city: string;
    };
    socialLinks: {
        linkedin: string;
        facebook: string;
        twitter: string;
        website: string;
    };
    experience: Array<{
        title: string;
        company: string;
        location: string;
        description: string;
        startDate: string; // YYYY-MM-DD or YYYY-MM
        endDate: string; // YYYY-MM-DD or Present
        isCurrent: boolean;
    }>;
    education: Array<{
        institution: string;
        major: string;
        degree: string;
        location: string;
        description: string;
        startDate: string;
        endDate: string;
        isCurrent: boolean;
    }>;
};

// System prompt for LLM - Strict JSON
const SYSTEM_PROMPT = `
You are a resume parsing assistant. Extract information from the structured text into this JSON format:
{
  "personalInfo": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "Phone Number",
    "city": "City, Country"
  },
  "socialLinks": {
    "linkedin": "full LinkedIn URL if found (e.g. https://linkedin.com/in/username)",
    "facebook": "full Facebook URL if found",
    "twitter": "full Twitter/X URL if found (e.g. https://twitter.com/username or https://x.com/username)",
    "website": "personal website or portfolio URL if found"
  },
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "City, Country",
      "description": "Short summary of responsibilities",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD", 
      "isCurrent": boolean
    }
  ],
  "education": [
    {
      "institution": "University/College",
      "major": "Major/Field",
      "degree": "Degree Name",
      "location": "City, Country",
      "description": "Details",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "isCurrent": boolean
    }
  ]
}
Refine rules: 
- If end date is 'Present' or 'Current', set isCurrent=true and endDate=''.
- Use '2023-01-01' format for dates. If only year is known, use January 1st.
- IMPORTANT: Look for LinkedIn, GitHub, Twitter/X, Facebook, personal website URLs anywhere in the resume text and include them in socialLinks.
- If social links are not found, return empty strings.
- If sections are empty, return empty arrays.
- Return ONLY valid JSON, no markdown.
`;

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const mimeType = file.type;
        let text = "";

        // 1. Extract Text
        if (mimeType === "application/pdf") {
            try {
                text = await parsePdfBuffer(buffer);
            } catch (e) {
                console.error("PDF Parse Error", e);
                return NextResponse.json({ error: "Failed to parse PDF" }, { status: 500 });
            }
        } else if (
            mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            mimeType === "application/msword"
        ) {
            try {
                const result = await mammoth.extractRawText({ buffer });
                text = result.value;
            } catch (e) {
                console.error("Word Parse Error", e);
                return NextResponse.json({ error: "Failed to parse Word document" }, { status: 500 });
            }
        } else {
            return NextResponse.json({ error: "Unsupported file format" }, { status: 400 });
        }

        // 2. Parse with LLM
        let parsedData: ResumeData | null = null;

        // Try OpenAI first
        if (process.env.OPENAI_API_KEY) {
            try {
                const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
                const completion = await openai.chat.completions.create({
                    messages: [
                        { role: "system", content: SYSTEM_PROMPT },
                        { role: "user", content: text }
                    ],
                    model: "gpt-4o", // or gpt-3.5-turbo
                    response_format: { type: "json_object" }
                });
                const content = completion.choices[0].message.content;
                if (content) parsedData = JSON.parse(content);
            } catch (e) {
                console.error("OpenAI Error", e);
            }
        }

        // Fallback to Gemini if OpenAI failed or not present
        if (!parsedData && (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)) {
            console.log("Using Gemini API...");
            console.log("API Key present:", process.env.GEMINI_API_KEY ? "Yes (GEMINI)" : process.env.GOOGLE_API_KEY ? "Yes (GOOGLE)" : "No");
            try {
                // Using gemini-2.5-flash-lite as requested.
                // It offers 4,000 RPM (Requests Per Minute) and is highly efficient.
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY!);
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
                const result = await model.generateContent([
                    SYSTEM_PROMPT + "\n\nRESUME TEXT:\n" + text
                ]);
                const response = result.response;
                let content = response.text();
                console.log("Gemini raw response:", content.substring(0, 500));
                // Clean markdown code blocks if present
                content = content.replace(/```json/g, "").replace(/```/g, "").trim();
                parsedData = JSON.parse(content);
                console.log("Gemini parsed data:", JSON.stringify(parsedData).substring(0, 500));
            } catch (e: any) {
                console.error("Gemini Error:", e.message || e);
            }
        } else if (!parsedData) {
            console.log("No LLM API key found. GEMINI_API_KEY:", !!process.env.GEMINI_API_KEY, "GOOGLE_API_KEY:", !!process.env.GOOGLE_API_KEY);
        }

        if (!parsedData) {
            // Mock Fallback if no keys available or LLM fails
            // Basic regex extraction for email/phone at least
            const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
            const phoneMatch = text.match(/(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/);

            parsedData = {
                personalInfo: {
                    name: "",
                    email: emailMatch ? emailMatch[0] : "",
                    phone: phoneMatch ? phoneMatch[0] : "",
                    city: ""
                },
                socialLinks: { linkedin: "", facebook: "", twitter: "", website: "" },
                experience: [],
                education: []
            };
        }

        return NextResponse.json({ success: true, data: parsedData, text });

    } catch (error: any) {
        console.error("Resume Parse Handler Error", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Helper to parse PDF using pdf2json
function parsePdfBuffer(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        const pdff = new (PDFParser as any)(null, 1); // 1 = text content
        pdff.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
        pdff.on("pdfParser_dataReady", (pdfData: any) => {
            // Extract raw text content
            // pdf2json returns URL-encoded text in its raw format sometimes, or we can use getRawTextContent()
            // But getRawTextContent() prints to console in some versions or returns raw string.
            // cleaner approach:
            const raw = pdff.getRawTextContent();
            resolve(raw);
        });
        pdff.parseBuffer(buffer);
    });
}
