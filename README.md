# Flamingo

Flamingo is a premium, vibrant UI component library and design system showcase. It features interactive components, glassmorphism aesthetics, dark mode support, and an integrated Web3 connection stack to help you build stunning user interfaces.

## Features

- **Vibrant Flamingo Aesthetic**: Premium design tokens, custom HSL-tailored colors, and glassmorphism styling for a high-fidelity visual experience.
- **23+ Custom Components**: Fully styled interactive elements (Dialog, Dropdown Menu, Popover, Toast, Tabs, Table, etc.) with smooth Framer Motion micro-interactions.
- **Web3 Integration**: Pre-configured **RainbowKit** connection buttons, **Wagmi**, and **Viem** workspace integrations out of the box.
- **Dynamic Light & Dark Theme**: Persistent global theme toggles managed via Zustand that instantly map custom CSS variables.
- **Completely Type-Safe**: Full TypeScript coverage with file-based client-side routing via **TanStack Router**.
- **Modern Quality Tooling**: Fast formatting, linting, and quality checks managed via **Biome**.

## Tech Stack

- React 19 + TypeScript + Vite
- TanStack Router (file-based routing)
- Zustand (persistent state management)
- Tailwind CSS v4 (using CSS-based configuration variables)
- wagmi + viem + RainbowKit (Web3 wallet connection framework)
- Framer Motion (buttery smooth layout transitions and micro-interactions)
- Biome (100% clean and fast linter & formatter)

## Installation

Follow these steps to run the project locally:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/shinnodua/call3.git
   cd call3
   ```

2. **Install dependencies**:
   ```bash
   bun install
   ```

3. **Start the development server**:
   ```bash
   bun run dev
   ```

4. **Verify and build for production**:
   ```bash
   bun run lint       # Run Biome quality checks
   bun run lint:fix   # Auto-fix linting and formatting issues
   bun run build      # Build the production bundle
   ```
