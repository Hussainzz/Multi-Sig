const { assert, expect } = require("chai");
const { ethers, deployments, network } = require("hardhat");


describe("Multi Sig Unit Tests", function() {
    let MultiSigFactory, newWallet, deployer, someAccount, someAccount1, someAccount2, someAccount3, someAccount4, someAccount5

    beforeEach(async function() {
        [deployer, someAccount, someAccount1, someAccount2, someAccount3, someAccount4, someAccount5] = await ethers.getSigners();

        await deployments.fixture(["all"]);
        MultiSigFactory = await ethers.getContract("MultiSigFactory");

        const walletName = "new wallet";
        const owners = [deployer.address, someAccount1.address];
        const totalApprovals = 1;
        await MultiSigFactory.createNewMultiSigWallet(walletName, owners, totalApprovals);

        const [multiSigWalletAddress] = await MultiSigFactory.getMultiSigInfo(0);
        const multiSigWallet = await ethers.getContractFactory("MultiSig");
        newWallet = multiSigWallet.attach(multiSigWalletAddress);
    });

    describe("MultiSigFactory", function() {
        it("Should create new multi sig wallet", async () => {
            const walletName = "new wallet";
            const owners = [deployer.address];
            const totalApprovals = 1;
            await expect(MultiSigFactory.createNewMultiSigWallet(walletName, owners, totalApprovals)).to.emit(MultiSigFactory, "NewWalletCreated");
        });
    });


    describe("MultiSig Wallet", function () {
        it("Should all to deposit eth", async () => {
            const deposit = ethers.utils.parseEther("1");
            await deployer.sendTransaction({
                to: newWallet.address,
                value: deposit
            });

            const balance = await ethers.provider.getBalance(newWallet.address);
            expect(balance.toString()).to.equal(deposit.toString())
        })


        it("Should not allow non wallet owner to submit proposal", async () => {
            const methodName = "addNewOwnerProposal";
            const wallet = await newWallet.connect(someAccount5);
            const args = [someAccount.address];
            const callData = wallet.interface.encodeFunctionData(methodName, args);
            const toExecuteAddress = wallet.address
            await expect(wallet.submitProposal("add new signer", toExecuteAddress, ethers.utils.parseEther("0"), callData)).to.revertedWithCustomError(wallet, "NotAnOwner")
        });
     
        it("Should be able to submit addNewOwner Proposal", async () => {
            const methodName = "addNewOwnerProposal";
            const args = [someAccount.address];
            const callData = newWallet.interface.encodeFunctionData(methodName, args);
            const toExecuteAddress = newWallet.address
            await expect(newWallet.submitProposal("add new signer", toExecuteAddress, ethers.utils.parseEther("0"), callData)).to.emit(newWallet, "NewProposal")
        });
    
        it("Should be able to submit removeOwner Proposal", async () => {
            const methodName = "removeOwnerProposal";
            const args = [someAccount1.address, 3];
            const callData = newWallet.interface.encodeFunctionData(methodName, args);
            const toExecuteAddress = newWallet.address
            await expect(newWallet.submitProposal("remove a signer", toExecuteAddress, ethers.utils.parseEther("0"), callData)).to.emit(newWallet, "NewProposal")
        });
    
        it("Should allow owner to approve proposal", async () => {
            const methodName = "addNewOwnerProposal";
            const args = [someAccount.address];
            const callData = newWallet.interface.encodeFunctionData(methodName, args);
            const toExecuteAddress = newWallet.address
            await newWallet.submitProposal("add new signer", toExecuteAddress, ethers.utils.parseEther("0"), callData);
            await expect(newWallet.approveTransaction(0)).to.emit(newWallet, "ApprovedProposal")
        });

        it("Should not allow owner to approve same proposal twice", async () => {
            const methodName = "addNewOwnerProposal";
            const args = [someAccount.address];
            const callData = newWallet.interface.encodeFunctionData(methodName, args);
            const toExecuteAddress = newWallet.address
            await newWallet.submitProposal("add new signer", toExecuteAddress, ethers.utils.parseEther("0"), callData);
            await newWallet.approveTransaction(0);
            await expect(newWallet.approveTransaction(0)).to.revertedWithCustomError(newWallet, "TxnAlreadyConfirmed");
        });
    
        it("Should allow owner to execute addNewOwner approved proposal", async () => {
            const methodName = "addNewOwnerProposal";
            const args = [someAccount.address];
            const callData = newWallet.interface.encodeFunctionData(methodName, args);
            const toExecuteAddress = newWallet.address
            await newWallet.submitProposal("add new signer", toExecuteAddress, ethers.utils.parseEther("0"), callData);
    
            const txId  = 0;
            await newWallet.approveTransaction(txId);
    
            await expect(newWallet.executeProposal(txId)).to.emit(newWallet, "ExecutedProposal");
            expect(await newWallet.isOwner(someAccount.address)).to.be.equal(true);
        });
    
        it("Should allow owner to execute removeOwner approved proposal", async () => {
            const methodName = "removeOwnerProposal";
            const args = [someAccount1.address, 1];
            const callData = newWallet.interface.encodeFunctionData(methodName, args);
            const toExecuteAddress = newWallet.address
            await newWallet.submitProposal("remove a signer", toExecuteAddress, ethers.utils.parseEther("0"), callData);
            
            const txId  = 0;
            await newWallet.approveTransaction(txId);
    
            await expect(newWallet.executeProposal(txId)).to.emit(newWallet, "ExecutedProposal");
            expect(await newWallet.isOwner(someAccount.address)).to.be.equal(false);
        });


        it("Should not execute proposal without all approvals from owners", async () => {
            const methodName = "removeOwnerProposal";
            const args = [someAccount1.address, 1];
            const callData = newWallet.interface.encodeFunctionData(methodName, args);
            const toExecuteAddress = newWallet.address
            await newWallet.submitProposal("remove a signer", toExecuteAddress, ethers.utils.parseEther("0"), callData);
            
            const txId  = 0;
        
            await expect(newWallet.executeProposal(txId)).to.be.revertedWith("cannot execute tx");
        });

        it("Should allow owner to revoke approval, if previously approved", async () => {
            const methodName = "removeOwnerProposal";
            const args = [someAccount1.address, 1];
            const callData = newWallet.interface.encodeFunctionData(methodName, args);
            const toExecuteAddress = newWallet.address
            await newWallet.submitProposal("remove a signer", toExecuteAddress, ethers.utils.parseEther("0"), callData);
            const txId  = 0;
            await newWallet.approveTransaction(txId);
            await expect(newWallet.revokeApproval(txId)).to.emit(newWallet, "RevokedApproval");
        });

        it("Should fail while trying to revoke approval, if the owner never approved the txn ", async () => {
            const methodName = "addNewOwnerProposal";
            const args = [someAccount.address];
            const callData = newWallet.interface.encodeFunctionData(methodName, args);
            const toExecuteAddress = newWallet.address
            await newWallet.submitProposal("add new signer", toExecuteAddress, ethers.utils.parseEther("0"), callData);
            await expect(newWallet.revokeApproval(0)).to.revertedWithCustomError(newWallet, "TxnNotConfirmed");
        });

        it("Should get all multiSig wallet owners", async () => {
            const owners = await newWallet.getMultiSigOwners();
            expect(owners.length).to.be.equal(2);
        });

        it("Should get multiSig transactions count", async () => {
            const methodName = "removeOwnerProposal";
            const args = [someAccount1.address, 1];
            const callData = newWallet.interface.encodeFunctionData(methodName, args);
            const toExecuteAddress = newWallet.address
            await newWallet.submitProposal("remove a signer", toExecuteAddress, ethers.utils.parseEther("0"), callData);
            expect(await newWallet.getTransactionCount()).to.be.equal(1);
        });

        it("Should get multiSig transaction by txnId", async () => {
            const methodName = "removeOwnerProposal";
            const args = [someAccount1.address, 1];
            const callData = newWallet.interface.encodeFunctionData(methodName, args);
            const toExecuteAddress = newWallet.address
            await newWallet.submitProposal("remove a signer", toExecuteAddress, ethers.utils.parseEther("0"), callData);

            const txId  = 0;
            const txnInfo = await newWallet.transactions(txId);
            expect(txnInfo.to).to.be.equal(toExecuteAddress);
            expect(txnInfo.data).to.be.equal(callData);
            expect(txnInfo.value.toString()).to.be.equal('0');
        });
    })
    


});