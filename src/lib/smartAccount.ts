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
  try {
    console.log(`Smart account ${account.address} (Account type: ${config.account_type})`);
    console.log("Waiting for transaction...");
    
    const txHash = await smartAccountClient.sendTransaction({
      to: receiver,
      value: parseEther(amount),
    });
    
    console.log(`Transaction succeded: view on Etherscan: https://sepolia.basescan.org/tx/${txHash}`);
    console.log(
      `Smart account Balance ${formatEther(
        await client.getBalance({ address: account.address }),
        "wei"
      )} wei`
    );
    return txHash;
  } catch (error) {
    console.error("An error occurred while sending the transaction:", error);
    throw error;
  }
};