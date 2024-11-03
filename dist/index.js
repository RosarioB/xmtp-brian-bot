import { run } from "@xmtp/message-kit";
run(async (context) => {
    // Get the message and the address from the sender
    const { content, sender } = context.message;
    // To reply, just call `reply` on the HandlerContext.
    await context.send(`gm`);
});
//# sourceMappingURL=index.js.map