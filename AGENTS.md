# AGENTS.md

Welcome to the `hbar-streampay` repository. This file serves as instructions for any AI coding agents (such as Antigravity, GitHub Copilot Workspace, or Devin) that operate in this repository.

## Hedera Context
1. **Hedera Skills:** Before touching Hedera code, you must read the installed `hedera-skills` located in this repository (e.g., `system-contracts`, `native-services-js`). Do not write Hedera integration code from memory.
2. **HTS Association:** On Hedera, HTS tokens (like USDC or WHBAR) must be explicitly associated with an account before that account can receive them. The `system-contracts` skill explains this precompile interaction.
3. **Decimals:** Token decimals are specific to the asset. Hedera `msg.value` uses 8 decimals (tinybars). USDC uses 6. Do not assume 18.

## Security & Workflow
1. **Mock Router Tests:** Always run the `PayrollVault.test.ts` test suite against the local `MockRouter.sol` before pushing contract changes.
2. **No Secrets:** Never commit `.env` files. Ensure private keys are loaded via environment variables only.
3. **No AI-slop Prose:** Avoid generic filler words like "seamless", "revolutionize", "delve", "cutting-edge". Write plainly.
4. **Scaffold-HBAR CLI Compatibility:** Do not write bare `npm <command>` strings in the README. The `create-scaffold-hbar` CLI replaces these strings automatically. Write `yarn <command>` or `npm run <command>` instead. The script `scripts/check-scaffold-text.mjs` enforces this.

## Gate Verification
After any change that touches `template.json`, the workspace layout, or root scripts, you must execute the scaffold gate verification check locally to ensure the template still builds cleanly when cloned.
