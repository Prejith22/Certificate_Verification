require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.0",  // 👈 Make sure this matches the contract's version
  networks: {
    holesky: {
      url: "https://eth-holesky.g.alchemy.com/v2/ckBNDPNjDYXFZsJmCZrEfGVNy0R2kRnP", // Ensure correct RPC URL
      accounts: ["2cfc8b9f4d615d7adc836d95a8eff3efad7d29c40e03a77a428f62dc961b087b"]
    },
  },
  etherscan: {
    apiKey: {
      holesky: "2PIX9M4WMSS8AD1T9JC5NV16GJIT7HP254" // Replace with your actual API key
    }
  }
};
