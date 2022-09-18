import React,{useState} from "react";

import { FaPlusCircle } from "react-icons/fa";

const CreateWalletModal = ({ show, setShow }) => {
    const [owner, setOwner] = useState("")
    const [approvals, setApprovals] = useState(0);
    const [newOwners, setNewOwners] = useState([])

    const addOwner = () => {
        if(owner === "") return;
        setNewOwners(prev => {
            return [
                ...prev,
                owner
            ]
        })
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
                        <button className="px-5 py-2 bg-black text-white rounded-md hover:bg-slate-500 transition-all" onClick={addOwner}>
                            <FaPlusCircle/>
                        </button>
                    </div>
                </div>
                <div className="mt-5">
                    <div className="w-full bg-white rounded-lg shadow text-xs">
                       {(newOwners.length) ? 
                            <>
                                <p className="pb-3">Owners</p>
                                <ul className="divide-y-2 divide-gray-100">
                                {newOwners.map((o, idx) => (
                                    <li className="p-3" key={idx}>{o}</li>
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
                        onChange={(e)=>{ setApprovals(e.target.value)}}
                    />
                </div>
                <div className="mt-3 space-x-3">
                   
                  <button className="px-5 py-2 bg-black text-white rounded-md hover:bg-slate-500 text-sm transition-all">
                    Create
                  </button>
                  
                </div>
              </div>
            </div>
          )}
        </>
      );
};

export default CreateWalletModal;
