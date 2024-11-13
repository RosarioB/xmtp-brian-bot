import { HandlerContext } from "@xmtp/message-kit";
import { brian, extractParameters } from "../lib/brian.js";
import { sendTransaction } from "../lib/smartAccount.js";
import { getAccount } from "../lib/account.js";
import config from "../config.js";

const ASK_PROMPT_SUFFIX = "Please explain in no more than 5 lines.";

const helpMessage = `
Hello! I am the Brain AI Agent Bot. Here are the commands you can use:

1. **/ask**: Ask me any question and I will provide an answer.
   - Example: \`/ask What is the blockchain?\`

2. **/receive**: Get the address to which you can send your money. This address will be used as the source for your transanctions
   - Example: \`/receive\`

3. **/transaction**: Perform a transaction by specifying the action, amount, token, and receiver.
   - Example: \`/transaction Transfer 0.000002 ETH to 0x20c6F9006d563240031A1388f4f25726029a6368 on Base Sepolia\`

How can I assist you today?
`;

export async function handleHelp(context: HandlerContext) {
  await context.reply(helpMessage);
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

export async function handleReceive(context: HandlerContext) {
  const account = await getAccount(config.account_type);
  await context.reply(`Send your money to the account ${account.address}`);
}
