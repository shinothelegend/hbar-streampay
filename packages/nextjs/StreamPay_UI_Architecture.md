# StreamPay UI Architecture & Design Plan

## Subject Matter & Core Concept

**StreamPay** is a non-custodial on-chain payroll streaming application on the Hedera network.
It visually represents the continuous, real-time flow of funds (salary) from an employer to an employee.
The core aesthetic should feel robust, precise, fluid, and financial-grade, while maintaining a futuristic and lightweight edge.

## 1. Palette & Theme (Adapting Scaffold-HBAR)

We will leverage the existing Scaffold-HBAR base but refine the semantics for a streaming interface:

- **Base Background (Dark)**: `#11151d` to `#181c27` (Deep charcoal space)
- **Base Text (Light)**: `#f0f0f2` (Crisp readability)
- **Primary Accent (Hedera Violet/Ultraviolet)**: `#8259ef` (Used for actions, buttons, and active states)
- **Success/Streaming**: `#34eeb6` (Emerald/Mint green to indicate live, ticking value)
- **Stopped/Cancelled**: `#ff8863` (Coral/Rose for inactive or cancelled streams)

## 2. Typography

- **Primary UI & Headings**: _Styrene A Web_ (provided by Scaffold-HBAR) for structural layout and buttons.
- **Numbers & Balances**: _JetBrains Mono_ or _Space Grotesk_ (or falling back to tabular nums in Styrene). Continuous ticking balances demand a monospace-like treatment so the numbers don't jitter horizontally.

## 3. Layout Concept

A focused, single-purpose dashboard architecture.

- **Top Navigation**: Minimal. Logo (left), Wallet Connection (right), and simple toggle between Employer/Employee views.
- **Main View**: Center-aligned. Max width `1200px`.
  - **Hero Section**: Large typography showing Total Vested or Total Active Streams.
  - **Stream Cards**: Wide, horizontal rows (not identical SaaS squares). Each row represents a stream, featuring a real-time progress bar filling horizontally, and a ticking counter of the accrued balance.

### ASCII Wireframe (Employee View)

```text
[ Logo: StreamPay ]                                  [ Connect Wallet ]
-----------------------------------------------------------------------

    Your Active Salary Stream
    ----------------------------------------------------------
    employer.hbar                                   $ 1,234.56

    [===================================>                    ]

    Rate: 100 USDC / day                        [ Claim Salary ]
    ----------------------------------------------------------
```

## 4. Principles & Motion (Framer Motion)

1. **Time is Money**: The interface must visibly tick upwards. The accrued amount shouldn't require a page refresh; it should calculate client-side every 100ms.
2. **Smooth Flow**: Use `framer-motion` for layout transitions (e.g., expanding a stream row to show more details) and the progress bar. Avoid bouncy or silly animations. Use linear or gentle ease-out transitions to reflect the steady flow of time.
3. **Unmistakable States**: Active streams pulse gently or have a bright green indicator. Cancelled streams turn grey/coral and stop ticking immediately.

## 5. Review Against Defaults

_Is this a standard SaaS template?_
No. By prioritizing wide horizontal rows, real-time ticking numbers with tabular figures, and a dedicated emphasis on progress bars over standard stat cards, the layout serves the specific purpose of _streaming_. The use of the Hedera ultraviolet gradient gives it network-specific identity.
