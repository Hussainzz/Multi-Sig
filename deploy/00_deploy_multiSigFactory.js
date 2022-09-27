const { developmentChains } = require("../helper-hardhat");
const { verify } = require("../task/verify");

module.exports = async ({getNamedAccounts, deployments}) => {
    const {deployer} = await getNamedAccounts();
    const {deploy, log} = deployments;

    log('-----------------------------------------');

   
    const multiSigFactory = await deploy("MultiSigFactory",{
        from: deployer,
        args:[],
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1
    });
    

    log('-----------------------------------------');

    //verify contract
    if (!developmentChains.includes(network.name) && process.env.POLYSCAN_API_KEY) {
        log("Verifying...")
        await verify(multiSigFactory.address, [])
    }
}

module.exports.tags = ["all","MultiSigFactory"];