module.exports = async ({getNamedAccounts, deployments}) => {
    const {deployer} = await getNamedAccounts();
    const {deploy, log} = deployments;

    log('-----------------------------------------');

   
    await deploy("MultiSig",{
        from: deployer,
        args:["someName", [deployer], 1],
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1
    });

    log('-----------------------------------------');
}

module.exports.tags = ["all","MultiSig"];