type NetworkSwitchButtonsProps = {
  chainId: string;
  updateNetworkData: (chainId: string) => Promise<void>;
};

const NetworkSwitchButtons = ({
  chainId,
  updateNetworkData,
}: NetworkSwitchButtonsProps) => {
  return (
    <div className="flex flex-wrap gap-3 mb-3 max-[450px]:flex-col">
      <button
        onClick={() => {
          updateNetworkData("0x1");
        }}
        className={`${
          chainId === "0x1" ? "bg-blue-800" : "bg-blue-500"
        } networkSwitchButtons`}
      >
        Etherium
      </button>
      <button
        onClick={() => {
          updateNetworkData("0x38");
        }}
        className={`${
          chainId === "0x38" ? "bg-blue-800" : "bg-blue-500"
        } networkSwitchButtons`}
      >
        Binance Smart Chain
      </button>
    </div>
  );
};

export default NetworkSwitchButtons;
