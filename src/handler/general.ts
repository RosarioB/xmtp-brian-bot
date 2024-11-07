import { HandlerContext } from "@xmtp/message-kit";
import { brian } from "../lib/brian.js";

const ASK_PROMPT_SUFFIX = "Please explain in no more than 5 lines.";

export async function handleHelp(context: HandlerContext) {
  await context.reply(
    "Hello I am the Brain AI Agent Bot. How can I help you today?"
  );
}

export async function handleAsk(context: HandlerContext) {
  const {
    content: { params },
  } = context.message;

   /* /ask What is the blockchain?
      command ask
      params  { query: 'what is the blockchain?' } 
   */

  if (!params || !params.query) {
    await context.reply("Please provide a query.");
    return;
  }

  const query = params.query;

  try {
    const result = await brian.ask({
      prompt: query + ASK_PROMPT_SUFFIX,
      kb: "public-knowledge-box",
    });

    if (!result || !result.answer) {
      await context.reply("I don't know the answer to that question.");
      return;
    }
    await context.reply(result.answer);
  } catch (error) {
    await context.reply("An error occurred while processing your request.");
  }
}
