"use client";

import NetworkSwitchButtons from "@/components/NetworkSwitchButtons";
import TransactionForm from "@/components/TransactionForm";
import detectEthereumProvider from "@metamask/detect-provider";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Web3 } from "web3";
import Loading from "./loading";

export default function Home() {
  const initialState = { accounts: [], balance: "", chainId: "" };

  const [hasProvider, setHasProvider] = useState<boolean | null>(null);
  const [wallet, setWallet] = useState(initialState);
  const [recipient, setRecipient] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

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

  const disableConnect = Boolean(wallet) && isConnecting;

  return (
    <div className="flex flex-col gap-2 p-5 mt-5 shadow-lg rounded-lg">
      <div className="text-center mb-3">
        <h1 className="text-2xl max-[450px]:text-xl font-medium">
          Injected Provider {hasProvider ? "DOES" : "DOES NOT"} Exist
        </h1>
        {!hasProvider && (
          <p className="text-lg">
            Please, install{" "}
            <Link
              className="text-xl text-blue-500"
              href={"https://metamask.io/download/"}
            >
              MetaMask
            </Link>{" "}
            for your browser
          </p>
        )}
      </div>
      {window.ethereum?.isMetaMask && wallet.accounts.length < 1 && (
        <button
          disabled={disableConnect}
          onClick={handleConnect}
          className="w-1/3 mx-auto bg-blue-500 hover:bg-blue-700 transition-settings p-2 rounded-md text-white"
        >
          Connect MetaMask
        </button>
      )}
      {loading && <Loading />}
      {wallet.accounts.length > 0 && (
        <>
          <h2 className="text-center text-xl font-medium mb-2">
            Change Network
          </h2>
          <NetworkSwitchButtons
            chainId={wallet.chainId}
            updateNetworkData={updateNetworkData}
          />
          <p className="break-all">Address: {wallet.accounts[0]}</p>
          <p>Balance: {parseFloat(wallet.balance)}</p>
          <p>Hex ChainId: {wallet.chainId}</p>
          <p>Numeric ChainId: {Web3.utils.toWei(wallet.chainId, "wei")}</p>
          <hr />
          <TransactionForm
            amount={amount}
            setAmount={setAmount}
            recipient={recipient}
            setRecipient={setRecipient}
            sendTransaction={sendTransaction}
          />
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
