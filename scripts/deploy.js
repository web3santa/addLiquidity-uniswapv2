const {
  Contract,
  ContractFactory,
} = require("ethers");
const WETH9 = require("../WETH9.json");

const factoryArtifact = require("@uniswap/v2-core/build/UniswapV2Factory.json");
const routerArtifact = require("@uniswap/v2-periphery/build/UniswapV2Router02.json");
const pairArtifact = require("@uniswap/v2-core/build/UniswapV2Pair.json");

const hre = require("hardhat");

async function main() {
  const [owner] = await hre.ethers.getSigners();
 
  console.log('owner address: ', owner.address);

  const Factory = new ContractFactory(
    factoryArtifact.abi,
    factoryArtifact.bytecode,
    owner
  );
  const factory = await Factory.deploy(owner.address);
  const factoryAddress = await factory.getAddress()
  console.log("factory", factoryAddress);

  const usdt = await hre.ethers.deployContract("Tether", owner);

  await usdt.waitForDeployment();

  console.log('usdt address: ', await usdt.getAddress());

  const usdc = await hre.ethers.deployContract("Usdc", owner);

  await usdc.waitForDeployment();

  console.log('usdc address: ', await usdc.getAddress());


  await usdt.connect(owner).mint(owner.address, hre.ethers.parseEther("1000000"));
  await usdc.connect(owner).mint(owner.address, hre.ethers.parseEther("2000000"));


  const usdtBal = await usdt.balanceOf(owner.address);
  const usdcBal = await usdc.balanceOf(owner.address);

  console.log("usdtBal", usdtBal);
  console.log("usdcBal", usdcBal);

  const usdtAddress = await usdt.getAddress()
  const usdcAddress = await usdc.getAddress()


  const tx1 = await factory.createPair(usdtAddress, usdcAddress);
  await tx1.wait();

  const pairAddress = await factory.getPair(usdtAddress, usdcAddress);

  console.log(pairAddress);

  const pair = new Contract(pairAddress, pairArtifact.abi, owner);
  let reserves;
  reserves = await pair.getReserves();
  console.log("reserves", reserves);

  const Weth = new ContractFactory(WETH9.abi, WETH9.bytecode, owner);
  const weth = await Weth.deploy();

  const wethAddress = await weth.getAddress();

  console.log("weth ", wethAddress);


  const Router = new ContractFactory(
    routerArtifact.abi,
    routerArtifact.bytecode,
    owner
  );
  const router = await Router.deploy(factoryAddress, wethAddress);
  const routerAddress = await router.getAddress();

  console.log("router: ", routerAddress);

  console.log('MaxInt256', hre.ethers.MaxInt256);

  const approval = await usdt.approve(routerAddress, hre.ethers.MaxInt256);
  approval.wait();

  const approval2 = await usdc.approve(routerAddress, hre.ethers.MaxInt256);
  approval2.wait();

  const token0Amount = hre.ethers.parseUnits("100");
  const token1Amount = hre.ethers.parseUnits("100");

  // console.log('approval', approval);

  console.log('token0Amount', token0Amount);

  const deadline = Math.floor((Date.now() / 1000) * (10 * 60));

  console.log('deadline', deadline);

  const ownerAddress = await owner.getAddress()

  console.log('ownerAddress', ownerAddress);
  // console.log('hre.ethers.hexlify(100000000)', hre.ethers.MaxInt256);
  const gasLimit = 300000; // 숫자 값으로 gasLimit 정의
  const addLiquidityTx = await router
    .connect(owner)
    .addLiquidity(
      usdtAddress,
      usdcAddress,
      token0Amount,
      token1Amount,
      0,
      0,
      ownerAddress,
      deadline,
      { gasLimit: gasLimit }
    );
  await addLiquidityTx.wait();

  reserves = await pair.getReserves();
  console.log("reserves", reserves);


}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
