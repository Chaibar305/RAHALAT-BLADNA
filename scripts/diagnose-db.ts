import { PrismaClient } from "@prisma/client";
import net from "net";

function checkTcp(host: string, port: number, timeout = 5000) {
  return new Promise<{ host: string; port: number; status: string; error?: string }>((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);

    socket.on("connect", () => {
      socket.destroy();
      resolve({ host, port, status: "OPEN" });
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve({ host, port, status: "TIMEOUT" });
    });

    socket.on("error", (err) => {
      socket.destroy();
      resolve({ host, port, status: "ERROR", error: err.message });
    });

    socket.connect(port, host);
  });
}

async function run() {
  console.log("Checking TCP ports...");
  const p6543 = await checkTcp("aws-0-eu-central-1.pooler.supabase.com", 6543);
  console.log("6543 (Transaction Pooler):", p6543);

  const p5432 = await checkTcp("aws-0-eu-central-1.pooler.supabase.com", 5432);
  console.log("5432 (Session Pooler):", p5432);

  const directDb = await checkTcp("db.uzyghpewthhkpkoqjpfc.supabase.co", 5432);
  console.log("Direct DB 5432:", directDb);
}

run();
