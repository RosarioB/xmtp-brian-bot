import type { SkillGroup } from "@xmtp/message-kit";
import {
  handleHelp,
  handleAsk,
  handleTransfer,
  handleReceive,
  handleSwap,
  handleWrap,
} from "./handler/base.js";

export const skills: SkillGroup[] = [
  {
    name: "General Commands",
    description: "Command for managing default behaviours.",
    skills: [
      {
        skill: "/help",
        triggers: ["/help"],
        examples: ["/help"],
        handler: handleHelp,
        description: "Get help with the app.",
        params: {},
      },
    ],
  },
  {
    name: "Ask Brian",
    description: "Ask Brian questions about web3.",
    skills: [
      {
        skill: "/ask [query]",
        triggers: ["/ask"],
        examples: ["/ask What is the blockchain?"],
        description: "Ask Brian questions about web3.",
        handler: handleAsk,
        params: {
          query: {
            type: "prompt",
          },
        },
      },
    ],
  },
  {
    name: "Transfer money to an Ethereum address or ENS",
    description: "Transfer money to an Ethereum address or ENS",
    skills: [
      {
        skill: "/transfer [prompt]",
        triggers: ["/transfer"],
        examples: [
          "/transfer Transfer 0.000002 ETH to 0x20c6F9006d563240031A1388f4f25726029a6368 on Base Sepolia",
        ],
        description: "Transfer money to an Ethereum address or ENS.",
        handler: handleTransfer,
        params: {
          prompt: {
            type: "prompt",
          },
        },
      },
    ],
  },
  {
    name: "Receive funds from the user",
    description: "Informs the user of the wallets to which they should send the funds.",
    skills: [
      {
        skill: "/receive [action] [chain]",
        triggers: ["/receive"],
        examples: ["/receive transfer Base Sepolia", "/receive swap Sepolia"],
        description: "Informs the user of the wallets to which they should send the funds.",
        handler: handleReceive,
        params: {
          action: {
            type: "string",
          },
          chain: {
            type: "string",
          },
        },
      },
    ],
  },
  {
    name: "Swap tokens",
    description: "Swap tokens",
    skills: [
      {
        skill: "/swap [prompt]",
        triggers: ["/swap"],
        examples: ["/swap Swap 0.000001 WETH to USDC on Sepolia"],
        description: "Swap tokens",
        handler: handleSwap,
        params: {
          prompt: {
            type: "prompt",
          },
        },
      },
    ],
  },
  {
    name: "Wrap eth",
    description: "Wrap ETH into WETH",
    skills: [
      {
        skill: "/wrap [amount] [chain]",
        triggers: ["/wrap"],
        examples: ["/wrap 0.0001 Sepolia"],
        description: "Wrap ETH",
        handler: handleWrap,
        params: {
          amount: {
            type: "string",
          },
          chain: {
            type: "string",
          },
        },
      },
    ],
  },
];
