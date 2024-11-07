//import { handleEns } from "./handler/ens.js";
import type { SkillGroup } from "@xmtp/message-kit";
import { handleHelp, handleAsk } from "./handler/general.js";

export const skills: SkillGroup[] = [
  {
    name: "General Commands",
    description: "Command for managing default behaviours.",
    skills: [
      {
        command: "/help",
        triggers: ["/help"],
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
        command: "/ask [query]",
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
];
