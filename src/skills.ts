import type { SkillGroup } from "@xmtp/message-kit";
import {
  handleHelp,
  handleAsk,
  handleTransfer,
  handleReceive,
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
    name: "Receive money in the smart wallet from the user",
    description: "Receive money in the smart wallet from the user",
    skills: [
      {
        skill: "/receive [chain]",
        triggers: ["/receive"],
        examples: ["/receive Base Sepolia"],
        description: "Receive money in the smart wallet from the user",
        handler: handleReceive,
        params: {
          chain: {
            type: "string",
          },
        },
      },
    ],
  },
];
