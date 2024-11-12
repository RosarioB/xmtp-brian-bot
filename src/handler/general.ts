import { HandlerContext } from "@xmtp/message-kit";
import { brian, extractParameters } from "../lib/brian.js";
import { sendTransaction } from "../lib/smartAccount.js";

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
    await context.reply("Please provide a valid query.");
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

export async function handleTransaction(context: HandlerContext) {
  const {
    content: { params },
  } = context.message;

  /* /transaction Transfer 0.000002 ETH to 0x20c6F9006d563240031A1388f4f25726029a6368 on Base Sepolia
      command transaction
      params  { prompt: 'Transfer 0.000002 ETH to 0x20c6F9006d563240031A1388f4f25726029a6368 on Base Sepolia' } 
  */

  if (!params || !params.prompt) {
    await context.reply("Please provide a valid prompt.");
    return;
  }

  const prompt: string = params.prompt;

  try {
    const completion = await extractParameters(prompt);

    if (
      completion.action.toLowerCase() === "transfer" &&
      completion.token1!.toLowerCase() === "eth"
    ) {
      const tx = await sendTransaction(
        completion.address as `0x${string}`,
        completion.amount as string
      );

      await context.reply(`The transaction ${tx} has been executed`);
    }
  } catch (error) {
    if (error instanceof Error) {
      await context.reply(error.message);
    } else {
      await context.reply("An error has occurred");
    }
  }
}
