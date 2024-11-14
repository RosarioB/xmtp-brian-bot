
import { toSimpleSmartAccount, toSafeSmartAccount, toEcdsaKernelSmartAccount } from "permissionless/accounts"
import { privateKeyToAccount } from "viem/accounts"
import { Client } from 'viem'
import config from '../config.js';

const owner = privateKeyToAccount(config.private_key) ;

export const getAccount = async (type: string, client: Client) => {
    switch (type) {
        case "simple":
            // EOA signer (private key) and Simple Account
            const simpleAccount = await toSimpleSmartAccount({
                owner,
                client,
                factoryAddress: "0x9406Cc6185a346906296840746125a0E44976454",
                entryPoint: {
                    address: config.entry_point,
                    version: config.entry_point_version,
                },
            })
            return simpleAccount
        case "safe":
            // EOA signer (private key) and Safe
            const safeAccount = await toSafeSmartAccount({
                owners: [owner],
                client,
                entryPoint: {
                    address: config.entry_point,
                    version: config.entry_point_version
                },
                version: "1.4.1",
            })
            return safeAccount
        case "kernel":
             // EOA signer (private key) and Kernel
            const kernelAccount = await toEcdsaKernelSmartAccount({
                owners: [owner],
                client,
                entryPoint: {
                    address: config.entry_point,
                    version: config.entry_point_version
                },
            })
            return kernelAccount
        default:
            throw new Error("Invalid account type in config.json")
    }
}