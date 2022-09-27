import React, { useState, useEffect, useRef } from "react";
import CreateWalletModal from "./CreateWalletModal";
import JSONPretty from "react-json-pretty";
import JSONPrettyMon from "react-json-pretty/dist/monikai";
import MultiSigABI from "../contracts/MultiSig.json";
import MultiSigFactoryABI from "../contracts/MultiSigFactory.json";
import { AiOutlineCopy } from "react-icons/ai";
import { useAccount, useContract, usePrepareSendTransaction, useProvider, useSendTransaction } from "wagmi";
import MultiSigOption from "./MultiSigOption";
import { FaWallet } from "react-icons/fa";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import ButtonWithLoader from "./ButtonWithLoader";
import { copyToClipboard, shortAddress } from "../helper/helpers";
import useContractW from "../hooks/useContractW";
import ContractExplorer from "./ContractExplorer";
import useFetchContract from "../hooks/useFetchContract";
import {
  Accordion,
  AccordionItem,
  AccordionItemHeading,
  AccordionItemButton,
  AccordionItemPanel,
} from "react-accessible-accordion";

// Demo styles, see 'Styles' section below for some notes on use.
import "react-accessible-accordion/dist/fancy-example.css";

const MultiSigListing = () => {
  const ADD_OWNER_ACTION = "addNewOwnerProposal";
  const REMOVE_OWNER_ACTION = "removeOwnerProposal";

  const { getContractFromApi } = useFetchContract();
  const { address, isConnected } = useAccount();
  const [showModal, setShowModal] = useState(false);
  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [walletTransactions, setWalletTransactions] = useState(null);
  const [newOwner, setNewOwner] = useState("");

  const [removeOwner, setRemoveOwner] = useState("");
  const [newApproval, setNewApproval] = useState(0);

  const [depositWalletValue, setDepositWalletValue] = useState(0);

  const [walletTxnCount, setWalletTxnCount] = useState(0);

  const [fetchingWallet, setFetchingWallet] = useState(true);

  const [fetchingProposals, setFetchingProposals] = useState(true);

  const provider = useProvider();
  const contract = useContract({
    addressOrName: process.env.REACT_APP_CONTRACT_ADDRESS,
    contractInterface: MultiSigFactoryABI.abi,
    signerOrProvider: provider,
  });

  const multiSigAddr =
    selectedWallet?.multiSigAddress || ethers.constants.AddressZero;

  const { config } = usePrepareSendTransaction({
    request: { to: multiSigAddr, value: ethers.utils.parseEther(depositWalletValue.toString()) },
  })
  const { data, isLoading:depositing, isSuccess, sendTransaction } =  useSendTransaction(config)

  const multiSigContract = useContract({
    addressOrName: multiSigAddr,
    contractInterface: MultiSigABI.abi,
    signerOrProvider: provider,
  });


  const { write: submitP, isLoading } = useContractW({
    abi: MultiSigABI.abi,
    cAddr: multiSigAddr,
    funcName: "submitProposal",
    txnSuccess: async (d) => {
      console.log(d);
      await refetchProposals();
      toast.success("Proposal submitted successfully");
    },
    txnError: (e) => {
      console.log(e);
    },
  });

  const { write: approve, isLoading: appLoading } = useContractW({
    abi: MultiSigABI.abi,
    cAddr: multiSigAddr,
    funcName: "approveTransaction",
    txnSuccess: async (d) => {
      console.log(d);
      await refetchProposals();
      toast.success("Transaction approved");
    },
    txnError: (e) => {
      console.log(e);
    },
  });

  const { write: executeP, isLoading: execLoading } = useContractW({
    abi: MultiSigABI.abi,
    cAddr: multiSigAddr,
    funcName: "executeProposal",
    txnSuccess: async (d) => {
      console.log(d);
      await refetchProposals();
      toast.success("Transaction executed");
    },
    txnError: (e) => {
      console.log(e);
    },
  });

  useEffect(() => {
    if(isSuccess) {
      console.log(isSuccess);
      toast.success("Deposited");
    }
  },[isSuccess])

  useEffect(() => {
    if (selectedWallet) {
      (async () => {
        const count = await multiSigContract.getTransactionCount();
        setWalletTxnCount(count);
      })();
    }
  }, [selectedWallet]);

  const getWalletTxnProposals = async () => {
    const transactions = [];
    if (isConnected && address) {
      const txnCount = await multiSigContract.getTransactionCount();
      for (let i = 0; i < txnCount.toNumber(); i++) {
        const txn = await multiSigContract.transactions(i);
        let decodedCallData = "";
        let info = {
          data: txn.data,
          value: txn.value,
        };

        try {
          decodedCallData = multiSigContract.interface.parseTransaction(info);
        } catch (error) {
          let c = await getContractFromApi(txn.to);
          if (c) {
            decodedCallData = c.interface.parseTransaction(info);
          } else {
            decodedCallData = { args: [] };
          }
        }

        const txnApproved =
          selectedWallet.signaturesRequired.toString() ===
          txn.confirmations.toString();
        transactions.push({
          ...txn,
          decodedCallData,
          txnApproved,
        });
      }
    }
    return transactions;
  };

  // useEffect(() => {
  //   if (wallets.length && selectedWallet === null && isConnected) {
  //     (async() => {
  //       console.log(address)
  //       const isOwner = await multiSigContract.isOwner(address);
  //       console.log(isOwner);
  //       if (isOwner) {
  //         showWalletHandler(wallets[0].multiSigAddress);
  //       }
  //       if (fetchingWallet) {
  //         setFetchingWallet(false);
  //       }
  //     })()
  //   }
  // }, [wallets]);

  useEffect(() => {
    let fetchTxn = true;
    if (selectedWallet !== null) {
      (async () => {
        if (multiSigContract) {
          const allTxn = await getWalletTxnProposals();
          if (fetchTxn) {
            setWalletTransactions(allTxn);
            setFetchingProposals(false);
          }
        }
      })();
    }
    return () => {
      fetchTxn = false;
    };
  }, [selectedWallet]);

  const getWallets = async () => {
    const walletInfo = [];
    if (isConnected && address) {
      const walletCount = await contract.numberOfMultiSigs();
      for (let i = 0; i < walletCount.toNumber(); i++) {
        const details = await contract.getMultiSigInfo(i);
        walletInfo.push(details);
      }
    }
    return walletInfo;
  };

  const refetchUseWallets = async () => {
    const wallets = await getWallets();
    setWallets(wallets);
  };

  const refetchProposals = async () => {
    setFetchingProposals(true);
    const allTxn = await getWalletTxnProposals();
    setWalletTransactions(allTxn);
    setFetchingProposals(false);
  }

  useEffect(() => {
    let fetch = true;
    (async () => {
      if (contract) {
        const walletInfo = await getWallets();
        if (fetch) {
          setFetchingWallet(false);
          setWallets(walletInfo);
        }
      }
    })();
    return () => {
      fetch = false;
    };
  }, []);

  const showWalletHandler = (e) => {
    const addr = e?.target?.value || e;
    const info = wallets.find(
      (w) => w.multiSigAddress.toLowerCase() === addr.toLowerCase()
    );
    if (typeof info !== "undefined") {
      setSelectedWallet(info);
    } else {
      setSelectedWallet(null);
    }
  };

  const submitProposalHandler = async (functionName) => {
    if (functionName === "" || selectedWallet === null) return;
    const toExecuteAddress = selectedWallet?.multiSigAddress;
    let args = [];
    switch (functionName) {
      case ADD_OWNER_ACTION:
        if (!ethers.utils.isAddress(newOwner)) {
          toast.error("invalid address");
          return;
        }
        if (
          selectedWallet.owners.find(
            (o) => o.toLowerCase() === newOwner.toLowerCase()
          )
        ) {
          toast.info("owner address already exists in wallet");
          return;
        }
        const callData = multiSigContract.interface.encodeFunctionData(
          functionName,
          [newOwner]
        );
        args = [
          "Add New Owner",
          toExecuteAddress,
          ethers.utils.parseEther("0"),
          callData,
        ];
        break;

      case REMOVE_OWNER_ACTION:
        if (!newApproval) return;
        if (!ethers.utils.isAddress(removeOwner)) {
          toast.error("invalid address");
          return;
        }
        if (
          !selectedWallet.owners.find(
            (o) => o.toLowerCase() === removeOwner.toLowerCase()
          )
        ) {
          toast.error("owner address doesn't exists in wallet");
          return;
        }
        const callData1 = multiSigContract.interface.encodeFunctionData(
          functionName,
          [removeOwner, newApproval]
        );
        args = [
          "Remove Owner",
          toExecuteAddress,
          ethers.utils.parseEther("0"),
          callData1,
        ];
        break;

      default:
        break;
    }

    submitP({
      recklesslySetUnpreparedArgs: args,
    });
  };

  const approveTxnHandler = async (txnId) => {
    approve({
      recklesslySetUnpreparedArgs: [txnId],
    });
  };

  const executeTxnHandler = async (txnId) => {
    executeP({
      recklesslySetUnpreparedArgs: [txnId],
    });
  };

  const copyTxt = async (text) => {
    await copyToClipboard(text);
    toast.info("Copied to clipboard");
  };

  const depositHandler = async () => {
    if(!depositWalletValue) return;
    sendTransaction?.();
  }

  return (
    <>
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
              onChange={showWalletHandler}
              value={selectedWallet?.multiSigAddress || ""}
              disabled={fetchingWallet}
            >
              <option defaultValue={""}>Select MultiSig Wallet</option>
              {wallets.length ? (
                wallets.map((w, idx) => {
                  return <MultiSigOption key={idx} walletInfo={w} />;
                })
              ) : (
                <></>
              )}
            </select>
          </div>
        </div>

        {isConnected && (
          <div className="col-end-7 col-span-2">
            <button
              className="bg-black hover:bg-slate-500 text-white text-sm font-bold py-2 px-4 rounded"
              onClick={() => setShowModal(true)}
            >
              Create new wallet
            </button>
            <CreateWalletModal
              show={showModal}
              setShow={setShowModal}
              refetchUseWallets={refetchUseWallets}
            />
          </div>
        )}
      </div>

      {!fetchingWallet ? (
        <div className="grid grid-cols-6  mt-5">
          <div className="col-start-1 col-end-7">
            {selectedWallet !== null ? (
              <>
                <div className="border-2 border-black p-4 rounded-md">
                  <h4 className="p-2 font-extrabold flex justify-start">
                    {selectedWallet.multiSigAddress}
                    <AiOutlineCopy
                      className="cursor-pointer"
                      onClick={() => {
                        copyTxt(selectedWallet.multiSigAddress);
                      }}
                    />
                  </h4>
                  <h4 className="p-2 font-extrabold flex">
                    <FaWallet className="mr-3" /> Wallet Name:{" "}
                    <span className="text-orange-600 ml-2">
                      {selectedWallet.walletName}
                    </span>
                  </h4>
                  <h4 className="p-2 font-extrabold">
                    Wallet Balance:{" "}
                    <span className="text-green-600">
                      {ethers.utils.formatEther(selectedWallet.balance)} MATIC
                    </span>
                  </h4>
                  <h4 className="p-2 font-extrabold">
                    Approvals Required :{" "}
                    <span className="text-orange-600">
                      {selectedWallet.signaturesRequired.toString()}
                    </span>
                  </h4>
                  <input
                        type="number"
                        placeholder={`(Deposit In Wallet) 💸`}
                        className="px-3 py-3 placeholder-slate-400 text-slate-900 relative bg-grey bg-grey rounded text-xs border-0 shadow outline-none focus:outline-none focus:ring min-w-full mt-2"
                        min={0}
                        name="depositWallet"
                        value={depositWalletValue}
                        onChange={(e) => {setDepositWalletValue(e.target.value)}}
                    />
                    <ButtonWithLoader btnTxt={"Deposit"} btnColor="bg-red-600 mt-2" isLoading={depositing} onClickHandler={depositHandler}/>
                  <h4 className="p-2 font-extrabold">Owners</h4>
                  {selectedWallet.owners.map((owner, idx) => (
                    <p key={idx}>{owner}</p>
                  ))}

                    
                </div>

                {/* Wallet Actions */}
                <div className="w-full bg-white rounded-lg shadow-lg  mt-8">
                  <Accordion allowMultipleExpanded allowZeroExpanded>
                    <AccordionItem>
                      <AccordionItemHeading>
                        <AccordionItemButton>
                          <span className="font-extrabold">Wallet Actions</span>
                        </AccordionItemButton>
                      </AccordionItemHeading>
                      <AccordionItemPanel>
                        <ul className="divide-y-2 divide-gray-100">
                          <li className="flex justify-between p-3">
                            Add Owner
                            <input
                              type="text"
                              placeholder="owner"
                              className="px-3 py-3 placeholder-slate-400 text-slate-900 relative bg-grey bg-grey rounded text-xs border-0 shadow outline-none focus:outline-none focus:ring"
                              onChange={(e) => {
                                setNewOwner(e.target.value);
                              }}
                              value={newOwner}
                            />
                            <ButtonWithLoader
                              isLoading={isLoading}
                              btnTxt={"Submit proposal"}
                              onClickHandler={() => {
                                submitProposalHandler(ADD_OWNER_ACTION);
                              }}
                              disabledVal={newOwner === ""}
                            />
                          </li>
                          <li className="flex justify-between p-3">
                            Remove Owner
                            <input
                              type="text"
                              placeholder="owner"
                              className="px-2 py-3 placeholder-slate-400 text-slate-900 relative bg-grey bg-grey rounded text-xs border-0 shadow outline-none focus:outline-none focus:ring"
                              onChange={(e) => {
                                setRemoveOwner(e.target.value);
                              }}
                              value={removeOwner}
                            />
                            <input
                              type="number"
                              placeholder="new approvals"
                              className="px-2 py-3 placeholder-slate-400 text-slate-900 relative bg-grey bg-grey rounded text-xs border-0 shadow outline-none focus:outline-none focus:ring"
                              onChange={(e) => {
                                setNewApproval(e.target.value);
                              }}
                              value={newApproval}
                              min={1}
                            />
                            <ButtonWithLoader
                              isLoading={isLoading}
                              btnTxt={"Submit proposal"}
                              onClickHandler={() => {
                                submitProposalHandler(REMOVE_OWNER_ACTION);
                              }}
                            />
                          </li>
                        </ul>
                      </AccordionItemPanel>
                    </AccordionItem>
                  </Accordion>
                </div>
              </>
            ) : (
              <div className="text-center">
                <h5 className="mt-20 font-bold">
                  Please select a wallet / Create a new wallet
                </h5>
              </div>
            )}
          </div>

          {selectedWallet && (
            <div className="col-start-1 col-end-7">
              <div className="w-full bg-white rounded-lg shadow-lg mt-8">
                <Accordion allowMultipleExpanded allowZeroExpanded>
                  <AccordionItem>
                    <AccordionItemHeading>
                      <AccordionItemButton>
                        <span className="font-extrabold">{`All Proposals (${walletTxnCount})`}</span>
                      </AccordionItemButton>
                    </AccordionItemHeading>
                    <AccordionItemPanel>
                      <div>
                        <ul className={`divide-y-2 divide-gray-100`}>
                          {selectedWallet && walletTransactions && !fetchingProposals?
                            walletTransactions.map((t, idx) => (
                              <li key={idx} className=" p-3">
                                <div className="col-start-1 col-end-3 flex justify-between">
                                  {t.name}
                                  <span>
                                    <span className="font-bold">To: </span>
                                    {shortAddress(t.to)}{" "}
                                    <AiOutlineCopy
                                      className="cursor-pointer"
                                      onClick={() => {
                                        copyTxt(t.to);
                                      }}
                                    />
                                  </span>
                                  <span>
                                    <span className="font-bold">
                                      Approvals:
                                    </span>{" "}
                                    {t.confirmations.toString()} /{" "}
                                    {selectedWallet.signaturesRequired.toString()}
                                  </span>
                                  <span>
                                    {t.executed ? (
                                      <span className="bg-green-100 text-slate-800 text-sm font-bold mr-2 px-2.5 py-0.5 rounded dark:bg-green-300 dark:text-black">
                                        Executed
                                      </span>
                                    ) : !t.txnApproved ? (
                                      <>
                                        <ButtonWithLoader
                                          isLoading={appLoading}
                                          onClickHandler={() => {
                                            approveTxnHandler(idx);
                                          }}
                                          btnTxt={"Approve"}
                                        />
                                      </>
                                    ) : (
                                      <>
                                        <ButtonWithLoader
                                          btnColor="bg-sky-400"
                                          btnTxt={"Execute"}
                                          isLoading={execLoading}
                                          onClickHandler={() => {
                                            executeTxnHandler(idx);
                                          }}
                                        />
                                      </>
                                    )}
                                  </span>
                                </div>
                                <div className="col-start-1 col-end-3 flex justify-between mt-2">
                                  <span>
                                    <span className="font-bold">
                                      FuncName:{" "}
                                    </span>
                                    {t.decodedCallData.name}
                                  </span>

                                  <span>
                                    <span className="font-bold">
                                      Value:{" "}
                                    </span>
                                    {(ethers.utils.formatEther(t.value))}
                                  </span>

                                  <div>
                                    Arguments <br />
                                    {t.decodedCallData.args.length && (
                                      <JSONPretty
                                        data={JSON.stringify(
                                          t.decodedCallData.args
                                        )}
                                        theme={JSONPrettyMon}
                                      />
                                    )}
                                  </div>
                                </div>
                              </li>
                            )):
                              <>Loading...</>
                            }
                        </ul>
                      </div>
                    </AccordionItemPanel>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          )}

          <div className="col-start-1 col-end-7">
            <div className="w-full bg-white rounded-lg shadow-lg  mt-8">
              <ContractExplorer selectedWallet={selectedWallet} />
            </div>
          </div>
        </div>
      ) : (
        <>Fetching Wallets....</>
      )}
    </>
  );
};

export default MultiSigListing;
