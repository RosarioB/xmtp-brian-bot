import { HandlerContext } from "@xmtp/message-kit";

export async function handleHelp(context: HandlerContext) {
  console.log("Inside heandleHelp");
  await context.reply(
    "Hello I am the Brain AI Agent Bot. How can I help you today?"
  );
}
