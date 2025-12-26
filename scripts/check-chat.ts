import prisma from "../src/lib/prisma";

async function main() {
  const conversations = await prisma.conversation.findMany({
    include: {
      messages: true,
      participants: {
        include: { user: true }
      }
    }
  });

  console.log("Conversations:", JSON.stringify(conversations, null, 2));

  const messages = await prisma.message.findMany();
  console.log("\nAll Messages:", JSON.stringify(messages, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
