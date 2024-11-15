import config from "../config.js";
import { BrianSDK, BrianSDKOptions } from "@brian-ai/sdk";

const options: BrianSDKOptions = {
  apiKey: config.brian_api_key,
};

export const brian = new BrianSDK(options);

export type CompletionItem = {
  action: string;
  token1: string;
  chain: string;
  address: string;
  amount: string;
};

function isValidCompletionItem(item: any): item is CompletionItem {
  return (
    item &&
    typeof item.action === "string" &&
    item.action.trim() !== "" &&
    typeof item.token1 === "string" &&
    item.token1.trim() !== "" &&
    typeof item.chain === "string" &&
    item.chain.trim() !== "" &&
    typeof item.address === "string" &&
    item.address.trim() !== "" &&
    typeof item.amount === "string" &&
    item.amount.trim() !== ""
  );
}

function validateCompletionArray(
  completion: any[]
): completion is CompletionItem[] {
  return Array.isArray(completion) && completion.every(isValidCompletionItem);
}

export const extractParameters = async (prompt: string) => {
  const result = await brian.extract({
    prompt,
  });

  if (!result || !result.completion) {
    throw new Error("I was unable to process your request");
  }

  if (!validateCompletionArray(result.completion)) {
    throw new Error(
      "Your prompt is missing one or more fields among: action, token1, chain, address, amount"
    );
  }
  const [completion] = result.completion;
  return completion;
};
