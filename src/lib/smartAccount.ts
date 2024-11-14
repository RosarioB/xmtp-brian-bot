import { parseEther, http, formatEther } from "viem";
import { baseSepolia } from "viem/chains";
import { createSmartAccountClient } from "permissionless";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { getAccount, client } from "./account.js";
import config from "../config.js"

const rpcUrl = config.rpc_url;

const cloudPaymaster = createPimlicoClient({
  chain: baseSepolia,
  transport: http(rpcUrl),
});

const account = await getAccount(config.account_type);

const smartAccountClient = createSmartAccountClient({
  account,
  chain: baseSepolia,
  bundlerTransport: http(rpcUrl),
  paymaster: cloudPaymaster,
});

export const sendTransaction = async (
  receiver: `0x${string}`,
  amount: string
) => {
  
  console.log("Waiting for transaction...");
  
  const txHash = await smartAccountClient.sendTransaction({
    to: receiver,
    value: parseEther(amount),
  });
  console.log(`Sent ${parseEther(amount)} ETH from Smart account ${account.address} to ${receiver}`);
  console.log(`Transaction succeded. View on Etherscan: https://sepolia.basescan.org/tx/${txHash}`);
  console.log(
    `Smart account Balance ${formatEther(
      await client.getBalance({ address: account.address }),
      "wei"
    )} wei`
  );
  return txHash;
};