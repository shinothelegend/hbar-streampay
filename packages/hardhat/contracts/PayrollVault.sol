// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./interfaces/IERC20Minimal.sol";
import "./interfaces/ISaucerSwapV1Router.sol";
import "./interfaces/IHRC719.sol";

contract PayrollVault {
    error NotEmployer();
    error NotEmployee();
    error InvalidAmount();
    error InvalidDuration();
    error InvalidRate();
    error InvalidAddress();
    error PlanAlreadyCancelled();
    error PlanNotActive();
    error NothingAccrued();
    error SlippageExceeded();
    error AssociationFailed();
    error TransferFailed();

    struct Plan {
        address employer;
        address employee;
        address token;
        uint96 ratePerSec;
        uint64 startTime;
        uint64 endTime;
        uint256 funded;
        uint256 claimed;
        bool cancelled;
    }

    uint256 public nextPlanId;
    mapping(uint256 => Plan) public plans;

    address public immutable WHBAR;
    ISaucerSwapV1Router public immutable saucerSwapRouter;

    event PlanCreated(uint256 indexed planId, address indexed employer, address indexed employee, address token, uint96 ratePerSec, uint64 duration);
    event Funded(uint256 indexed planId, uint256 amount);
    event Claimed(uint256 indexed planId, address indexed employee, uint256 amount, bool swapped, uint256 hbarOut);
    event Cancelled(uint256 indexed planId, uint256 refundAmount);

    constructor(address _saucerSwapRouter, address _whbar) {
        if (_saucerSwapRouter == address(0) || _whbar == address(0)) revert InvalidAddress();
        saucerSwapRouter = ISaucerSwapV1Router(_saucerSwapRouter);
        WHBAR = _whbar;
    }

    function associateToken(address token) external {
        (bool success, bytes memory result) = token.call(abi.encodeWithSelector(IHRC719.associate.selector));
        if (success && result.length > 0) {
            uint256 responseCode = abi.decode(result, (uint256));
            // 22: SUCCESS, 194: TOKEN_ALREADY_ASSOCIATED
            if (responseCode != 22 && responseCode != 194) {
                revert AssociationFailed();
            }
        } else {
            // Some tokens might not be HTS tokens (like mocks in testing)
            // so we don't strictly revert if the call fails, we just assume it's an ERC20
        }
    }

    function createPlan(address employee, address token, uint96 ratePerSec, uint64 duration) external returns (uint256 planId) {
        if (employee == address(0) || token == address(0)) revert InvalidAddress();
        if (ratePerSec == 0) revert InvalidRate();
        if (duration == 0) revert InvalidDuration();

        planId = nextPlanId++;
        
        Plan storage plan = plans[planId];
        plan.employer = msg.sender;
        plan.employee = employee;
        plan.token = token;
        plan.ratePerSec = ratePerSec;
        
        // Start time is not set until funded? Or set now? 
        // Let's set startTime and endTime when created.
        plan.startTime = uint64(block.timestamp);
        plan.endTime = uint64(block.timestamp) + duration;
        plan.cancelled = false;

        emit PlanCreated(planId, msg.sender, employee, token, ratePerSec, duration);
    }

    function fundPlan(uint256 planId, uint256 amount) external {
        if (amount == 0) revert InvalidAmount();
        Plan storage plan = plans[planId];
        if (plan.employer != msg.sender) revert NotEmployer();
        if (plan.cancelled) revert PlanAlreadyCancelled();

        plan.funded += amount;

        bool success = IERC20Minimal(plan.token).transferFrom(msg.sender, address(this), amount);
        if (!success) revert TransferFailed();

        emit Funded(planId, amount);
    }

    function accrued(uint256 planId) public view returns (uint256 claimable, uint256 vested) {
        Plan memory plan = plans[planId];
        if (plan.employer == address(0)) return (0, 0);

        uint256 currentTimestamp = block.timestamp;
        if (plan.cancelled) {
            currentTimestamp = plan.endTime;
        } else if (currentTimestamp > plan.endTime) {
            currentTimestamp = plan.endTime;
        }

        uint256 elapsed = currentTimestamp > plan.startTime ? currentTimestamp - plan.startTime : 0;
        vested = uint256(plan.ratePerSec) * elapsed;

        if (vested > plan.funded) {
            vested = plan.funded;
        }

        claimable = vested > plan.claimed ? vested - plan.claimed : 0;
    }

    function claim(uint256 planId, bool swapToHBAR, uint256 amountOutMin) external {
        Plan storage plan = plans[planId];
        if (plan.employee != msg.sender) revert NotEmployee();

        (uint256 claimableAmount, ) = accrued(planId);
        if (claimableAmount == 0) revert NothingAccrued();

        // Update state before external call
        plan.claimed += claimableAmount;

        uint256 hbarOut = 0;

        if (swapToHBAR) {
            address[] memory path = new address[](2);
            path[0] = plan.token;
            path[1] = WHBAR;

            // Approve router
            IERC20Minimal(plan.token).approve(address(saucerSwapRouter), claimableAmount);

            uint256[] memory amounts = saucerSwapRouter.swapExactTokensForETH(
                claimableAmount,
                amountOutMin,
                path,
                msg.sender,
                block.timestamp + 120 // 2 minutes deadline
            );
            hbarOut = amounts[1];
            
            // Clear allowance
            IERC20Minimal(plan.token).approve(address(saucerSwapRouter), 0);
        } else {
            bool success = IERC20Minimal(plan.token).transfer(msg.sender, claimableAmount);
            if (!success) revert TransferFailed();
        }

        emit Claimed(planId, msg.sender, claimableAmount, swapToHBAR, hbarOut);
    }

    function cancelPlan(uint256 planId) external {
        Plan storage plan = plans[planId];
        if (plan.employer != msg.sender) revert NotEmployer();
        if (plan.cancelled) revert PlanAlreadyCancelled();

        (, uint256 vested) = accrued(planId);

        uint256 unvested = 0;
        if (plan.funded > vested) {
            unvested = plan.funded - vested;
        }

        plan.cancelled = true;
        plan.endTime = uint64(block.timestamp);
        plan.funded = vested; // Cap funding at vested amount so no more can be claimed

        if (unvested > 0) {
            bool success = IERC20Minimal(plan.token).transfer(msg.sender, unvested);
            if (!success) revert TransferFailed();
        }

        emit Cancelled(planId, unvested);
    }
}
