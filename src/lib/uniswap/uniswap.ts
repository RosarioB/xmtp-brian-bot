import { ethers } from 'ethers'
import FACTORY_ABI from './abis/factory.json' with { type: 'json' };
import QUOTER_ABI from './abis/quoter.json' with { type: 'json' };
import SWAP_ROUTER_ABI from './abis/swaprouter.json' with { type: 'json' };
import POOL_ABI from './abis/pool.json' with { type: 'json' };
import TOKEN_IN_ABI from './abis/weth.json' with { type: 'json' };
import config from '../../config.js';
import { Chain, getRpcUrl } from '../../utils.js';

interface Token {
    chainId: number,
    address: string,
    decimals: number,
    symbol: string,
    name: string,
    isToken: boolean,
    isNative: boolean,
    wrapped: boolean
}

interface SwapParams {
    tokenIn: string;
    tokenOut: string;
    fee: bigint;
    recipient: string;
    amountIn: bigint;
    amountOutMinimum: bigint;
    sqrtPriceLimitX96: number;
}

let poolFactoryContractAddress: string;
let quoterContractAddress: string;
let swapRouterContractAddress: string;
let wethContractAddress: string;
let usdcContractAddress: string;

let provider: ethers.JsonRpcProvider;
let factoryContract: ethers.Contract;
let quoterContract: ethers.Contract;
let signer: ethers.Wallet;
let weth: Token;
let usdc: Token;

export const CONSTANTS = {
    sepolia: {
        POOL_FACTORY_CONTRACT_ADDRESS: '0x0227628f3F023bb0B980b67D528571c95c6DaC1c',
        QUOTER_CONTRACT_ADDRESS: '0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3',
        SWAP_ROUTER_CONTRACT_ADDRESS: '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E',
        WETH_CONTRACT_ADDRESS: '0xfff9976782d46cc05630d1f6ebab18b2324d6b14',
        USDC_CONTRACT_ADDRESS: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
        CHAIN_ID: 11155111,
    },
    unichainSepolia: {
        POOL_FACTORY_CONTRACT_ADDRESS: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
        QUOTER_CONTRACT_ADDRESS: '0x6Dd37329A1A225a6Fca658265D460423DCafBF89',
        SWAP_ROUTER_CONTRACT_ADDRESS: '0xd1AAE39293221B77B0C71fBD6dCb7Ea29Bb5B166',
        WETH_CONTRACT_ADDRESS: '0x4200000000000000000000000000000000000006',
        USDC_CONTRACT_ADDRESS: '0x31d0220469e10c4E71834a79b1f276d740d3768F',
        CHAIN_ID: 1301,
    },
    baseSepolia: {
        POOL_FACTORY_CONTRACT_ADDRESS: "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24",
        QUOTER_CONTRACT_ADDRESS: "0xC5290058841028F1614F3A6F0F5816cAd0df5E27",
        SWAP_ROUTER_CONTRACT_ADDRESS: "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4",
        WETH_CONTRACT_ADDRESS: '0x4200000000000000000000000000000000000006',
        USDC_CONTRACT_ADDRESS: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
        CHAIN_ID: 84532,
    }
}

const init = (chainId: number) => {
    const addresses = Object.values(CONSTANTS).find(config => config.CHAIN_ID === chainId);
    poolFactoryContractAddress = addresses!.POOL_FACTORY_CONTRACT_ADDRESS;
    quoterContractAddress = addresses!.QUOTER_CONTRACT_ADDRESS;
    swapRouterContractAddress = addresses!.SWAP_ROUTER_CONTRACT_ADDRESS;
    wethContractAddress = addresses!.WETH_CONTRACT_ADDRESS;
    usdcContractAddress = addresses!.USDC_CONTRACT_ADDRESS;
    
    const rpcUrl = getRpcUrl(chainId);
    provider = new ethers.JsonRpcProvider(rpcUrl);
    factoryContract = new ethers.Contract(poolFactoryContractAddress, FACTORY_ABI, provider);
    quoterContract = new ethers.Contract(quoterContractAddress, QUOTER_ABI, provider);
    signer = new ethers.Wallet(config.private_key, provider);

    weth = {
        chainId: chainId,
        address: wethContractAddress,
        decimals: 18,
        symbol: 'WETH',
        name: 'Wrapped Ether',
        isToken: true,
        isNative: true,
        wrapped: true
      }

    usdc = {
        chainId: chainId,
        address: usdcContractAddress,
        decimals: 6,
        symbol: 'USDC',
        name: 'USD//C',
        isToken: true,
        isNative: true,
        wrapped: false
    }
}

async function approveToken(tokenAddress: string, tokenABI: ethers.Interface | ethers.InterfaceAbi, amount: bigint, wallet: ethers.ContractRunner) {
    try {
        const tokenContract = new ethers.Contract(tokenAddress, tokenABI, wallet);

        const approveTransaction = await tokenContract.approve.populateTransaction(
            swapRouterContractAddress,
            ethers.parseEther(amount.toString())
        );
        if (!wallet.sendTransaction) {
            throw new Error("sendTransaction method is undefined on wallet");
        }
        const transactionResponse = await wallet.sendTransaction(approveTransaction);
        const receipt = await transactionResponse.wait();
        if (receipt) {
            console.log(`Approval Transaction Confirmed! ${receipt.hash}`);
        } else {
            console.error("Transaction receipt is null");
        }
    } catch (error) {
        console.error("An error occurred during token approval:", error);
        throw new Error("Token approval failed");
    }
}

async function getPoolInfo(factoryContract: ethers.Contract, tokenIn: Token, tokenOut: Token) {
    
    const poolAddress: `0x${string}` = await factoryContract.getPool(tokenIn.address, tokenOut.address, 3000);
    if (!poolAddress || poolAddress === ethers.ZeroAddress) {
        throw new Error("Pool does not exist for the given token pair and fee");
      }
    if (!poolAddress) {
        throw new Error("Failed to get pool address");
    }
    const poolContract = new ethers.Contract(poolAddress, POOL_ABI, provider);

     const [token0, token1, fee, liquidity] = await Promise.all([
        poolContract.token0(),
        poolContract.token1(),
        poolContract.fee(),
        poolContract.liquidity()
    ]);
    return { poolContract, token0, token1, fee, liquidity };
}

async function quoteAndLogSwap(quoterContract: ethers.Contract, fee: bigint, signer: ethers.Wallet, amountIn: bigint) {
    const quotedAmountOut: bigint[] = await quoterContract.quoteExactInputSingle.staticCall({
        tokenIn: weth.address,
        tokenOut: usdc.address,
        fee: fee,
        recipient: signer.address,
        deadline: Math.floor(new Date().getTime() / 1000 + 60 * 10),
        amountIn: amountIn,
        sqrtPriceLimitX96: 0,
    });
    if(quotedAmountOut[0] === BigInt(0)) {
        throw new Error("Quoted amount is zero");
    }
    const amountOut = ethers.formatUnits(quotedAmountOut[0], usdc.decimals)
    console.log(`Token Swap will result in: ${amountOut} ${usdc.symbol} for ${ethers.formatEther(amountIn)} ${weth.symbol}`);
    return amountOut;
}

async function prepareSwapParams(poolContract: ethers.Contract, signer: ethers.Wallet, amountIn: bigint, amountOut: bigint): Promise<SwapParams> {
    return {
        tokenIn: weth.address,
        tokenOut: usdc.address,
        fee: await poolContract.fee(),
        recipient: signer.address,
        amountIn: amountIn,
        amountOutMinimum: amountOut,
        sqrtPriceLimitX96: 0,
    };
}

async function executeSwap(swapRouter: ethers.Contract, params: SwapParams, signer: ethers.Wallet, chain: Chain) {
    const transaction = await swapRouter.exactInputSingle.populateTransaction(params);
    const receipt = await signer.sendTransaction(transaction);
    console.log(`The transaction ${receipt.hash} has been executed. View on Block Explorer: ${chain.blockExplorers.default.url}/tx/${receipt.hash}`);
    return receipt.hash;
}

export async function swapEthToUsdc(swapAmount: number, chain: Chain) { 
    init(chain.id);
    const inputAmount = swapAmount
    const amountIn = ethers.parseUnits(inputAmount.toString(), 18);
    await approveToken(weth.address, TOKEN_IN_ABI, amountIn, signer)
    const { poolContract, token0, token1, fee, liquidity } = await getPoolInfo(factoryContract, weth, usdc);
    const quotedAmountOut = await quoteAndLogSwap(quoterContract, fee, signer, amountIn);
    const params = await prepareSwapParams(poolContract, signer, amountIn, BigInt(quotedAmountOut[0]));
    const swapRouter = new ethers.Contract(swapRouterContractAddress, SWAP_ROUTER_ABI, signer);
    const txHash = await executeSwap(swapRouter, params, signer, chain);
    return {txHash, amountTokenOut: quotedAmountOut, tokenOut: usdc.symbol}
}

export async function wrapEth(eth: number, chain: Chain) {
    init(chain.id);
    const address = await signer.getAddress();
    if (!provider || !address) {
      throw new Error("Cannot wrap ETH without a provider and wallet address");
    }
  
    const wethContract = new ethers.Contract(
      wethContractAddress,
      TOKEN_IN_ABI,
      provider
    );
  
    const transaction = {
      data: wethContract.interface.encodeFunctionData("deposit"),
      value: ethers.parseEther(eth.toString()),
      from: address,
      to: wethContractAddress,
    };
  
    const txRes = await signer.sendTransaction(transaction);
    const receipt = await txRes.wait();
    if (receipt) {
        console.log(
            `Transaction succeded. View on Block Explorer: ${chain.blockExplorers.default.url}/tx/${receipt.hash}`
          );
    } else {
        console.error("Transaction receipt is null");
    }
    return receipt?.hash;
}