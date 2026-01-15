
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import fs from "fs";
import path from "path";

const inspect = (filename: string) => {
    const templatePath = path.join(process.cwd(), "public/letters", filename);
    if (!fs.existsSync(templatePath)) {
        console.log(`File not found: ${templatePath}`);
        return;
    }

    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
    });

    const text = doc.getFullText();
    console.log(`--- Content of ${filename} ---`);
    console.log(text);
    console.log("-------------------------------");

    // Simple regex to find content in curly braces
    const tags = text.match(/\{[^}]+\}/g);
    console.log(`Tags found: ${tags ? tags.join(", ") : "NONE"}`);
};

inspect("Offer_Letter_Full Time.docx");
inspect("Offer_Letter_Locum.docx");
