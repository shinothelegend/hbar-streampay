import { Address } from "viem";
import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

const erc20ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
] as const;

export function useERC20Balance(tokenAddress: Address, ownerAddress: Address | undefined) {
  return useReadContract({
    address: tokenAddress,
    abi: erc20ABI,
    functionName: "balanceOf",
    args: ownerAddress ? [ownerAddress] : undefined,
    query: {
      enabled: !!ownerAddress && !!tokenAddress,
    },
  });
}

export function useERC20Allowance(
  tokenAddress: Address,
  ownerAddress: Address | undefined,
  spenderAddress: Address | undefined,
) {
  return useReadContract({
    address: tokenAddress,
    abi: erc20ABI,
    functionName: "allowance",
    args: ownerAddress && spenderAddress ? [ownerAddress, spenderAddress] : undefined,
    query: {
      enabled: !!ownerAddress && !!spenderAddress && !!tokenAddress,
    },
  });
}

export function useERC20Write() {
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = async (tokenAddress: Address, spender: Address, amount: bigint) => {
    return writeContractAsync({
      address: tokenAddress,
      abi: erc20ABI,
      functionName: "approve",
      args: [spender, amount],
    });
  };

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}
