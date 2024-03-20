"use client";

import detectEthereumProvider from "@metamask/detect-provider";
import { Web3 } from "web3";
import { useState, useEffect } from "react";

export default function Home() {
  const initialState = { accounts: [], balance: "", chainId: "" };

  const [hasProvider, setHasProvider] = useState<boolean | null>(null);
  const [wallet, setWallet] = useState(initialState); //данные кошелька: адрес, баланса, chainID...
  const [recipient, setRecipient] = useState<string>(""); //адрес куда отправить транзакцию
  const [amount, setAmount] = useState<string>(""); // сколько токенов надо отправить

  const [loading, setLoading] = useState(false);

  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const refreshAccounts = (accounts: any) => {
      if (accounts.length > 0) {
        updateWallet(accounts);
      } else {
        setWallet(initialState);
      }
    };

    const refreshChain = (chainId: string) => {
      setWallet((wallet) => ({ ...wallet, chainId }));
    };

    const getProvider = async () => {
      //провеяет установлено ли расшерение в браузере
      const provider = await detectEthereumProvider({ silent: true });
      setHasProvider(Boolean(provider));

      if (provider) {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        refreshAccounts(accounts);
        window.ethereum.on("accountsChanged", refreshAccounts);
        window.ethereum.on("chainChanged", refreshChain);
      }
    };

    getProvider();
    return () => {
      window.ethereum?.removeListener("accountsChanged", refreshAccounts);
      window.ethereum?.removeListener("chainChanged", refreshChain);
    };
  }, [wallet]);

  const updateWallet = async (accounts: any) => {
    const balance = Web3.utils.fromWei(
      await window.ethereum!.request({
        method: "eth_getBalance",
        params: [accounts[0], "latest"],
      }),
      "ether"
    );
    const chainId = await window.ethereum!.request({
      method: "eth_chainId",
    });

    setWallet({ accounts, balance, chainId });
  };

  const handleConnect = async () => {
    setLoading(true);
    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setError(false);
      updateWallet(accounts);
    } catch (err: any) {
      setError(true);
      setErrorMessage(err.message);
    }
    setLoading(false);
    setIsConnecting(false);
  };

  const handleSwitchChain = async (chainId: string) => {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId }],
    });
  };

  const updateNetworkData = async (chainId: string) => {
    await handleSwitchChain(chainId);
    const newChainId = await window.ethereum!.request({
      method: "eth_chainId",
    });
    const newBalance = Web3.utils.fromWei(
      await window.ethereum!.request({
        method: "eth_getBalance",
        params: [wallet.accounts[0], "latest"],
      }),
      "ether"
    );

    setWallet((prevWallet) => ({
      ...prevWallet,
      chainId: newChainId,
      balance: newBalance,
    }));
  };

  const sendTransaction = async (event: React.FormEvent) => {
    event.preventDefault();
    let accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    const recipientParam = recipient.startsWith("0x")
      ? recipient
      : `0x${recipient}`;

    const txObject = {
      from: accounts[0],
      to: recipientParam,
      gasPrice: Web3.utils.toHex("30000000000"),
      gas: Web3.utils.toHex("21000"),
      value: Web3.utils.toHex(Web3.utils.toWei(amount, "ether")),
    };

    const txHash = await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [{ ...txObject }],
    });

    console.log("Transaction Hash:", txHash);
    setRecipient("");
    setAmount("");
  };

  return (
    <div className="flex flex-col gap-2 p-5 mt-5 shadow-lg rounded-lg">
      <h1 className="text-center text-2xl max-[450px]:text-xl font-medium mb-3">
        Injected Provider {hasProvider ? "DOES" : "DOES NOT"} Exist
      </h1>
      {window.ethereum?.isMetaMask && wallet.accounts.length < 1 && (
        <button
          onClick={handleConnect}
          className="w-1/3 mx-auto bg-blue-500 hover:bg-blue-700 transition-settings p-2 rounded-md text-white"
        >
          Connect MetaMask
        </button>
      )}
      {loading && <p className="text-center">Loading...</p>}
      {wallet.accounts.length > 0 && (
        <>
          <h2 className="text-center text-xl font-medium mb-2">
            Change Network
          </h2>
          <div className="flex flex-wrap gap-3 mb-3 max-[450px]:flex-col">
            <button
              onClick={() => {
                updateNetworkData("0x1");
              }}
              className={`${
                wallet.chainId === "0x1" ? "bg-red-500" : "bg-blue-500"
              } flex-1 p-2 rounded-md text-white hover:bg-red-500 transition-settings`}
            >
              Etherium
            </button>
            <button
              onClick={() => {
                updateNetworkData("0x38");
              }}
              className={`${
                wallet.chainId === "0x38" ? "bg-red-500" : "bg-blue-500"
              } flex-1 p-2 rounded-md text-white hover:bg-red-500 transition-settings`}
            >
              Binance Smart Chain
            </button>
          </div>
          <p className="break-all">Address: {wallet.accounts[0]}</p>
          <p>Balance: {parseFloat(wallet.balance)}</p>
          <p>Hex ChainId: {wallet.chainId}</p>
          <p>Numeric ChainId: {Web3.utils.toWei(wallet.chainId, "wei")}</p>
          <hr />
          <form onSubmit={sendTransaction} className="flex flex-col gap-2">
            <h2 className="text-center text-xl font-medium">
              Fast Transaction
            </h2>
            <input
              className="border border-gray-300 p-1 rounded-md"
              required
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <input
              className="border border-gray-300 p-1 rounded-md"
              required
              type="text"
              placeholder="Recipient Address"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 transition-settings p-2 rounded-md text-white"
            >
              Send Transaction
            </button>
          </form>
        </>
      )}
      {error && (
        <div className="text-center text-lg" onClick={() => setError(false)}>
          <strong>Error:</strong> {errorMessage}
        </div>
      )}
    </div>
  );
}
