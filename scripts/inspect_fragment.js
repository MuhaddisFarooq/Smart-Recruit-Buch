
const PizZip = require("pizzip");
const fs = require("fs");
const path = require("path");

const inspect = (filename) => {
    const templatePath = path.join(process.cwd(), "public/letters", filename);
    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);
    let docXml = zip.file("word/document.xml").asText();

    // Find "75"
    let indices = [];
    let idx = docXml.indexOf(">75<"); // Look for content 75
    if (idx !== -1) indices.push(idx);

    // Look for just 75 inside a tag w:t
    // Try finding "75" specifically
    idx = docXml.indexOf("75");

    console.log(`Analyzing ${filename}...`);
    if (idx !== -1) {
        console.log("Found '75' at index", idx);
        console.log("CONTEXT:");
        console.log(docXml.substring(idx - 100, idx + 400));
    } else {
        console.log("'75' not found at all!");
    }
};

inspect("Offer_Letter_Full Time.docx");
