
const PizZip = require("pizzip");
const fs = require("fs");
const path = require("path");

const finalize = (filename) => {
    const templatePath = path.join(process.cwd(), "public/letters", filename);
    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);
    let docXml = zip.file("word/document.xml").asText();

    let modifiedXml = docXml;
    let changed = false;

    // Regex 1: "PKR" ... "75" ... ",000" ... "/-"
    // Allows for any XML tags (<...>) and whitespace in between.
    const regex1 = /PKR(<[^>]+>|\s)*75(<[^>]+>|\s)*,000(<[^>]+>|\s)*\/-/g;

    if (regex1.test(modifiedXml)) {
        console.log("Match found for broken 'PKR 75,000/-'");
        // Replace with: PKR {salary}/-
        // We need to keep the structure valid? 
        // Docxtemplater works best if {salary} is in ONE <w:t> tag.
        // Replacing a span of tags with text might break XML if we cut start/end tags incorrectly.
        // However, usually text is inside <w:t>...</w:t>.
        // If we wipe out the whole sequence and replace with "PKR {salary}/-", we might remove closing </w:t> and opening <w:t>.
        // SAFE approach: Find the sequence, but carefully wrap replacement in <w:r><w:t>PKR {salary}/-</w:t></w:r> ? 
        // Or just replace the TEXT contents of fragments? No, that's hard.

        // Risky Replace:
        modifiedXml = modifiedXml.replace(regex1, "PKR {salary}/-");
        // This is risky because if match spans across <w:p> or <w:r>, removing them might break structure.
        // But usually "PKR 75,000/-" is on one line.
        changed = true;
    }

    // Regex 2: just "75,000"
    const regex2 = /75(<[^>]+>|\s)*,000/g;
    if (!changed && regex2.test(modifiedXml)) {
        console.log("Match found for broken '75,000'");
        modifiedXml = modifiedXml.replace(regex2, "{salary}");
        changed = true;
    }

    // Fallback: Check if "75" and "000" exist close to each other
    if (!changed && modifiedXml.includes("75") && modifiedXml.includes("000")) {
        console.log("Warning: 75 and 000 exist but regex failed.");
    }

    if (changed) {
        zip.file("word/document.xml", modifiedXml);
        const buffer = zip.generate({ type: "nodebuffer" });
        fs.writeFileSync(templatePath, buffer);
        console.log("File saved with tokenized salary.");
    } else {
        console.log("No matches found for salary pattern.");
    }
};

finalize("Offer_Letter_Full Time.docx");
