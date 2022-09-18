import React, { useState, useEffect } from "react";
import CreateWalletModal from "./CreateWalletModal";

import MultiSigFactoryABI  from "../contracts/MultiSigFactory.json";
import { useContract, useProvider } from "wagmi";
import MultiSigOption from "./MultiSigOption";

const MultiSigListing = () => {
  const [showModal, setShowModal] = useState(false);
  const [wallets, setWallets] = useState([]);

  const provider = useProvider()
  const contract = useContract({
    addressOrName: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    contractInterface: MultiSigFactoryABI.abi,
    signerOrProvider: provider,
  });
  
  useEffect(() => {
    let fetch = true;
    (async()=>{
      if(contract){
        const walletInfo = []
        const walletCount = await contract.numberOfMultiSigs();
        console.log(walletCount);

        for(let i = 0; i < walletCount.toNumber(); i++){
          const details = await contract.getMultiSigInfo(i);
          walletInfo.push(details);
        }
        if(fetch){
          console.log(walletInfo);
          setWallets(walletInfo);
        }
      }
    })();
    return () => {
      fetch = false;
    }
  },[])

  return (
    <div className="flex justify-between w-full">
      <div className="col-start-1 col-end-3">
        <div className="mb-3 xl:w-80">
          {/* MultiSig Listing */}
          <select
            className="form-select form-select-sm
            appearance-none
            block
            w-full
            px-2
            py-1
            text-sm
            font-normal
            text-gray-700
            bg-white bg-clip-padding bg-no-repeat
            border border-solid border-gray-300
            rounded
            transition
            ease-in-out
            m-0
            focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
            aria-label=".form-select-sm example"
        >
            <option defaultValue={''}>Select MultiSig Wallet</option>
            {wallets.length ? 
              wallets.map((w, idx) => {
                return <MultiSigOption key={idx} walletInfo={w}/>
              })
              : <></>
            }
        </select>
        </div>
      </div>
      <div className="col-end-7 col-span-2">
        <button
            className="bg-black hover:bg-slate-500 text-white text-sm font-bold py-2 px-4 rounded"
            onClick={() => setShowModal(true)}
        >
            Create new wallet
        </button>
        <CreateWalletModal show={showModal} setShow={setShowModal}/>
      </div>
    </div>
  );
};

export default MultiSigListing;
