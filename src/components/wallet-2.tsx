"use client";

import detectEthereumProvider from "@metamask/detect-provider";
import { Web3 } from "web3";
import { useState, useEffect } from "react";

const WalletPage_2 = () => {
  const initialState = { accounts: [], balance: "", chainId: "" };

  const [hasProvider, setHasProvider] = useState<boolean | null>(null);
  const [wallet, setWallet] = useState(initialState); //данные кошелька: адрес, баланса, chainID...
  const [recipient, setRecipient] = useState<string>(""); //адрес куда отправить транзакцию
  const [amount, setAmount] = useState<string>(""); // сколько токенов надо отправить

  useEffect(() => {
    const refreshAccounts = (accounts: any) => {
      //функция которая проверяет, поменялось что-то после презагрузки страницы или нет
      if (accounts.length > 0) {
        updateWallet(accounts);
      } else {
        // if length 0, user is disconnected
        setWallet(initialState);
      }
    };

    const refreshChain = (chainId: string) => {
      //функция которая меняет старый chainId на новый
      setWallet((wallet) => ({ ...wallet, chainId }));
    };

    const getProvider = async () => {
      //провеяет установлено ли расшерение в браузере
      const provider = await detectEthereumProvider({ silent: true });
      setHasProvider(Boolean(provider));

      if (provider) {
        //если установлено, то получаем адрес кошелька и предаем его в refreshAccounts и запускаем слушатель
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
      //удаляем слушатели
      window.ethereum?.removeListener("accountsChanged", refreshAccounts);
      window.ethereum?.removeListener("chainChanged", refreshChain);
    };
  }, [wallet]);

  const updateWallet = async (accounts: any) => {
    //функция получает адрес кошелька и обновляет useState => wallet
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
    //функция подключения к кошельку
    let accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    updateWallet(accounts);
  };

  const handleSwitchChain = async (chainId: string) => {
    //функция смены сети
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId }],
    });
  };

  const updateNetworkData = async (chainId: string) => {
    //функция обновления данных о кошельке
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
    //функция отправки транзакции
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
    <div className="flex flex-col gap-2 p-5">
      <h1 className="text-center text-2xl font-medium mb-3">
        Injected Provider {hasProvider ? "DOES" : "DOES NOT"} Exist
      </h1>
      <div>
        <h2 className="text-center text-xl font-medium mb-2">Change Network</h2>
        <div className="flex flex-wrap items-center justify-center gap-3 mb-3">
          <button
            onClick={() => {
              updateNetworkData("0x1");
            }}
            className={`${
              wallet.chainId === "0x1" ? "bg-red-500" : "bg-blue-500"
            } p-2 rounded-md text-white hover:bg-red-500`}
          >
            Etherium
          </button>
          <button
            onClick={() => {
              updateNetworkData("0x38");
            }}
            className={`${
              wallet.chainId === "0x38" ? "bg-red-500" : "bg-blue-500"
            } p-2 rounded-md text-white hover:bg-red-500`}
          >
            Binance Smart Chain
          </button>
          <button
            onClick={() => {
              updateNetworkData("0x4e454153");
            }}
            className={`${
              wallet.chainId === "0x4e454153" ? "bg-red-500" : "bg-blue-500"
            } p-2 rounded-md text-white hover:bg-red-500`}
          >
            Aurora Testnet
          </button>
        </div>
      </div>
      {window.ethereum?.isMetaMask && wallet.accounts.length < 1 && (
        <button
          onClick={handleConnect}
          className="bg-blue-500 p-2 rounded-md text-white"
        >
          Connect MetaMask
        </button>
      )}
      {wallet.accounts.length > 0 && (
        <>
          <div className="text-balance">Address: {wallet.accounts[0]}</div>
          <div>Balance: {parseFloat(wallet.balance)}</div>
          <div>Hex ChainId: {wallet.chainId}</div>
          <div>Numeric ChainId: {Web3.utils.toWei(wallet.chainId, "wei")}</div>
          <form onSubmit={sendTransaction} className="flex flex-col gap-2">
            <h2 className="text-center text-xl font-medium">
              Fast Transaction
            </h2>
            <input
              className="border border-gray-500 p-1 rounded-md"
              required
              type="text"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <input
              className="border border-gray-500 p-1 rounded-md"
              required
              type="text"
              placeholder="Recipient Address"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
            <button
              type="submit"
              className="bg-blue-500 p-2 rounded-md text-white"
            >
              Send Transaction
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default WalletPage_2;
