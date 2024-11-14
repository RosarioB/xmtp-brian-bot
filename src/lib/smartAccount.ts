import { parseEther, http, formatEther, createPublicClient } from "viem";
import { baseSepolia, base } from "viem/chains";
import { createSmartAccountClient } from "permissionless";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { getAccount } from "./account.js";
import config from "../config.js"
import { getRpcUrl } from "../utils.js";


export const sendTransaction = async (
  receiver: `0x${string}`,
  amount: string,
  chainId: number
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
  
  console.log("Waiting for transaction...");
  
  const txHash = await smartAccountClient.sendTransaction({
    to: receiver,
    value: parseEther(amount),
  });
  console.log(`Sent ${amount} ETH from Smart account ${account.address} to ${receiver}`);
  console.log(`Transaction succeded. View on Block Explorer: ${chain.blockExplorers.default.url}/tx/${txHash}`);
  console.log(
    `Smart account Balance ${formatEther(
      await client.getBalance({ address: account.address }),
      "wei"
    )} wei`
  );
  return txHash;
};