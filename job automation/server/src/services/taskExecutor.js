const Task = require('../models/Task');
const axios = require('axios');
const { executePlan } = require('./planExecutor');
const { appendLog } = require('./taskLogger');

const GROQ_API_KEY = process.env.GROQ_API_KEY;

async function callGroqForPlan(command, taskId) {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set in .env');
  }

  const prompt = `
You are an automation planner for a web agent.

The user command is:
"${command}"

You must output a JSON plan that a program can execute later.

Return ONLY valid JSON with this exact shape:

{
  "objective": "short one-line goal for the automation",
  "actions": [
    {
      "type": "search_web" | "open_page" | "extract_listings" | "summarize",
      "description": "short human-readable description of this step",
      "params": {
        "query"?: string,
        "limit"?: number,
        "fields"?: string,
        "target"?: string
      }
    }
  ]
}

// Guidelines:
// - Use 3 to 6 actions total.
// - For job/internship queries, usually:
//   - A "search_web" action to search with a query and optional limit (e.g. 3).
//   - An "extract_listings" action to get details (title, company, location, skills, url).
//   - A "summarize" action to summarize things like skills or key info.
// - "params" must be a flat object with simple values (string or number, no nested objects).

Return ONLY the JSON. No explanations, no markdown, no comments.
`;
  await appendLog(taskId, 'planner', 'Requesting plan from Groq');
  const res = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2
    },
    {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const content = res.data?.choices?.[0]?.message?.content?.trim() || '{}';
  await appendLog(taskId, 'planner', 'Received plan from Groq');
  return content;
}

async function runTask(taskId) {
  const task = await Task.findById(taskId);
  if (!task) return;

  try {
    task.status = 'running';
    task.error = null;
    await task.save();
    await appendLog(taskId, 'lifecycle', 'Task started: running');

    // 1) Plan using Groq
let planText;
    try {
      planText = await callGroqForPlan(task.command, taskId);
    } catch (e) {
      await appendLog(taskId, 'planner', `Planner failed: ${e.message}`);
      task.status = 'failed';
      task.error = `Planner failed: ${e.message}`;
      await task.save();
      return;
    }

    let plan;
    try {
      plan = JSON.parse(planText);
      await appendLog(taskId, 'planner', `Plan parsed successfully`);
    } catch (e) {
      await appendLog(taskId, 'planner', `Plan JSON parse failed, storing raw plan`);
      plan = { raw: planText };
    }


    // 2) Execute plan (for now only search_web)
await appendLog(taskId, 'executor', 'Beginning plan execution');
    let data = {};
    try {
      data = await executePlan(plan, task.command, async (subStepName, msg) => {
        // optional: if executePlan supports progress callback, not required
        await appendLog(taskId, subStepName, msg);
      });
      await appendLog(taskId, 'executor', 'Plan execution completed');
    } catch (e) {
      await appendLog(taskId, 'executor', `Execution failed: ${e.message}`);
      data = { error: e.message };
    }

     // 3) Save
    task.status = 'completed';
    task.result = {
      ...plan,
      data
    };
    await task.save();
    await appendLog(taskId, 'lifecycle', 'Task completed');
  } catch (err) {
    console.error('Error running task:', err);
    await appendLog(taskId, 'error', err.message || 'Unknown');
    task.status = 'failed';
    task.error = err.message || 'Unknown error';
    await task.save();
  }
}

function enqueueTask(taskId) {
  setTimeout(() => {
    runTask(taskId).catch(console.error);
  }, 0);
}

module.exports = {
  enqueueTask
};