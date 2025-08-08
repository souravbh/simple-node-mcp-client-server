import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import ollama from 'ollama'
import readline from 'readline';
import { inspect } from 'node:util';

const ollamaOptions = {
  temperature: 0,
};

const messages = [];

const verbose = false;
const log = function (message) {
  if (verbose) {
    console.log(message);
  }
};

const transport = new StdioClientTransport({
  command: "node",
  args: [
    "mcp-server.js"
  ],
});

const client = new Client(
  {
    name: "mcp-client",
    version: "1.0.0"
  }
);

await client.connect(transport);

let availableTools = await client.listTools();
for (let i = 0; i < availableTools.tools.length; i++) {
  availableTools.tools[i].parameters = availableTools.tools[i].inputSchema;
  delete availableTools.tools[i].inputSchema;
  availableTools.tools[i] = {
    type: 'function',
    function: availableTools.tools[i],
  };
}
availableTools = availableTools.tools;
console.log("Available tools:", JSON.stringify(availableTools));

async function handleResponse(messages, response) {
  // push the models response to the chat
  messages.push(response.message);

  if (response.message.tool_calls && response.message.tool_calls.length != 0) {
    for (const tool of response.message.tool_calls) {
      // log the function calls so that we see when they are called
      log('  FUNCTION CALLED WITH: ' + inspect(tool));
      log('  CALLED:' + tool.function.name);
      try {
        const funcResponse = await client.callTool({
          name: tool.function.name,
          arguments: tool.function.arguments,
        });
        for (let i = 0; i < funcResponse.content.length; i++) {
          messages.push({
            role: 'tool',
            content: funcResponse.content[i].text,
          });
        }
      } catch (e) {
        messages.push({ role: 'tool', content: `tool call failed: ${e}` });
      }
    }

    // call the model again so that it can process the data returned by the
    // function calls
    return handleResponse(
      messages,
      await ollama.chat({
        model: 'llama3.1',
        messages: messages,
        tools: availableTools,
        options: ollamaOptions,
      }),
    );
  } else {
    // no function calls just return the response
    return response;
  }
}

while (true) {
  const userMessage = await getUserInput();
  const response = await askQuestion(userMessage);
  console.log(response);
}

async function askQuestion(question) {
  messages.push({ role: 'user', content: question });
  const response = await ollama.chat({
    model: 'llama3.1',
    messages: messages,
    tools: availableTools,
    options: ollamaOptions,
  });
  return (await handleResponse(messages, response)).message.content;
}


function getUserInput() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question('> ', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}
