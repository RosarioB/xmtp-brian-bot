import { run, HandlerContext } from "@xmtp/message-kit";

run(async (context: HandlerContext) => {
  const { message } = context;
  if (!message.content.text?.startsWith("/")) {
    await context.executeSkill("/help");
  }
});
