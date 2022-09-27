import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import { useAccount, useContract, useProvider } from "wagmi";
import MultiSigABI from "../contracts/MultiSig.json";

const MultiSigOption = ({walletInfo}) => {
  const { address, isConnected } = useAccount()
  const {walletName, multiSigAddress} = walletInfo;
  const [showOption, setShowOption] = useState(false);
  const provider = useProvider()
  const multiSigContract = useContract({
    addressOrName: multiSigAddress ? multiSigAddress : ethers.constants.AddressZero,
    contractInterface: MultiSigABI.abi,
    signerOrProvider: provider,
  });

  useEffect(() => {
    let fetch = true;
    if(isConnected && address){
      (async () => {
        const isOwner = await multiSigContract.isOwner(address);
        if(fetch){
          setShowOption(isOwner);
        }
      })() 
    }
    return () => {
      fetch = false;
    }
  },[]);

  if(!showOption) return;

  return (
    <>
      <option value={multiSigAddress}>{`${walletName} - ${multiSigAddress.slice(0, 4)}...${multiSigAddress.slice(38)}`}</option>
    </>
  );
};

export default MultiSigOption;
