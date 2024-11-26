import { baseSepolia, base, sepolia, unichainSepolia } from "viem/chains";
import config from "./config.js";
import { CDB_URL } from "./constants.js";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export interface Chain {
  id: number;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorers: {
    default: {
      name: string;
      url: string;
      apiUrl: string;
    };
  };
}

export const computeAddress = (address: string) => {
  if (address.startsWith("0x") || address.endsWith(".eth")) {
    return address;
  }
  return address + ".eth";
};

export const getChain = (chain: string) => {
  if (chain.toLowerCase() === "base sepolia" || chain === "basesepolia") {
    return baseSepolia;
  }
  return base;
};

export const getBaseRpcUrl = (isBaseSepolia: boolean) => {
  return isBaseSepolia
    ? CDB_URL + "base-sepolia/" + config.cdp_api_key
    : CDB_URL + "base/" + config.cdp_api_key;
};

export const getBasePublicClient = (isBaseSepolia: boolean) => {
  const chain = isBaseSepolia ? baseSepolia : base;
  return createPublicClient({
    chain,
    transport: http(getBaseRpcUrl(isBaseSepolia)),
  });
};

export const getBaseSepoliaWalletClient = () => {
  return createWalletClient({
    account: privateKeyToAccount(config.private_key),
    chain: baseSepolia,
    transport: http(getBaseRpcUrl(true)),
  });
};

export const getSepoliaPublicClient = () => {
  return createPublicClient({
    chain: sepolia,
    transport: http(config.sepolia_url),
  });
};

export const getSepoliaWalletClient = () => {
  return createWalletClient({
    account: privateKeyToAccount(config.private_key),
    chain: sepolia,
    transport: http(config.sepolia_url),
  });
};

export const getUnichainSepoliaPublicClient = () => {
  return createPublicClient({
    chain: unichainSepolia,
    transport: http(config.unichain_sepolia_url),
  });
};

export const getUnichainSepoliaWalletClient = () => {
  return createWalletClient({
    account: privateKeyToAccount(config.private_key),
    chain: unichainSepolia,
    transport: http(config.unichain_sepolia_url),
  });
};

export const getBotAccount = () => {
  return privateKeyToAccount(config.private_key);
};

export const getViemChain = (chain: string) => {
  let viemChain;
  switch (chain.toLowerCase()) {
    case "sepolia":
      viemChain = sepolia;
      break;
    case "unichain sepolia":
    case "unichainsepolia":
      viemChain = unichainSepolia;
      break;
    case "base sepolia":
    case "basesepolia":
      viemChain = baseSepolia;
      break;
    case "base":
      viemChain = base;
      break;
    default:
      throw new Error(`Chain ${chain} not supported`);
  }
  return viemChain as Chain;
};

export const getRpcUrl = (chainId: number): string => {
  let rpcUrl: string;

  switch (chainId) {
    case 11155111:
      // sepolia
      rpcUrl = config.sepolia_url;
      break;
    case 1301:
      // unichain sepolia
      rpcUrl = config.unichain_sepolia_url;
      break;
    case 84532:
      // base sepolia
      rpcUrl = getBaseRpcUrl(true);
      break;
    default:
      throw new Error(`The chain id ${chainId} is not suported.`);
  }

  return rpcUrl;
};
