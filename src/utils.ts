import { base, baseSepolia, sepolia } from "viem/chains";
import config from "./config.js";
import { CDB_URL } from "./constants.js";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

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

export const getRpcUrl = (isBaseSepolia: boolean) => {
  return isBaseSepolia
    ? CDB_URL + "base-sepolia/" + config.cdp_api_key
    : CDB_URL + "base/" + config.cdp_api_key;
};

export const getPublicClient = (isBaseSepolia: boolean) => {
  const chain = isBaseSepolia ? baseSepolia : base;
  return createPublicClient({
    chain,
    transport: http(getRpcUrl(isBaseSepolia)),
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

export const getBotAccount = () => {
  return privateKeyToAccount(config.private_key);
};
