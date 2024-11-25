import { ethers } from 'ethers'
import FACTORY_ABI from './abis/factory.json' with { type: 'json' };
import QUOTER_ABI from './abis/quoter.json' with { type: 'json' };
import SWAP_ROUTER_ABI from './abis/swaprouter.json' with { type: 'json' };
import POOL_ABI from './abis/pool.json' with { type: 'json' };
import TOKEN_IN_ABI from './abis/weth.json' with { type: 'json' };
import config from '../../config.js';
import { sepolia } from 'viem/chains';
import { SEPOLIA_USDC_CONTRACT_ADDRESS, SEPOLIA_WETH_CONTRACT_ADDRESS } from '../../constants.js';

// Deployment Addresses Sepolia
const POOL_FACTORY_CONTRACT_ADDRESS = '0x0227628f3F023bb0B980b67D528571c95c6DaC1c'
const QUOTER_CONTRACT_ADDRESS = '0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3'
const SWAP_ROUTER_CONTRACT_ADDRESS = '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E'
const CHAIN_ID = 11155111

// Provider, Contract & Signer Instances
const provider = new ethers.JsonRpcProvider(config.sepolia_url);
const factoryContract = new ethers.Contract(POOL_FACTORY_CONTRACT_ADDRESS, FACTORY_ABI, provider);
const quoterContract = new ethers.Contract(QUOTER_CONTRACT_ADDRESS, QUOTER_ABI, provider)
export const signer = new ethers.Wallet(config.private_key, provider)

// Token Configuration
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

const WETH: Token = {
    chainId: CHAIN_ID,
    address: SEPOLIA_WETH_CONTRACT_ADDRESS,
    decimals: 18,
    symbol: 'WETH',
    name: 'Wrapped Ether',
    isToken: true,
    isNative: true,
    wrapped: true
  }
  
const USDC: Token = {
    chainId: CHAIN_ID,
    address: SEPOLIA_USDC_CONTRACT_ADDRESS,
    decimals: 6,
    symbol: 'USDC',
    name: 'USD//C',
    isToken: true,
    isNative: true,
    wrapped: false
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

async function approveToken(tokenAddress: string, tokenABI: ethers.Interface | ethers.InterfaceAbi, amount: bigint, wallet: ethers.ContractRunner) {
    try {
        const tokenContract = new ethers.Contract(tokenAddress, tokenABI, wallet);

        const approveTransaction = await tokenContract.approve.populateTransaction(
            SWAP_ROUTER_CONTRACT_ADDRESS,
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
        tokenIn: WETH.address,
        tokenOut: USDC.address,
        fee: fee,
        recipient: signer.address,
        deadline: Math.floor(new Date().getTime() / 1000 + 60 * 10),
        amountIn: amountIn,
        sqrtPriceLimitX96: 0,
    });
    if(quotedAmountOut[0] === BigInt(0)) {
        throw new Error("Quoted amount is zero");
    }
    const amountOut = ethers.formatUnits(quotedAmountOut[0], USDC.decimals)
    console.log(`Token Swap will result in: ${amountOut} ${USDC.symbol} for ${ethers.formatEther(amountIn)} ${WETH.symbol}`);
    return amountOut;
}

async function prepareSwapParams(poolContract: ethers.Contract, signer: ethers.Wallet, amountIn: bigint, amountOut: bigint): Promise<SwapParams> {
    return {
        tokenIn: WETH.address,
        tokenOut: USDC.address,
        fee: await poolContract.fee(),
        recipient: signer.address,
        amountIn: amountIn,
        amountOutMinimum: amountOut,
        sqrtPriceLimitX96: 0,
    };
}

async function executeSwap(swapRouter: ethers.Contract, params: SwapParams, signer: ethers.Wallet) {
    const transaction = await swapRouter.exactInputSingle.populateTransaction(params);
    const receipt = await signer.sendTransaction(transaction);
    console.log(`The transaction ${receipt.hash} has been executed. View on Block Explorer: ${sepolia.blockExplorers.default.url}/tx/${receipt.hash}`);
    return receipt.hash;
}

// Swap WETH to USDC
export async function swap(swapAmount: number) { 
    const inputAmount = swapAmount
    const amountIn = ethers.parseUnits(inputAmount.toString(), 18);

    try {
        await approveToken(WETH.address, TOKEN_IN_ABI, amountIn, signer)
        const { poolContract, token0, token1, fee, liquidity } = await getPoolInfo(factoryContract, WETH, USDC);
        const quotedAmountOut = await quoteAndLogSwap(quoterContract, fee, signer, amountIn);
        const params = await prepareSwapParams(poolContract, signer, amountIn, BigInt(quotedAmountOut[0]));
        const swapRouter = new ethers.Contract(SWAP_ROUTER_CONTRACT_ADDRESS, SWAP_ROUTER_ABI, signer);
        const txHash = await executeSwap(swapRouter, params, signer);
        return {txHash, amountTokenOut: quotedAmountOut, tokenOut: USDC.symbol}
    } catch (error) {
        if(error instanceof Error) {
        console.error("An error occurred:", error.message);
        }
    }
}

// wraps ETH (rounding up to the nearest ETH for decimal places)
export async function wrapETH(eth: number) {
    const address = await signer.getAddress();
    if (!provider || !address) {
      throw new Error("Cannot wrap ETH without a provider and wallet address");
    }
  
    const wethContract = new ethers.Contract(
      SEPOLIA_WETH_CONTRACT_ADDRESS,
      TOKEN_IN_ABI,
      provider
    );
  
    const transaction = {
      data: wethContract.interface.encodeFunctionData("deposit"),
      value: ethers.parseEther(eth.toString()),
      from: address,
      to: SEPOLIA_WETH_CONTRACT_ADDRESS,
    };
  
    const txRes = await signer.sendTransaction(transaction);
    const receipt = await txRes.wait();
    if (receipt) {
        console.log(
            `Transaction succeded. View on Block Explorer: ${sepolia.blockExplorers.default.url}/tx/${receipt.hash}`
          );
    } else {
        console.error("Transaction receipt is null");
    }
    return receipt?.hash;
}