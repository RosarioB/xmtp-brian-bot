# xmtp_brian_bot
This is the source code of this [Youtube video](https://youtu.be/whBrV2liWVk). 

This project is generated using the [MessageKit](https://message-kit.vercel.app) v1.0.11 CLI. Below are the instructions to set up and run the project.

## Description
This bot enables users to send funds from the bot to another user, swap tokens from WETH to USDC, and transfer the swapped USDC to another address.

The **transfer** functionality is built using account abstraction with Pimlico and CDP, whose paymaster sponsors the gas fees for these transactions. To use this feature, users must first transfer funds to the bot's address. Once the bot has been funded, users can execute transfers using the `/transfer` command. Only ETH and USDC can be transferred, and transfers are supported exclusively on the Base Sepolia and Base networks.

The **swap** feature, implemented with Uniswap, allows users to exchange WETH for USDC within the bot's account using the `/swap` command. After the swap, the USDC can be sent to another address. This feature is supported on the Base Sepolia, Unichain Sepolia, and Sepolia networks. For a swap to occur, the bot's account must hold WETH. If there is no WETH available, users can wrap Ether into WETH using the `/wrap` command.

Since the address used for the transfer operation is different from the one used for the swap operation, you can use the `/receive` command to determine the correct address to send funds for either a transfer or a swap.

Additionally, users can ask Brian **general questions** by using the `/ask` command.

## Setup

Follow these steps to set up and run the project:

1. **Navigate to the project directory:**
    ```sh
    cd ./xmtp_brian_bot
    ```

2. **Install dependencies:**
    ```sh
    yarn install
    ```

3. **Run the project:**
    ```sh
    yarn dev
    ```
    OR
    ```sh
    yarn build && yarn start
    ``` 

## Environment Variables

Create a file `.env` in the root with these variables:

```sh
KEY= # 0x... the private key of the bot wallet (with the 0x prefix)
BRIAN_API_KEY= # Brian API KEY
CDP_API_KEY= # Coinbase Developer Platform API KEY
SEPOLIA_URL= # Sepolia RPC URL
UNICHAIN_SEPOLIA_URL= # Unichain Sepolia RPC URL
```

## Commands Examples
- `/help`: get the list of the commands
- `/ask What is the blockchain?`: ask generic questions

- `/receive transfer BaseSepolia`: get the address to transfer funds
- `/receive swap Sepolia`: get the address to swap funds

- `/transfer Transfer 0.000001 ETH to 0x20c6F9006d563240031A1388f4f25726029a6368 on Base Sepolia`
- `/transfer Transfer 0.000001 ETH to vitalik on Base Sepolia`
- `/transfer Transfer 0.01 USDC to 0x20c6F9006d563240031A1388f4f25726029a6368 on Base Sepolia`

- `/wrap 0.0001 Sepolia`: Wrap ETH to WETH on Sepolia
- `/wrap 0.0001 unichainsepolia`: Wrap ETH to WETH on Unichain Sepolia
- `/wrap 0.0001 basesepolia`: Wrap ETH to WETH on Base Sepolia

- `/swap Swap 0.000001 WETH to USDC on Sepolia`
- `/swap Swap 0.000001 WETH to USDC and send it to 0x20c6F9006d563240031A1388f4f25726029a6368 on Sepolia`
- `/swap Swap 0.000001 WETH to USDC and send it to vitalik on Sepolia`
- `/swap Swap 0.000001 WETH to USDC and send it to 0x20c6F9006d563240031A1388f4f25726029a6368 on Unichain Sepolia`
- `/swap Swap 0.000001 WETH to USDC and send it to vitalik on Unichain Sepolia`


## Docker
Build image:
```sh
docker build -t brian_bot . 
```

Run Docker container with volume:
```sh
docker run --rm --name brian_bot_container -p 3000:3000  brian_bot
```


---
Made with ❤️ by [Ephemera](https://ephemerahq.com)