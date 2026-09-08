/* =================================================================
   EDUVERSE — SMART LESSON GENERATOR
   -------------------------------------------------------------------
   Honest scope note: this is a real, working, fully client-side
   text-extraction + rule-based drafting pipeline — NOT a call to an
   AI/LLM service (this static app has no backend or model access).
   It reads the actual uploaded file, extracts its real text, and uses
   straightforward heuristics (frequency, position, sentence-splitting)
   to pre-fill the Lesson editor's fields as an editable first draft.
   The teacher always reviews/edits the result before saving — the
   Teacher Dashboard UI labels this clearly as a "draft assistant".

   Requires (loaded via CDN in teacher-dashboard.html, before this file):
     - pdf.js   (window.pdfjsLib)   → PDF text extraction
     - mammoth  (window.mammoth)    → DOCX text extraction
     - JSZip    (window.JSZip)      → PPTX slide-XML text extraction
   Every extractor checks its library exists before using it, and
   throws a clear, user-facing error if a library failed to load
   (e.g. no internet access) instead of failing silently.
   ================================================================= */

const LessonGenerator = (function () {
  const STOPWORDS = new Set([
    "the","a","an","and","or","of","to","in","on","for","is","are","was","were","with","as","by","that","this",
    "it","its","be","at","from","which","these","those","their","has","have","had","not","but","can","will",
    "we","you","your","our","also","into","such","may","when","where","how","what","why","if","then","than",
    "من","في","على","إلى","عن","الى","هذا","هذه","ذلك","تلك","التي","الذي","و","أو","ثم","كما","كل","بعض",
  ]);

  /* -----------------------------------------------------------------
     1) FILE → RAW TEXT
     ----------------------------------------------------------------- */
  async function extractTextFromPdf(arrayBuffer) {
    if (typeof window.pdfjsLib === "undefined") {
      throw new Error("مكتبة قراءة PDF غير متاحة حاليًا (يتطلب اتصالاً بالإنترنت لتحميلها).");
    }
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item) => item.str).join(" ") + "\n\n";
    }
    return text;
  }

  async function extractTextFromDocx(arrayBuffer) {
    if (typeof window.mammoth === "undefined") {
      throw new Error("مكتبة قراءة Word غير متاحة حاليًا (يتطلب اتصالاً بالإنترنت لتحميلها).");
    }
    const result = await window.mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  async function extractTextFromPptx(arrayBuffer) {
    if (typeof window.JSZip === "undefined") {
      throw new Error("مكتبة قراءة PowerPoint غير متاحة حاليًا (يتطلب اتصالاً بالإنترنت لتحميلها).");
    }
    const zip = await window.JSZip.loadAsync(arrayBuffer);
    const slideFiles = Object.keys(zip.files)
      .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort((a, b) => {
        const na = Number(a.match(/slide(\d+)\.xml/)[1]);
        const nb = Number(b.match(/slide(\d+)\.xml/)[1]);
        return na - nb;
      });

    let text = "";
    for (const name of slideFiles) {
      const xml = await zip.files[name].async("string");
      const runs = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1]);
      text += runs.join(" ") + "\n\n";
    }
    return text;
  }

  async function extractText(file) {
    const buffer = await file.arrayBuffer();
    const name = file.name.toLowerCase();
    if (name.endsWith(".pdf")) return extractTextFromPdf(buffer);
    if (name.endsWith(".docx")) return extractTextFromDocx(buffer);
    if (name.endsWith(".pptx")) return extractTextFromPptx(buffer);
    throw new Error("الصيغ المدعومة حاليًا: PDF أو Word (.docx) أو PowerPoint (.pptx) فقط.");
  }

  /* -----------------------------------------------------------------
     2) RAW TEXT → HEURISTIC DRAFT
     ----------------------------------------------------------------- */
  function splitSentences(text) {
    return text
      .replace(/\s+/g, " ")
      .split(/(?<=[.!؟?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 15 && s.length < 220);
  }

  function splitParagraphs(text) {
    return text.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 20);
  }

  /** Frequency-based candidate term extraction: capitalized English
   *  words/phrases (typical of key terms in a document) or, for Arabic
   *  text, standalone words of 4+ letters repeated more than once. */
  function extractCandidateTerms(text, max = 10) {
    const englishCandidates = [...text.matchAll(/\b([A-Z][a-zA-Z]{3,})\b/g)].map((m) => m[1]);
    const arabicWords = text.match(/[\u0600-\u06FF]{4,}/g) || [];

    const freq = {};
    [...englishCandidates, ...arabicWords].forEach((w) => {
      const key = w.trim();
      if (STOPWORDS.has(key.toLowerCase())) return;
      freq[key] = (freq[key] || 0) + 1;
    });

    return Object.entries(freq)
      .filter(([, count]) => count >= 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, max)
      .map(([term]) => term);
  }

  function findSentenceFor(term, sentences) {
    return sentences.find((s) => s.includes(term)) || `${term} — مصطلح ورد في المستند المرفوع.`;
  }

  function buildQuizFromTerms(terms, sentences) {
    const quiz = [];
    terms.slice(0, 5).forEach((term, i) => {
      const sentence = sentences.find((s) => s.includes(term));
      if (!sentence) return;
      const blanked = sentence.replace(term, "______");
      const distractors = shuffle(terms.filter((t) => t !== term)).slice(0, 3);
      if (distractors.length < 3) return;
      const options = shuffle([term, ...distractors]);
      quiz.push({
        question: blanked,
        options,
        correctIndex: options.indexOf(term),
        explanation: `الإجابة الصحيحة هي "${term}"، كما ورد في المستند الأصلي.`,
        category: "general",
      });
    });
    return quiz;
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Turns raw extracted text into a full draft lesson object, shaped
   *  exactly like what the Lesson editor's form already expects — so
   *  it can populate every field directly, with the teacher free to
   *  edit anything before saving. */
  function buildDraft(rawText, fallbackTitle) {
    const paragraphs = splitParagraphs(rawText);
    const sentences = splitSentences(rawText);
    const terms = extractCandidateTerms(rawText, 8);

    const title = (paragraphs[0]?.split(/[.!؟?\n]/)[0] || fallbackTitle || "درس جديد").slice(0, 90).trim();
    const description = (sentences[0] || paragraphs[0] || "").slice(0, 220);

    const objectives = terms.slice(0, 4).map((t) => `التعرف على "${t}" وفهم دوره في موضوع الدرس.`);
    if (!objectives.length) objectives.push("فهم الأفكار الرئيسية الواردة في هذا الدرس.");

    const vocabulary = terms.slice(0, 6).map((t) => ({ term: t, definition: findSentenceFor(t, sentences).slice(0, 160) }));

    const quiz = buildQuizFromTerms(terms, sentences);

    const summary = sentences.slice(0, 3).join(" ").slice(0, 260) || "ملخص هذا الدرس مبني على محتوى الملف المرفوع.";
    const challenge = terms[0]
      ? `تحدٍ: اشرح بأسلوبك الخاص العلاقة بين "${terms[0]}" و"${terms[1] || "الموضوع العام للدرس"}".`
      : "تحدٍ: لخّص أهم فكرة وردت في هذا الملف بجملتين.";

    return { title, description, objectives, vocabulary, quiz, summary, challenge };
  }

  /** Public entry point: file → draft (async, may throw a friendly
   *  error the caller should display to the teacher). */
  async function generateFromFile(file) {
    const rawText = await extractText(file);
    if (!rawText || rawText.trim().length < 40) {
      throw new Error("تعذّر استخراج نص كافٍ من هذا الملف. جرّب ملفًا آخر أو أدخل بيانات الدرس يدويًا.");
    }
    return buildDraft(rawText, file.name.replace(/\.[^.]+$/, ""));
  }

  return { generateFromFile };
})();
