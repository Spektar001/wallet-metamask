import { Dispatch, SetStateAction } from "react";

type TransactionFormProps = {
  amount: string;
  setAmount: Dispatch<SetStateAction<string>>;
  recipient: string;
  setRecipient: Dispatch<SetStateAction<string>>;
  sendTransaction: (event: React.FormEvent) => void;
};

const TransactionForm = ({
  amount,
  setAmount,
  recipient,
  setRecipient,
  sendTransaction,
}: TransactionFormProps) => {
  return (
    <form onSubmit={sendTransaction} className="flex flex-col gap-2">
      <h2 className="text-center text-xl font-medium">Fast Transaction</h2>
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
  );
};

export default TransactionForm;
