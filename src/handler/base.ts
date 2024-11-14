import { HandlerContext, getUserInfo } from "@xmtp/message-kit";
import { brian, extractParameters } from "../lib/brian.js";
import { sendTransaction } from "../lib/smartAccount.js";
import { getAccount } from "../lib/account.js";
import config from "../config.js";
import { computeAddress, getChain, getRpcUrl } from "../utils.js";
import { SUPPORTED_CHAINS } from "../constants.js";
import { base, baseSepolia } from "viem/chains";
import { createPublicClient, http } from "viem";

const ASK_PROMPT_SUFFIX = "Please explain in no more than 5 lines.";

const helpMessage = `
Hello! I am the Brain AI Agent Bot. Here are the commands you can use:

1. **/ask**: Ask me any question and I will provide an answer.
   - Example: \`/ask What is the blockchain?\`

2. **/receive**: Get the address to which you can send your money. This address will be used as the source for your transanctions
   - Example: \`/receive Base Sepolia\`

3. **/transfer**: Transfer money to an address by specifying: action, amount, token, chain and receiver.
   - Example: \`/transfer Transfer 0.000001 ETH to 0x20c6F9006d563240031A1388f4f25726029a6368 on Base Sepolia\`

How can I assist you today?
`;

export async function handleHelp(context: HandlerContext) {
  await context.reply(helpMessage);
}

export async function handleAsk(context: HandlerContext) {
  const {
    content: { params },
  } = context.message;
  
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

export async function handleTransfer(context: HandlerContext) {
  const {
    content: { params },
  } = context.message;
  
  if (!params || !params.prompt) {
    await context.reply("Please provide a valid prompt.");
    return;
  }

  const prompt: string = params.prompt;

  try {
    const {action, token1, chain, address, amount } = await extractParameters(prompt);
    const computedAddress = computeAddress(address!);
    const userInfo = await getUserInfo(computedAddress);
    const resolvedAddress = userInfo?.address

    if(!SUPPORTED_CHAINS.includes(chain.toLowerCase())){
      await context.reply(`Chain not supported. Supported chains are: ${SUPPORTED_CHAINS.join(", ")}`);
      return;
    }
    
    if(! resolvedAddress) {
      await context.reply(`The address ${computedAddress} could not be resolved`);
      return;
    }

    console.log("Resolved address " + resolvedAddress);

    const viemChain = getChain(chain);
    
    if (
      action.toLowerCase() === "transfer" &&
      token1!.toLowerCase() === "eth"
    ) {
      const tx = await sendTransaction(
        resolvedAddress as `0x${string}`,
        amount as string,
        viemChain.id
      );
      await context.reply(`The transaction ${tx} has been executed. View on Block Explorer: ${viemChain.blockExplorers.default.url}/tx/${tx}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
      await context.reply(error.message);
    } else {
      console.log(error);
      await context.reply("An error has occurred");
    }
    return;
  }
}

export async function handleReceive(context: HandlerContext) {
  const {
    content: { params },
  } = context.message;

  if (!params || !params.chain || !SUPPORTED_CHAINS.includes(params.chain.toLowerCase())) {
    await context.reply(`Chain not supported. Supported chains: ${SUPPORTED_CHAINS.join(", ")}`);
    return;
  }

  const isBaseSepolia = params.chain.toLowerCase() === "base sepolia";
  const chain = isBaseSepolia ? baseSepolia : base;

  const client = createPublicClient({
    chain,
    transport: http(getRpcUrl(isBaseSepolia)),
  });


  const account = await getAccount(config.account_type, client);
  await context.reply(`Send your money to the account ${account.address}`);
}
