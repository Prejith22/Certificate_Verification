const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners(); // ✅ Use hre.ethers

    console.log("Deploying contract with the account:", deployer.address);

    const CertificateContract = await hre.ethers.getContractFactory("CertificateVerification"); // ✅ No need to pass deployer
    const certificate = await CertificateContract.deploy(); 

    await certificate.waitForDeployment(); // ✅ Ensures contract is fully deployed

    const contractAddress = await certificate.getAddress(); // ✅ Correct method for contract address

    console.log("✅ Contract deployed successfully!");
    console.log("📍 Contract Address:", contractAddress);
}

main().catch((error) => {
    console.error("🚨 Deployment failed:", error);
    process.exitCode = 1;
});
