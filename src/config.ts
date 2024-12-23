import dotenv from "dotenv";
dotenv.config();

export default {
  cdp_api_key: process.env.CDP_API_KEY as string,
  private_key: process.env.KEY as `0x${string}`,
  account_type: process.env.ACCOUNT_TYPE || "simple",
  entry_point: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789" as `0x${string}`,
  entry_point_version: "0.6" as "0.6" | "0.7",
  brian_api_key: process.env.BRIAN_API_KEY as string,
  sepolia_url: process.env.SEPOLIA_URL as string,
  unichain_sepolia_url: process.env.UNICHAIN_SEPOLIA_URL as string,
};
