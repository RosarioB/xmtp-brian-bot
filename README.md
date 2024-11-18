# xmtp_brian_bot

This project is generated using the [MessageKit](https://message-kit.vercel.app) v1.0.11 CLI. Below are the instructions to set up and run the project.

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

## Variables

Set up these variables in your app

```sh
KEY= # 0x... the private key of the bot wallet (with the 0x prefix)
BRIAN_API_KEY= # Brian API KEY
CDP_API_KEY= # coinbase developer platfor api key
```

# Docker
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