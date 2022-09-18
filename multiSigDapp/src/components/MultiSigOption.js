import React from "react";

const MultiSigOption = ({walletInfo}) => {
    console.log(walletInfo);
  const {walletName, multiSigAddress} = walletInfo;
  return (
    <>
      <option value={multiSigAddress}>{`${walletName} - ${multiSigAddress.slice(0, 4)}...${multiSigAddress.slice(38)}`}</option>
    </>
  );
};

export default MultiSigOption;
