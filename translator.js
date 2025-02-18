const fs = require("fs");
const path = require("path");
const readline = require("readline");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const inputPath = "./chapters";
const outputPath = "./chaptersEnglisch";

/**
 * Main function to process LaTeX files in the "chapters" directory.
 * It reads each file, processes its lines, and writes the translated content to new files.
 *
 * The function performs the following steps:
 * 1. Reads all files in the "chapters" directory.
 * 2. Filters out files that include "00" or do not end with ".tex".
 * 3. For each file, reads its content line by line.
 * 4. Processes each line based on specific LaTeX commands and structures.
 * 5. Writes the processed lines to a new file with "_translated" appended to the original filename.
 *
 * The function handles LaTeX environments such as figures, itemize, enumerate, description, tables, tabular, center, equations, align, sections, and skips processing for these environments.
 *
 * @async
 * @function main
 * @returns {Promise<void>} A promise that resolves when all files have been processed.
 */

async function main() {
  let files = fs.readdirSync("./chapters");

  files = files.filter(
    (file) => !file.includes("00") || !file.endsWith(".tex")
  );

  for (const inputFile of files) {
    const rl = readline.createInterface({
      input: fs.createReadStream(path.join(inputPath, inputFile)),
      output: process.stdout,
      terminal: false,
    });

    const lines = [];

    for await (const line of rl) {
      lines.push(line);
    }
    const newOutputFile = inputFile.split(".")[0] + "_translated.tex";
    const outputStream = fs.createWriteStream(
      path.join(outputPath, newOutputFile)
    );
    let skip = false;
    let count = 0;
    for (const line of lines) {
      let processedLine;
      if (line.includes("\\begin{figure}") || skip) {
        skip = true;
        processedLine = line;
        if (line.includes("\\end{figure}")) {
          skip = false;
        }
      } else if (
        line.includes("\\item") ||
        line.includes("\\begin{itemize}") ||
        line.includes("\\end{itemize") ||
        line.includes("\\begin{enumerate}") ||
        line.includes("\\end{enumerate") ||
        line.includes("\\begin{description}") ||
        line.includes("\\end{description") ||
        line.includes("\\begin{table") ||
        line.includes("\\end{table") ||
        line.includes("\\begin{tabular") ||
        line.includes("\\end{tabular") ||
        line.includes("\\begin{center") ||
        line.includes("\\end{center") ||
        line.includes("\\begin{equation") ||
        line.includes("\\end{equation") ||
        line.includes("\\begin{align") ||
        line.includes("\\end{align") ||
        line.includes("\\begin{equation*") ||
        line.includes("\\end{equation*") ||
        line.includes("\\begin{align*") ||
        line.includes("\\end{align*") ||
        line.includes("\\begin{equation}") ||
        line.includes("\\end{equation") ||
        line.includes("\\begin{align}") ||
        line.includes("\\end{align") ||
        line.includes("\\begin{equation*}") ||
        line.includes("\\end{equation*") ||
        line.includes("\\begin{align*}") ||
        line.includes("\\end{align*") ||
        line.includes("\\subsubsection}") ||
        line.includes("\\subsection}") ||
        line.includes("\\section}") ||
        line === ""
      ) {
        processedLine = line;
      } else {
        const res = await processLine(line);
        processedLine = res.choices[0].message.content;
      }
      outputStream.write(processedLine + "\n");
      count++;
      console.log(count);
    }

    outputStream.end();
    console.log("Verarbeitung abgeschlossen.");
  }
}

async function processLine(line) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: [
          {
            type: "text",
            text: "Du bist ein Übersetzungstool für LaTeX-Dokumente. Übersetze nur normalen Text von Deutsch nach Englisch und lasse alle LaTeX-Befehle unverändert. Bitte gebe nur den übersetzen Text aus und keine weiteren Beschreibungen oder Kommentare.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: line,
          },
        ],
      },
    ],
    response_format: {
      type: "text",
    },
    temperature: 1,
    max_completion_tokens: 2048,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });
  return response;
}
main();
