import { HandlerContext, getUserInfo } from "@xmtp/message-kit";
import {
  brian,
  extractTransferParameters,
  extractSwapParameters,
} from "../lib/brian.js";
import { sendTransaction } from "../lib/smartAccount.js";
import { getAccount } from "../lib/account.js";
import config from "../config.js";
import {
  computeAddress,
  getBotAccount,
  getChain,
  getViemChain,
  getBasePublicClient,
  getSepoliaPublicClient,
  getSepoliaWalletClient,
  getBaseSepoliaWalletClient,
  getUnichainSepoliaWalletClient,
  Chain,
} from "../utils.js";
import {
  BASE_SEPOLIA_USDC_ADDRESS,
  SEPOLIA_WETH_CONTRACT_ADDRESS,
  SUPPORTED_CHAINS,
  SUPPORTED_TOKENS,
} from "../constants.js";
import {
  encodeFunctionData,
  erc20Abi,
  formatEther,
  formatUnits,
  parseUnits,
} from "viem";
import BigNumber from "bignumber.js";
import { CONSTANTS, swapEthToUsdc, wrapEth } from "../lib/uniswap/uniswap.js";
import { baseSepolia, sepolia } from "viem/chains";

const ASK_PROMPT_SUFFIX = "Please explain in no more than 5 lines.";

const helpMessage = `
Hello! I am the Brain AI Agent Bot. Here are the commands you can use:

1. **/ask**: Ask me any question and I will provide an answer.
   - Example: \`/ask What is the blockchain?\`

2. **/receive**: Get the address to send your funds, used as the source for your transactions.
   - Example: \`/receive transfer BaseSepolia\`

3. **/transfer**: Transfer ETH or USDC to another account.
   - Example: \`/transfer Transfer 0.000001 ETH to vitalik on Base Sepolia\`

4. **/wrap**: Wrap ETH into WETH.
   - Example: \`/wrap 0.0001 Sepolia\`     

5. **/swap**: Swap WETH to USDC and transfer it to another account.
   - Example: \`/swap Swap 0.000001 WETH to USDC and send it to vitalik on Sepolia\` 

How can I assist you today?
`;

export async function handleHelp(context: HandlerContext) {
  await context.send(helpMessage);
}

export async function handleAsk(context: HandlerContext) {
  const {
    content: { params },
  } = context.message;

  if (!params || !params.query) {
    await context.send("Please provide a valid query.");
    return;
  }

  const query = params.query;

  try {
    const result = await brian.ask({
      prompt: query + ASK_PROMPT_SUFFIX,
      kb: "public-knowledge-box",
    });

    if (!result || !result.answer) {
      await context.send("I don't know the answer to that question.");
      return;
    }
    await context.send(result.answer);
  } catch (error) {
    await context.send("An error occurred while processing your request.");
  }
}

const validateParameters = async (
  chain: string,
  resolvedAddress: string | undefined,
  computedAddress: string,
  token1: string,
  amount: string
) => {
  if (!SUPPORTED_CHAINS.includes(chain.toLowerCase())) {
    throw new Error(
      `Chain not supported. Supported chains are: ${SUPPORTED_CHAINS.join(
        ", "
      )}`
    );
  }

  if (!resolvedAddress) {
    throw new Error(`The address ${computedAddress} could not be resolved`);
  }

  if (!SUPPORTED_TOKENS.includes(token1.toLowerCase())) {
    throw new Error(
      `Token not supported. Supported chains are: ${SUPPORTED_TOKENS.join(
        ", "
      )}`
    );
  }

  const isBaseSepolia = chain.toLowerCase() === "base sepolia";
  const client = getBasePublicClient(isBaseSepolia);
  const account = await getAccount(config.account_type, client);
  let balance: string;
  if (token1.toLowerCase() === "eth") {
    balance = formatEther(
      await client.getBalance({
        address: account.address,
      })
    );
  } else {
    balance = formatUnits(
      await client.readContract({
        abi: erc20Abi,
        address: BASE_SEPOLIA_USDC_ADDRESS,
        functionName: "balanceOf",
        args: [account.address],
      }),
      6
    );
  }

  if (BigNumber(amount).gte(BigNumber(balance))) {
    throw new Error(
      `Insufficient funds. The current balance of ${account.address} is ${balance} ${token1}`
    );
  }
};

export async function handleTransfer(context: HandlerContext) {
  const {
    content: { params },
  } = context.message;

  if (!params || !params.prompt) {
    await context.send("Please provide a valid prompt.");
    return;
  }

  const prompt: string = params.prompt;

  try {
    const { token1, chain, address, amount } = await extractTransferParameters(
      prompt
    );
    const computedAddress = computeAddress(address!);
    const userInfo = await getUserInfo(computedAddress);
    const resolvedAddress = userInfo?.address;
    await validateParameters(
      chain,
      resolvedAddress,
      computedAddress,
      token1,
      amount
    );
    const viemChain = getChain(chain);

    const tx = await sendTransaction(
      resolvedAddress as `0x${string}`,
      amount as string,
      viemChain.id,
      token1
    );

    await context.send(
      `The transaction ${tx} has been executed. View on Block Explorer: ${viemChain.blockExplorers.default.url}/tx/${tx}`
    );
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
      await context.send(error.message);
    } else {
      console.log(error);
      await context.send("An error has occurred");
    }
  }
}

const validateReceiveParams = (params: any) => {
  const SUPPORTED_ACTION = ["transfer", "swap"];
  const TRANSFER_CHAINS = ["basesepolia", "base"];
  const SWAP_CHAINS = ["basesepolia", "unichainsepolia", "sepolia"];
  if (!params || !params.action || !params.chain) {
    throw new Error("Missing one or more paramas: action, chain");
  }
  if (!SUPPORTED_ACTION.includes(params.action.toLowerCase())) {
    throw new Error(
      `Action not supported. Supported actions: ${SUPPORTED_ACTION.join(", ")}`
    );
  }
  if (
    params.action === "transfer" &&
    !TRANSFER_CHAINS.includes(params.chain.toLowerCase())
  ) {
    throw new Error(
      `Chain not supported. Supported transfer chains: ${TRANSFER_CHAINS.join(
        ", "
      )}`
    );
  }
  if (
    params.action === "swap" &&
    !SWAP_CHAINS.includes(params.chain.toLowerCase())
  ) {
    throw new Error(
      `Chain not supported. Supported swap chains: ${SWAP_CHAINS.join(", ")}`
    );
  }
};

export async function handleReceive(context: HandlerContext) {
  const {
    content: { params },
  } = context.message;

  try {
    validateReceiveParams(params);
    const { action, chain } = params;
    if (action.toLowerCase() === "transfer") {
      const isBaseSepolia = params.chain.toLowerCase() === "basesepolia";
      const client = getBasePublicClient(isBaseSepolia);
      const account = await getAccount(config.account_type, client);
      await context.send(
        `Send your money to the account ${account.address} on ${chain}`
      );
    } else {
      await context.send(
        `Send your money to the account ${getBotAccount().address} on ${chain}`
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
      await context.send(error.message);
    } else {
      console.log(error);
      await context.send("An error has occurred");
    }
  }
}

const validateSwapParameters = async (
  chain: string,
  token1: string,
  token2: string,
  amount: string
) => {
  const SUPPORTED_CHAINS = ["sepolia", "base sepolia", "unichain sepolia"];
  if (!SUPPORTED_CHAINS.includes(chain.toLowerCase())) {
    throw new Error(
      `Chain not supported. Supported chains are ${SUPPORTED_CHAINS.join(
        ", "
      )}.`
    );
  }
  if (token1.toLowerCase() !== "weth") {
    throw new Error("Token 1 not supported. Supported token WETH.");
  }
  if (token2.toLowerCase() !== "usdc") {
    throw new Error("Token 2 not supported. Supported token USDC.");
  }

  const client = getSepoliaPublicClient();
  const account = getBotAccount();
  const balance = formatUnits(
    await client.readContract({
      abi: erc20Abi,
      address: SEPOLIA_WETH_CONTRACT_ADDRESS,
      functionName: "balanceOf",
      args: [account.address],
    }),
    18
  );

  if (BigNumber(amount).gte(BigNumber(balance))) {
    throw new Error(
      `Insufficient funds. The current balance of ${account.address} is ${balance} ${token1}`
    );
  }
};

export async function handleSwap(context: HandlerContext) {
  const {
    content: { params },
  } = context.message;

  if (!params || !params.prompt) {
    await context.send("Please provide a valid prompt.");
    return;
  }

  const prompt: string = params.prompt;

  try {
    const { action, chain, token1, token2, address, amount } =
      await extractSwapParameters(prompt);
    await validateSwapParameters(chain, token1, token2, amount);
    const viemChain = getViemChain(chain);
    const result = await swapEthToUsdc(parseFloat(amount!), viemChain);
    if (result?.txHash) {
      await context.send(
        `The swap transaction ${
          result!.txHash
        } has been executed. View on Block Explorer: ${
          viemChain.blockExplorers.default.url
        }/tx/${result!.txHash}`
      );

      if (address && address.trim() !== "") {
        const log = await sendUsdc(address, viemChain, result);
        await context.send(log);
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
      await context.send(error.message);
    } else {
      console.log(error);
      await context.send("An error has occurred");
    }
  }
}

const sendUsdc = async (
  address: string,
  viemChain: Chain,
  result:
    | { txHash: string; amountTokenOut: string; tokenOut: string }
    | undefined
): Promise<string> => {
  const computedAddress = computeAddress(address);
  const userInfo = await getUserInfo(computedAddress);
  const resolvedAddress = userInfo?.address;

  let sendTxHash: `0x${string}`;
  if (viemChain.id === sepolia.id) {
    const client = getSepoliaWalletClient();
    sendTxHash = await client.sendTransaction({
      to: CONSTANTS.sepolia.USDC_CONTRACT_ADDRESS as `0x${string}`,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [
          resolvedAddress as `0x${string}`,
          parseUnits(result!.amountTokenOut, 6),
        ],
      }),
      value: 0n,
    });
  } else if (viemChain.id === baseSepolia.id) {
    const client = getBaseSepoliaWalletClient();
    sendTxHash = await client.sendTransaction({
      to: CONSTANTS.baseSepolia.USDC_CONTRACT_ADDRESS as `0x${string}`,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [
          resolvedAddress as `0x${string}`,
          parseUnits(result!.amountTokenOut, 6),
        ],
      }),
      value: 0n,
    });
  } else {
    const client = getUnichainSepoliaWalletClient();
    sendTxHash = await client.sendTransaction({
      to: CONSTANTS.unichainSepolia.USDC_CONTRACT_ADDRESS as `0x${string}`,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [
          resolvedAddress as `0x${string}`,
          parseUnits(result!.amountTokenOut, 6),
        ],
      }),
      value: 0n,
    });
  }

  const log = `Sent ${result!.amountTokenOut} ${
    result!.tokenOut
  } to ${resolvedAddress}. View on Block Explorer: ${
    viemChain.blockExplorers.default.url
  }/tx/${sendTxHash}`;
  console.log(log);
  return log;
};

export async function handleWrap(context: HandlerContext) {
  const VALID_CHAINS = ["sepolia", "basesepolia", "unichainsepolia"];
  const {
    content: { params },
  } = context.message;

  if (!params || !params.amount || params.amount === "") {
    await context.send(`Provide a valid amount of ETH to Wrap`);
    return;
  }

  if (!params.chain || !VALID_CHAINS.includes(params.chain.toLowerCase())) {
    await context.send(
      `Chain invalid. Supported values are ${VALID_CHAINS.join(", ")}`
    );
    return;
  }
  const chain = params.chain;

  try {
    const viemChain = getViemChain(chain);
    const tx = await wrapEth(parseFloat(params.amount), viemChain);
    await context.send(
      `The transaction ${tx} has been executed. View on Block Explorer: ${viemChain.blockExplorers.default.url}/tx/${tx}`
    );
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
      await context.send(error.message);
    } else {
      console.log(error);
      await context.send("An error has occurred");
    }
  }
}
