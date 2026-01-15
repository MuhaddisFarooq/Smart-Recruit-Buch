
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const fs = require("fs");
const path = require("path");

const checkTags = (filename) => {
    const templatePath = path.join(process.cwd(), "public/letters", filename);
    if (!fs.existsSync(templatePath)) {
        console.log(`File not found: ${templatePath}`);
        return;
    }

    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);

    // Get text
    const doc = new Docxtemplater(zip);
    const text = doc.getFullText();

    console.log(`--- Content of ${filename} ---`);
    console.log(text);
    console.log("-------------------------------");

    // Check for specific tokens
    console.log(`Contains {salary} tag? ${text.includes("{salary}")}`);
    console.log(`Contains 75,000? ${text.includes("75,000")}`);
};

checkTags("Offer_Letter_Full Time.docx");
