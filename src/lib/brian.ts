import dotenv from "dotenv";
dotenv.config();

import { BrianSDK, BrianSDKOptions } from "@brian-ai/sdk";

const options: BrianSDKOptions = {
  apiKey: process.env.BRIAN_API_KEY || "",
};

export const brian = new BrianSDK(options);
