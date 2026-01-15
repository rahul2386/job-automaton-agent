const axios = require("axios");
const cheerio = require("cheerio");

const GROQ_API_KEY = process.env.GROQ_API_KEY;

function extractRealUrl(ddgUrl) {
  try {
    const parsed = new URL(ddgUrl);
    const uddg = parsed.searchParams.get("uddg");
    if (!uddg) return ddgUrl;

    // decode percent-encoded URL
    return decodeURIComponent(uddg);
  } catch {
    return ddgUrl;
  }
}

/**
 * Search the web using DuckDuckGo HTML results.
 */
async function searchWeb(query, limit = 3) {
  const url = "https://duckduckgo.com/html/?q=" + encodeURIComponent(query);

  const res = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  const $ = cheerio.load(res.data);
  const results = [];

  $("a.result__a").each((i, el) => {
    if (i >= limit) return false;

    const title = $(el).text().trim();
    const rawUrl = $(el).attr('href');
    const realUrl = extractRealUrl(rawUrl);
    const snippet =
      $(el).closest(".result").find(".result__snippet").text().trim() || "";

    results.push({
      title,
      url: realUrl,
      snippet
    });
  });

  return results;
}

/**
 * Use Groq to summarize skills from search results.
 */
async function summarizeSkillsFromSearch(searchResults, originalCommand) {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set in .env");
  }

  if (!Array.isArray(searchResults) || searchResults.length === 0) {
    return {
      summary: "No search results available to summarize.",
      skills: [],
    };
  }

  const jobsText = searchResults
    .map(
      (r, i) =>
        `Result ${i + 1}:\nTitle: ${r.title}\nSnippet: ${
          r.snippet || ""
        }\nURL: ${r.url}\n`
    )
    .join("\n");

  const prompt = `
You are analyzing web search results for the following user command:
"${originalCommand}"

Here are the search results:
${jobsText}

From these, infer the likely required skills.

Return ONLY valid JSON in this shape:
{
  "summary": "short 2-4 sentence summary of the main skills required overall",
  "skills": ["skill 1", "skill 2", "..."]
}

Skills should be clean labels like "React", "JavaScript", "HTML", "CSS", "Git", "REST APIs", etc.
No markdown, no extra text, just JSON.
`;

  const res = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    },
    {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  const content = res.data?.choices?.[0]?.message?.content?.trim() || "{}";

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    parsed = { summary: content, skills: [] };
  }

  return parsed;
}

async function extractRecentJobsFromSearch(searchResults, originalCommand) {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set in .env");
  }

  if (!Array.isArray(searchResults) || searchResults.length === 0) {
    return [];
  }

  const searchContext = searchResults
    .map(
      (r, i) =>
        `Result ${i + 1}
Title: ${r.title}
Snippet: ${r.snippet || ""}
URL: ${r.url}`
    )
    .join("\n\n");

  const prompt = `
You are extracting job listings from search results.

USER INTENT:
"${originalCommand}"

TASK:
From the search results below, extract job listings that are:
1) Posted within the last 3 days (STRICT)
2) If very few jobs match strictly, allow inferred freshness (LENIENT)

STRICT RULES:
- Include ONLY if posting time is explicit:
  "today", "1 day ago", "2 days ago", "3 days ago"
- Exclude anything older than 3 days

LENIENT RULES (ONLY if strict jobs < 3):
- Include jobs WITHOUT explicit date ONLY if:
  - Words like: "new", "urgent", "hiring now", "immediate"
  - Looks like a job listing (not blog/article)

For EACH job, return:
- title
- company (if known)
- url
- location (if known)
- skills (array)
- experience (string or null)
- salary (string or null)
- posted (e.g. "2 days ago" or "recent")
- confidence ("strict" or "lenient")

RETURN FORMAT (JSON ONLY):
{
  "jobs": [
    {
      "title": "...",
      "company": "...",
      "url": "...",
      "location": "...",
      "skills": ["..."],
      "experience": "...",
      "salary": "...",
      "posted": "...",
      "confidence": "strict | lenient"
    }
  ]
}

IMPORTANT:
- Return ONLY valid JSON
- No markdown
- No explanations
- If nothing matches, return { "jobs": [] }

SEARCH RESULTS:
${searchContext}
`;

  const res = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
    },
    {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  const content = res.data?.choices?.[0]?.message?.content?.trim() || "{}";

  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed.jobs) ? parsed.jobs : [];
  } catch {
    return [];
  }
}

/**
 * Execute a plan (objective + actions[]) and return data.
 * Handles:
 * - type: 'search_web'
 * - type: 'extract_listings' (currently NO-OP)
 * - type: 'summarize' (we treat any target as skills summary for now)
 */
async function executePlan(plan, originalCommand) {
  const data = {
    searchResults: [],
    jobs: [],
    summary: null,
    skills: [],
  };

  if (!plan || !Array.isArray(plan.actions)) {
    return data;
  }

  for (const action of plan.actions) {
    const type = action.type;
    const params = action.params || {};

    if (type === "search_web") {
      const query = params.query || originalCommand || "";
      const limit = Number(params.limit) || 3;
      const results = await searchWeb(query, limit);
      data.searchResults = results;
    }

    if (type === "extract_listings") {
      // For now, we don't have per-job-detail scraping,
      // so treat this as a NO-OP. Later we can extend.
      // We still keep data.searchResults as the source.
      continue;
    }

    // if (type === 'summarize') {
    //   // Planner is sending: target: "job_listings", field: "skills"
    //   // For now we ignore those details and always summarize skills
    //   const summaryResult = await summarizeSkillsFromSearch(
    //     data.searchResults,
    //     originalCommand
    //   );
    //   data.summary = summaryResult.summary;
    //   data.skills = summaryResult.skills || [];
    // }
    if (type === "summarize") {
      const jobResult = await extractRecentJobsFromSearch(
        data.searchResults,
        originalCommand
      );
      data.jobs = jobResult;
    }
  }

  return data;
}

module.exports = {
  executePlan,
};
