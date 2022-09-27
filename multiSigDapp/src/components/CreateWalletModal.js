import React,{useEffect, useState} from "react";

import { FaPlusCircle, FaMinus } from "react-icons/fa";
import { toast } from "react-toastify";
import { useContractEvent, useContractWrite, useWaitForTransaction } from "wagmi";
import MultiSigFactoryABI  from "../contracts/MultiSigFactory.json";
import { shortAddress } from "../helper/helpers";

const CreateWalletModal = ({ show, setShow, refetchUseWallets }) => {
    const [walletName, setWalletName] = useState("")
    const [owner, setOwner] = useState("")
    const [approvals, setApprovals] = useState(0);
    const [newOwners, setNewOwners] = useState([])

    const { data, write, isError, error } = useContractWrite({
      mode:"recklesslyUnprepared",
      addressOrName: process.env.REACT_APP_CONTRACT_ADDRESS,
      contractInterface: MultiSigFactoryABI.abi,
      functionName: "createNewMultiSigWallet"
    });

    useEffect(() => {
      if(isError){
        toast.error(error.reason);
      }
    },[isError])

    // useContractEvent({
    //   addressOrName: process.env.REACT_APP_CONTRACT_ADDRESS,
    //   contractInterface: MultiSigFactoryABI.abi,
    //   eventName: 'NewWalletCreated',
    //   listener: (event) => {
    //     if(event){
    //       console.log(event);
    //       setWallets(prev => {
    //         return [
    //           ...prev,
    //           {
    //             multiSigAddress: event[1],
    //             walletName: walletName
    //           }
    //         ]
    //       });
    //     }
    //   },
    //   once: true
    // })

    const clearModalInputs = () => {
      setOwner("");
      setNewOwners([]);
      setWalletName("");
      setShow(false)
    }

    const {isLoading } = useWaitForTransaction({
      hash: data?.hash,
      onSuccess: async (d) => {
        await refetchUseWallets();
        toast.success('Wallet created successfully');
        clearModalInputs();
      },
      onError: e => {
        console.log(e);
      }
    });

    const addOwner = () => {
        if(owner === "") return;
        setNewOwners(prev => {
            return [
                ...prev,
                owner
            ]
        })
    }

    const removeOwner = (ownerIdx) => {
        if(!newOwners.length) return;
        const oth = newOwners.filter((o, idx) => idx !== ownerIdx)
        setNewOwners(oth)
    }

    const createNewWalletHandler = async() => {
      if(!newOwners.length || !approvals || walletName === "") return;
      write({
        recklesslySetUnpreparedArgs: [walletName, newOwners, approvals]
      });
    }


    return (
        <>
          {show && (
            <div className="fixed top-0 flex items-center justify-center p-10 left-0 right-0 bottom-0 bg-opacity-25 bg-black z-10">
              <div className="bg-white p-10 rounded-lg max-w-2xl z-50 relative overflow-y-scroll">
                <div
                  className="absolute top-5 right-5 bg-gray-300 p-3 rounded-full hover:bg-gray-400 transition-all cursor-pointer"
                  onClick={() => setShow(false)}
                >
                  <img
                    src="https://iconape.com/wp-content/png_logo_vector/cross-2.png"
                    className="h-3 w-3"
                  />
                </div>
                <div className="font-bold text-2xl">New Wallet</div>
                <div className="mt-3">
                  <input
                      type="text"
                      placeholder="Wallet Name"
                      className="px-3 py-3 placeholder-slate-400 text-slate-900 relative bg-grey bg-grey rounded text-sm border-0 shadow outline-none focus:outline-none focus:ring w-full"
                      onChange={(e)=>{ setWalletName(e.target.value)}}
                      value={walletName}
                  />
                </div>
                <div className="flex justify-between mt-5">
                    <div className="col-start-1 col-end-3 pr-4">
                        <input
                            type="text"
                            placeholder="Owner Address To Add"
                            className="px-3 py-3 placeholder-slate-400 text-slate-900 relative bg-grey bg-grey rounded text-sm border-0 shadow outline-none focus:outline-none focus:ring w-full"
                            onChange={(e)=>{ setOwner(e.target.value)}}
                            value={owner}
                        />
                    </div>

                    <div className="col-end-7 col-span-2">
                        <button className="mr-2 px-3 py-2 bg-black text-white rounded-md hover:bg-slate-500 transition-all text-xs" onClick={addOwner}>
                            <FaPlusCircle/>
                        </button>
                    </div>
                </div>
                <div className="mt-5">
                    <div className="w-full bg-white rounded-lg shadow text-xs">
                       {(newOwners.length) ? 
                            <>
                                <p className="pb-3 font-extrabold">Owners</p>
                                <ul className="divide-y-2 divide-gray-100">
                                {newOwners.map((o, idx) => (
                                    <li className="p-2 flex justify-evenly" key={idx}>
                                      <span className="font-bold mt-2">{shortAddress(o)}</span>
                                      <button className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-slate-500 transition-all text-xs" onClick={() => {removeOwner(idx)}}>
                                          <FaMinus/>
                                      </button> 
                                    </li>
                                ))}
                            </ul>
                            </>
                          :
                          <></>
                        }
                    </div>
                </div>

                <div className="mt-5">
                    <input
                        type="number"
                        placeholder="Number of approvals"
                        className="px-3 py-3 placeholder-slate-400 text-slate-900 relative bg-grey bg-grey rounded text-sm border-0 shadow outline-none focus:outline-none focus:ring mb-4"
                        value={approvals}
                        min={1}
                        onChange={(e)=>{ setApprovals(e.target.value)}}
                    />
                </div>
                <div className="mt-3 flex items-center justify-center">
                  
                  {isLoading ?
                     <button className="flex items-center px-5 py-2 bg-black text-white rounded-md hover:bg-slate-500 text-sm transition-all " disabled>
                     <svg className="mr-3 h-5 w-5 animate-spin" fill="none" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10 3.5A6.5 6.5 0 0 0 3.5 10 .75.75 0 0 1 2 10a8 8 0 1 1 8 8 .75.75 0 0 1 0-1.5 6.5 6.5 0 1 0 0-13Z" fill="#ffffff" className="fill-212121"></path></svg>
                       Creating Wallet...
                     </button>
                     :
                    <button className="px-5 py-2 bg-black text-white rounded-md hover:bg-slate-500 text-sm transition-all " onClick={createNewWalletHandler}>
                     Create
                    </button>
                  }             
                  
                </div>
              </div>
            </div>
          )}
        </>
      );
};

export default CreateWalletModal;
