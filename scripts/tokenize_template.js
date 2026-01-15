
const PizZip = require("pizzip");
const fs = require("fs");
const path = require("path");

const tokenize = (filename) => {
    const templatePath = path.join(process.cwd(), "public/letters", filename);
    if (!fs.existsSync(templatePath)) {
        console.log(`File not found: ${templatePath}`);
        return;
    }

    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);

    let docXml = zip.file("word/document.xml").asText();
    if (!docXml) {
        console.log("Could not read document.xml");
        return;
    }

    // Replace static values appearing in the screenshot with tags
    let modifiedXml = docXml;

    // Explicit static string replacements based on user screenshot
    // Note: Word often splits strings with <w:t> tags. Simple global replace might fail if split.
    // We try exact matches first.

    const replacements = [
        { find: "Waqas Masood", replace: "{name}" },
        { find: "36302-9033690-3", replace: "{cnic}" },
        { find: "Operations Coordinator", replace: "{job_title}" },
        { find: "PKR 75,000/-", replace: "PKR {salary}/-" },
        { find: "75,000", replace: "{salary}" },
        { find: "Department: Operations", replace: "Department: {department}" },
        { find: "Operations", replace: "{department}" }
        // "Operations" is risky as it might replace "Operations Coordinator", but since we did job_title first, it should be ok?
        // Actually, "Operations Coordinator" replacement earlier removes "Operations" from that string.
        // So replacing "Operations" (standalone) with {department} should work for "Department: Operations".
    ];

    let changed = false;
    for (const item of replacements) {
        if (modifiedXml.includes(item.find)) {
            console.log(`Found "${item.find}", replacing with "${item.replace}"...`);
            // Use split/join for global replace
            modifiedXml = modifiedXml.split(item.find).join(item.replace);
            changed = true;
        } else {
            console.log(`Did not find "${item.find}" exactly.`);
        }
    }

    if (changed) {
        console.log(`Tokenizing ${filename}... Replacements made.`);
        zip.file("word/document.xml", modifiedXml);

        const buffer = zip.generate({ type: "nodebuffer" });
        fs.writeFileSync(templatePath, buffer);
        console.log("File saved.");
    } else {
        console.log(`No exact static text matches found in ${filename}. XML might be fragmented.`);
        // Inspect XML snippet to see how it's broken up?
        // console.log(docXml.substring(0, 5000));
    }
};

tokenize("Offer_Letter_Full Time.docx");
tokenize("Offer_Letter_Locum.docx");
