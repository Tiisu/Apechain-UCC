import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, CONTRACT_ABI, NETWORK_CONFIG } from '../contracts/ConnectShareMVP';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [network, setNetwork] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Initialize Web3 connection
  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please connect your wallet.');
      }

      // Create provider and signer
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();
      const networkInfo = await web3Provider.getNetwork();

      // Check if we're on the correct network
      const supportedNetworks = [33111, 33139]; // Curtis and APE Chain
      if (!supportedNetworks.includes(Number(networkInfo.chainId))) {
        await switchToSupportedNetwork();
        return; // Will retry after network switch
      }

      // Get contract address for current network
      const networkName = networkInfo.chainId === 33111n ? 'curtis' : 'apechain';
      const contractAddress = CONTRACT_ADDRESSES[networkName];

      if (!contractAddress || contractAddress === 'YOUR_CURTIS_CONTRACT_ADDRESS') {
        throw new Error(`Contract not deployed on ${networkName}. Please deploy first.`);
      }

      // Create contract instance
      const contractInstance = new ethers.Contract(
        contractAddress,
        CONTRACT_ABI,
        web3Signer
      );

      // Update state
      setAccount(accounts[0]);
      setProvider(web3Provider);
      setSigner(web3Signer);
      setContract(contractInstance);
      setNetwork(networkName);

    } catch (err) {
      console.error('Wallet connection error:', err);
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  // Switch to supported network
  const switchToSupportedNetwork = async () => {
    try {
      // Try Curtis testnet first
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x8117' }], // 33111 in hex
      });
    } catch (switchError) {
      // If network doesn't exist, add it
      if (switchError.code === 4902) {
        await addNetwork('curtis');
      } else {
        throw switchError;
      }
    }
  };

  // Add network to MetaMask
  const addNetwork = async (networkName) => {
    const networkConfig = NETWORK_CONFIG[networkName];
    
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: `0x${networkConfig.chainId.toString(16)}`,
        chainName: networkConfig.name,
        nativeCurrency: networkConfig.nativeCurrency,
        rpcUrls: [networkConfig.rpcUrl],
        blockExplorerUrls: [networkConfig.blockExplorer],
      }],
    });
  };

  // Disconnect wallet
  const disconnect = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setContract(null);
    setNetwork(null);
    setError(null);
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnect();
        } else if (accounts[0] !== account) {
          connectWallet();
        }
      };

      const handleChainChanged = () => {
        window.location.reload(); // Reload on network change
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [account]);

  // Auto-connect if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          });
          if (accounts.length > 0) {
            await connectWallet();
          }
        } catch (err) {
          console.error('Auto-connect failed:', err);
        }
      }
    };

    autoConnect();
  }, []);

  const value = {
    account,
    provider,
    signer,
    contract,
    network,
    isConnecting,
    error,
    connectWallet,
    disconnect,
    addNetwork,
    isConnected: !!account,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};
