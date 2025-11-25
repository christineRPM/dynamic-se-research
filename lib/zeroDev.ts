import { isEthereumWallet } from '@dynamic-labs/ethereum';
import { erc20Abi } from 'viem';

// For now, we'll implement regular USDC transfers
// Account Abstraction can be added later when we have the exact Dynamic API

export const sendUSDCTransaction = async (
  walletClient: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  publicClient: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  recipientAddress: string,
  amount: bigint,
  usdcContractAddress: string
) => {
  try {
    console.log('Sending USDC transaction...', {
      recipient: recipientAddress,
      amount: amount.toString(),
      contract: usdcContractAddress
    });

    // Send the transaction using writeContract
    const hash = await walletClient.writeContract({
      address: usdcContractAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [recipientAddress as `0x${string}`, amount],
    });

    console.log('✅ Transaction sent:', hash);
    console.log('⏳ Waiting for transaction confirmation...');

    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash,
      timeout: 60_000 // 60 second timeout
    });

    if (receipt.status === 'success') {
      console.log('🎉 USDC transfer completed:', receipt);
      return {
        transactionHash: hash,
        receipt
      };
    } else {
      throw new Error('Transaction failed');
    }
  } catch (error) {
    console.error('❌ Failed to send USDC transaction:', error);
    throw error;
  }
};

export const checkAccountAbstractionSupport = async (primaryWallet: any): Promise<boolean> => { // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    if (!primaryWallet || !isEthereumWallet(primaryWallet)) {
      return false;
    }

    // Check if this is a Dynamic embedded wallet or smart wallet
    const connectorName = primaryWallet.connector?.name?.toLowerCase() || '';
    const walletKey = primaryWallet.key?.toLowerCase() || '';
    
    console.log('🔍 Checking wallet for AA support:', {
      connectorName,
      walletKey,
      connector: primaryWallet.connector,
      isEmbedded: connectorName.includes('dynamic') || connectorName.includes('embedded')
    });

    // Dynamic embedded wallets support account abstraction
    if (connectorName.includes('dynamic') || 
        connectorName.includes('embedded') || 
        connectorName.includes('zerodev') ||
        walletKey.includes('dynamic')) {
      return true;
    }

    // Check if the wallet has smart wallet capabilities
    if (typeof (primaryWallet as any).getSmartAccount === 'function') { // eslint-disable-line @typescript-eslint/no-explicit-any
      return true;
    }

    // For other wallets, they can be wrapped with smart wallet functionality
    return false;
  } catch (error) {
    console.warn('Account abstraction check failed:', error);
    return false;
  }
};

// Check if wallet is an embedded wallet
export const isEmbeddedWallet = (primaryWallet: any): boolean => { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!primaryWallet) return false;
  
  const connectorName = primaryWallet.connector?.name?.toLowerCase() || '';
  const walletKey = primaryWallet.key?.toLowerCase() || '';
  
  return connectorName.includes('dynamic') || 
         connectorName.includes('embedded') || 
         walletKey.includes('dynamic') ||
         walletKey.includes('embedded');
};

// Get wallet type for display
export const getWalletType = (primaryWallet: any): string => { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!primaryWallet) return 'No wallet';
  
  const connectorName = primaryWallet.connector?.name || '';
  const walletKey = primaryWallet.key || '';
  
  if (isEmbeddedWallet(primaryWallet)) {
    return 'Dynamic Embedded Wallet';
  }
  
  if (connectorName.includes('ZeroDev') || connectorName.includes('Smart')) {
    return 'Smart Wallet';
  }
  
  return connectorName || walletKey || 'Connected Wallet';
};

// Placeholder for future Account Abstraction implementation
export const createSponsoredKernelClient = async () => {
  // TODO: Implement when we have the correct Dynamic AA API
  throw new Error('Account Abstraction not implemented yet - using regular transactions');
};

export const sendSponsoredUSDCTransaction = async () => {
  // TODO: Implement when we have the correct Dynamic AA API
  throw new Error('Sponsored transactions not implemented yet - using regular transactions');
}; 