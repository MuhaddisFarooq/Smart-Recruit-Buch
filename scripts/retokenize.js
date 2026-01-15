
const PizZip = require("pizzip");
const fs = require("fs");
const path = require("path");

const reTokenize = (filename) => {
    const templatePath = path.join(process.cwd(), "public/letters", filename);
    if (!fs.existsSync(templatePath)) {
        console.log(`File not found: ${templatePath}`);
        return;
    }

    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);

    let docXml = zip.file("word/document.xml").asText();

    // Very simplified XML tag stripping for finding the text location effectively?
    // No, we modify the XML directly.

    let modifiedXml = docXml;
    let changed = false;

    // Target the specific string "75,000"
    // It might be split like "75<w:proofErr.../>,000".
    // We will attempt a regex replace that ignores tags in between digits if possible?
    // Or just try specific common broken patterns.

    // Attempt 1: Simple string replace of known fragments
    const targets = [
        "75,000",
        "75,000/-",
        "PKR 75,000",
        "PKR 75,000/-"
    ];

    targets.forEach(target => {
        if (modifiedXml.includes(target)) {
            console.log(`Found direct match for '${target}'`);
            // If we match "PKR 75,000/-", we replace the numeric part only?
            // User input usually is just number "60000".
            // So we want result "PKR {salary}/-".
            // If target is "PKR 75,000/-", replace with "PKR {salary}/-"

            const replacement = target.replace("75,000", "{salary}");
            modifiedXml = modifiedXml.split(target).join(replacement);
            changed = true;
        }
    });

    // Attempt 2: Regex for broken 75,000
    // "75" then any xml tags then ",000"
    const regex = /75(<[^>]+>)*,000/g;
    if (regex.test(modifiedXml)) {
        console.log("Found fragmented 75,000 via regex");
        modifiedXml = modifiedXml.replace(regex, "{salary}");
        changed = true;
    }

    if (changed) {
        console.log(`Updated ${filename}. Saving...`);
        zip.file("word/document.xml", modifiedXml);
        const buffer = zip.generate({ type: "nodebuffer" });
        fs.writeFileSync(templatePath, buffer);
        console.log("File saved.");
    } else {
        console.log("No 75,000 found (checked fragments too).");
        // Log a snippet around "75" to see what's there?
        const idx = modifiedXml.indexOf("75");
        if (idx !== -1) {
            console.log("Context around 75:", modifiedXml.substring(idx - 50, idx + 100));
        }
    }
};

reTokenize("Offer_Letter_Full Time.docx");
