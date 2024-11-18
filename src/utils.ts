import { base, baseSepolia } from "viem/chains";
import config from "./config.js";
import { CDB_URL } from "./constants.js";
import { createPublicClient, http } from "viem";

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
