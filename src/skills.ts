//import { handleEns } from "./handler/ens.js";
import type { SkillGroup } from "@xmtp/message-kit";
import { handleHelp } from "./handler/general";

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
];
