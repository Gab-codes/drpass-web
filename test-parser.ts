import fs from "fs";
import { parseXlsx } from "./app/lib/import-parser";

async function test() {
  const buffer = fs.readFileSync("./public/account.xlsx");
  const file = new File([buffer], "account.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

  try {
    const result = await parseXlsx(file);
    console.log("Summary:", result.summary);
    
    // Find some known questions from Account 2008 and 2016
    const q2008 = result.questions.filter(q => q.year === 2008);
    console.log(`\nFound ${q2008.length} questions for 2008.`);
    if (q2008.length > 0) {
      console.log("\nSample 2008 question:");
      console.dir(q2008[0], { depth: null });
    }

    const q2016 = result.questions.filter(q => q.year === 2016);
    console.log(`\nFound ${q2016.length} questions for 2016.`);
    if (q2016.length > 0) {
      console.log("\nSample 2016 question (should be parsed despite QUESTION header):");
      console.dir(q2016[0], { depth: null });
    }
    
    const warnings = result.questions.filter(q => q.status === "warning");
    console.log(`\nFound ${warnings.length} warnings (e.g. instruction rows).`);
    if (warnings.length > 0) {
        console.log("\nSample warning row:");
        console.dir(warnings[0], { depth: null });
    }

  } catch (error) {
    console.error("Error parsing:", error);
  }
}

test();
