import {
  parseEther,
  http,
  formatEther,
  createPublicClient,
  encodeFunctionData,
  erc20Abi,
} from "viem";
import { baseSepolia, base } from "viem/chains";
import { createSmartAccountClient } from "permissionless";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { getAccount } from "./account.js";
import config from "../config.js";
import { getRpcUrl } from "../utils.js";
import { BASE_SEPOLIA_USDC_ADDRESS, BASE_USDC_ADDRESS } from "../constants.js";

export const sendTransaction = async (
  receiver: `0x${string}`,
  amount: string,
  chainId: number,
  token: string
) => {
  const isBaseSepolia = chainId === 84532;
  const chain = isBaseSepolia ? baseSepolia : base;
  const rpcUrl = getRpcUrl(isBaseSepolia);

  const client = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  const cloudPaymaster = createPimlicoClient({
    chain,
    transport: http(rpcUrl),
  });

  const account = await getAccount(config.account_type, client);

  const smartAccountClient = createSmartAccountClient({
    account,
    chain,
    bundlerTransport: http(rpcUrl),
    paymaster: cloudPaymaster,
  });

  let txHash;
  if (token.toLowerCase() === "eth") {
    txHash = await smartAccountClient.sendTransaction({
      to: receiver,
      value: parseEther(amount),
    });
    console.log(
      `Transferred ${amount} ETH from Smart account ${account.address} to ${receiver}`
    );
  } else {
    txHash = await smartAccountClient.sendTransaction({
      to: isBaseSepolia ? BASE_SEPOLIA_USDC_ADDRESS : BASE_USDC_ADDRESS,
      value: 0n,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [receiver, BigInt(amount)],
      }),
    });
    console.log(
      `Transferred ${amount} USDC from Smart account ${account.address} to ${receiver}`
    );
  }

  console.log(
    `Transaction succeded. View on Block Explorer: ${chain.blockExplorers.default.url}/tx/${txHash}`
  );
  return txHash;
};
