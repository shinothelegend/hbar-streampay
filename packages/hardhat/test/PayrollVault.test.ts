import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { PayrollVault, MockERC20, MockRouter } from "../typechain-types";

describe("PayrollVault", function () {
  let vault: PayrollVault;
  let mockToken: MockERC20;
  let mockRouter: MockRouter;
  let employer: any;
  let employee: any;
  let other: any;

  beforeEach(async function () {
    [employer, employee, other] = await ethers.getSigners();

    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20Factory.deploy();

    const MockRouterFactory = await ethers.getContractFactory("MockRouter");
    mockRouter = await MockRouterFactory.deploy();

    // Fund mock router with ETH so it can simulate swap output
    await employer.sendTransaction({
      to: await mockRouter.getAddress(),
      value: ethers.parseEther("10"),
    });

    const VaultFactory = await ethers.getContractFactory("PayrollVault");
    vault = await VaultFactory.deploy(await mockRouter.getAddress(), await mockToken.getAddress());
  });

  it("should associate token successfully", async function () {
    await expect(vault.associateToken(await mockToken.getAddress())).to.not.be.reverted;
  });

  describe("Plan Creation", function () {
    it("should allow employer to create a plan", async function () {
      await expect(vault.connect(employer).createPlan(employee.address, await mockToken.getAddress(), 1, 100)).to.emit(
        vault,
        "PlanCreated",
      );

      const plan = await vault.plans(0);
      expect(plan.employer).to.equal(employer.address);
      expect(plan.employee).to.equal(employee.address);
      expect(plan.ratePerSec).to.equal(1n);
    });

    it("should revert if rate or duration is zero", async function () {
      await expect(
        vault.connect(employer).createPlan(employee.address, await mockToken.getAddress(), 0, 100),
      ).to.be.revertedWithCustomError(vault, "InvalidRate");

      await expect(
        vault.connect(employer).createPlan(employee.address, await mockToken.getAddress(), 1, 0),
      ).to.be.revertedWithCustomError(vault, "InvalidDuration");
    });
  });

  describe("Funding", function () {
    beforeEach(async function () {
      await vault.connect(employer).createPlan(employee.address, await mockToken.getAddress(), 1, 100);
      await mockToken.connect(employer).approve(await vault.getAddress(), 1000);
    });

    it("should allow employer-only funding", async function () {
      await expect(vault.connect(other).fundPlan(0, 100)).to.be.revertedWithCustomError(vault, "NotEmployer");
      await expect(vault.connect(employer).fundPlan(0, 100)).to.emit(vault, "Funded").withArgs(0, 100);
      const plan = await vault.plans(0);
      expect(plan.funded).to.equal(100n);
    });
  });

  describe("Accrual and Claiming", function () {
    let startTimestamp: number;

    beforeEach(async function () {
      await vault.connect(employer).createPlan(employee.address, await mockToken.getAddress(), 1, 100);
      const plan = await vault.plans(0);
      startTimestamp = Number(plan.startTime);
      await mockToken.connect(employer).approve(await vault.getAddress(), 1000);
      await vault.connect(employer).fundPlan(0, 100);
    });

    it("accrues linearly", async function () {
      await time.setNextBlockTimestamp(startTimestamp + 20);
      await ethers.provider.send("evm_mine", []); // force mine at exactly +20s

      const [claimable, vested] = await vault.accrued(0);
      expect(claimable).to.equal(20n);
      expect(vested).to.equal(20n);
    });

    it("NothingAccrued when no salary is vested", async function () {
      // time hasn't passed since funding (or only 1s), let's ensure no time passed
      // Actually since createPlan to now is ~2s, it has accrued 2.
      // We should test by creating a plan in the future or checking specifically.
      // If we claim now, we claim 2. Let's just create a new plan with 0 elapsed.
      await vault.connect(employer).createPlan(employee.address, await mockToken.getAddress(), 1, 100);
      await expect(vault.connect(employee).claim(1, false, 0)).to.be.revertedWithCustomError(vault, "NothingAccrued");
    });

    it("vested amount is capped by funded amount", async function () {
      await time.setNextBlockTimestamp(startTimestamp + 200);
      await ethers.provider.send("evm_mine", []);

      const [claimable, vested] = await vault.accrued(0);
      expect(claimable).to.equal(100n);
      expect(vested).to.equal(100n);
    });

    it("claimable equals vested minus already claimed", async function () {
      await time.setNextBlockTimestamp(startTimestamp + 60);
      await vault.connect(employee).claim(0, false, 0); // claims 60

      const plan = await vault.plans(0);
      expect(plan.claimed).to.equal(60n);

      const [claimable1] = await vault.accrued(0);
      expect(claimable1).to.equal(0n);

      await time.setNextBlockTimestamp(startTimestamp + 80);
      await ethers.provider.send("evm_mine", []);
      const [claimable2, vested2] = await vault.accrued(0);
      expect(vested2).to.equal(80n);
      expect(claimable2).to.equal(20n);
    });

    it("claim after endTime drains only remaining vested salary", async function () {
      await time.setNextBlockTimestamp(startTimestamp + 150);
      await vault.connect(employee).claim(0, false, 0); // drains 100

      const plan = await vault.plans(0);
      expect(plan.claimed).to.equal(100n);

      await expect(vault.connect(employee).claim(0, false, 0)).to.be.revertedWithCustomError(vault, "NothingAccrued");
    });

    it("employee-only claims and unauthorized claim fails", async function () {
      await time.setNextBlockTimestamp(startTimestamp + 10);
      await ethers.provider.send("evm_mine", []);
      await expect(vault.connect(employer).claim(0, false, 0)).to.be.revertedWithCustomError(vault, "NotEmployee");
      await expect(vault.connect(other).claim(0, false, 0)).to.be.revertedWithCustomError(vault, "NotEmployee");
    });

    it("successful stable-token claim", async function () {
      await time.setNextBlockTimestamp(startTimestamp + 50);
      const balanceBefore = await mockToken.balanceOf(employee.address);
      await vault.connect(employee).claim(0, false, 0); // claims 50
      const balanceAfter = await mockToken.balanceOf(employee.address);
      expect(balanceAfter - balanceBefore).to.equal(50n);
    });

    it("successful HBAR swap through MockRouter", async function () {
      await time.setNextBlockTimestamp(startTimestamp + 50);
      const hbarBefore = await ethers.provider.getBalance(employee.address);

      const tx = await vault.connect(employee).claim(0, true, 50);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const hbarAfter = await ethers.provider.getBalance(employee.address);
      expect(hbarAfter - hbarBefore + gasUsed).to.equal(50n);

      const allowance = await mockToken.allowances(await vault.getAddress(), await mockRouter.getAddress());
      expect(allowance).to.equal(0n);
    });

    it("amountOutMin above quote reverts", async function () {
      await time.setNextBlockTimestamp(startTimestamp + 50);
      await ethers.provider.send("evm_mine", []);
      await expect(vault.connect(employee).claim(0, true, 100)).to.be.revertedWith(
        "MockRouter: insufficient output amount",
      );
    });

    it("re-adding funds after partial claim preserves correct accounting", async function () {
      await vault.connect(employer).fundPlan(0, 100); // Now funded is 200
      await time.setNextBlockTimestamp(startTimestamp + 60);
      await vault.connect(employee).claim(0, false, 0); // claimed 60

      await time.setNextBlockTimestamp(startTimestamp + 120);
      await ethers.provider.send("evm_mine", []);
      // duration is 100, so max vested is 100.
      const [claimable, vested] = await vault.accrued(0);
      expect(vested).to.equal(100n);
      expect(claimable).to.equal(40n);
    });
  });

  describe("Cancellation", function () {
    let startTimestamp: number;

    beforeEach(async function () {
      await vault.connect(employer).createPlan(employee.address, await mockToken.getAddress(), 1, 100);
      const plan = await vault.plans(0);
      startTimestamp = Number(plan.startTime);
      await mockToken.connect(employer).approve(await vault.getAddress(), 1000);
      await vault.connect(employer).fundPlan(0, 100);
    });

    it("employer-only cancellation", async function () {
      await expect(vault.connect(employee).cancelPlan(0)).to.be.revertedWithCustomError(vault, "NotEmployer");
      await expect(vault.connect(other).cancelPlan(0)).to.be.revertedWithCustomError(vault, "NotEmployer");
    });

    it("cancellation refunds only unvested principal", async function () {
      await time.setNextBlockTimestamp(startTimestamp + 40);
      const balanceBefore = await mockToken.balanceOf(employer.address);

      await vault.connect(employer).cancelPlan(0); // cancelled exactly at +40

      const balanceAfter = await mockToken.balanceOf(employer.address);
      // funded is 100, vested is 40. refunded is 60.
      expect(balanceAfter - balanceBefore).to.equal(60n);

      const plan = await vault.plans(0);
      expect(plan.cancelled).to.equal(true);
      expect(plan.funded).to.equal(40n);
    });

    it("vested-but-unclaimed salary remains claimable after cancellation", async function () {
      await time.setNextBlockTimestamp(startTimestamp + 40);
      await vault.connect(employer).cancelPlan(0);

      await time.setNextBlockTimestamp(startTimestamp + 90);
      await ethers.provider.send("evm_mine", []);

      const [claimable, vested] = await vault.accrued(0);
      expect(vested).to.equal(40n);
      expect(claimable).to.equal(40n);

      await expect(vault.connect(employee).claim(0, false, 0)).to.emit(vault, "Claimed");
    });
  });
});
