const fs = require("fs");
const path = require("path");
const readline = require("readline");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const inputPath = "./chapters";
const outputPath = "./chaptersEnglisch";

async function main() {
  let files = fs.readdirSync("./chapters");

  files = files.filter(
    (file) => !file.includes("00") || !file.endsWith(".tex")
  );

  files.forEach(async (inputFile) => {
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
  });
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

async function test() {
  line =
    "Seit Manifest Version 3 verwendet Chrome \textit{Service Worker} anstelle von dauerhaften Hintergrundseiten, wodurch Ressourcen effizienter genutzt werden. Zudem müssen Skripte über die \texttt{chrome.scripting}-API in Webseiten eingefügt werden, da direkter Zugriff aus dem Hintergrundskript nicht mehr erlaubt ist. Durch dieses modulare System ermöglichen Chrome Extensions eine nahtlose Integration in den Browser und die Anpassung von Webseiten sowie Benutzerinteraktionen.";
  const res = await processLine(line);
  console.log(res.choices[0].message.content);
}
//test();
main();
