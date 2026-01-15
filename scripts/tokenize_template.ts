
import PizZip from "pizzip";
import fs from "fs";
import path from "path";

const tokenize = (filename: string) => {
    const templatePath = path.join(process.cwd(), "public/letters", filename);
    if (!fs.existsSync(templatePath)) {
        console.log(`File not found: ${templatePath}`);
        return;
    }

    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);

    let docXml = zip.file("word/document.xml")?.asText();
    if (!docXml) {
        console.log("Could not read document.xml");
        return;
    }

    // Replace static values appearing in the screenshot with tags
    // The static values might be split across runs/tags in XML, so this is a bit risky but worth a try for exact matches.
    // We will do simple string replacement.

    let modifiedXml = docXml;

    // Name: "Waqas Masood" -> "{name}"
    modifiedXml = modifiedXml.replace(/Waqas Masood/g, "{name}");

    // CNIC: "36302-9033690-3" -> "{cnic}"
    // Note: XML might escape characters? CNIC usually safe.
    modifiedXml = modifiedXml.replace(/36302-9033690-3/g, "{cnic}");

    // Title: "Operations Coordinator" -> "{job_title}"
    modifiedXml = modifiedXml.replace(/Operations Coordinator/g, "{job_title}");

    // Department: "Operations" (Be careful with context)
    // In screenshot: "Department: Operations."
    modifiedXml = modifiedXml.replace(/Department: Operations/g, "Department: {department}");

    // Salary: "75,000" -> "{salary}"
    modifiedXml = modifiedXml.replace(/75,000/g, "{salary}");

    // Also check for "PKR 75,000" if above fails
    modifiedXml = modifiedXml.replace(/PKR 75,000/g, "PKR {salary}");

    if (modifiedXml !== docXml) {
        console.log(`Tokenizing ${filename}... Replacements made.`);
        zip.file("word/document.xml", modifiedXml);

        const buffer = zip.generate({ type: "nodebuffer" });
        fs.writeFileSync(templatePath, buffer);
        console.log("File saved.");
    } else {
        console.log(`No exact static text matches found in ${filename}. XML might be fragmented.`);
        // Fallback: Just log the XML to see fragments? Too large.
    }
};

tokenize("Offer_Letter_Full Time.docx");
// tokenize("Offer_Letter_Locum.docx"); // Do one for now
