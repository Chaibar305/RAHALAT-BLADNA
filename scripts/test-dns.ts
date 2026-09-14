import dns from "dns";
import { promisify } from "util";

const resolve4 = promisify(dns.resolve4);

async function testDns() {
  console.log("Current DNS servers:", dns.getServers());

  try {
    const ipsDefault = await resolve4("aws-0-eu-central-1.pooler.supabase.com");
    console.log("Default DNS resolved:", ipsDefault);
  } catch (e: any) {
    console.error("Default DNS failed:", e.code, e.message);
  }

  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
    console.log("Set DNS to 8.8.8.8, 1.1.1.1");
    const ipsGoogle = await resolve4("aws-0-eu-central-1.pooler.supabase.com");
    console.log("Google DNS resolved:", ipsGoogle);
  } catch (e: any) {
    console.error("Google DNS failed:", e.code, e.message);
  }
}

testDns();
