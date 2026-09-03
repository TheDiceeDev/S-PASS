# S-PASS (StakePass)

S-PASS (StakePass) is a blockchain-based event attendance and incentive platform built on Avalanche Fuji. It uses refundable attendee stakes and smart-contract-based rewards to encourage event attendance and provide transparent reward distribution.

## Features
- React + TypeScript frontend
- Solidity smart contracts on Avalanche Fuji
- Wallet connection and event management
- Attendee registration with refundable staking
- QR-based event check-in
- Automatic stake refunds for checked-in attendees
- No-show stake redistribution
- Sponsor-funded attendee rewards
- Organizer, attendee, and sponsor workflows

## Smart contracts

The core blockchain logic is implemented in Solidity under `contracts/`.

The contracts handle event management, attendee registration and staking, attendance verification, refunds, no-show redistribution, and sponsor rewards.

## Local development

1. Install dependencies:

   `npm install`

2. Start the frontend:

   `npm run dev`

3. Compile the smart contracts:

   `npm run compile`

4. Run the smart contract tests:

   `npm test`

5. Build the production frontend:

   `npm run build`

## Environment variables

For local blockchain deployment, create a `.env` file containing the required Avalanche Fuji configuration:

- `AVALANCHE_FUJI_RPC_URL`
- `PRIVATE_KEY`

**Never commit your `.env` file, private key, or seed phrase to GitHub.**

## Demo flow

1. Connect a wallet.
2. Create or select an event.
3. Register for the event and stake the required amount.
4. Check in using the event QR code.
5. Receive the applicable stake refund after successful check-in.
6. Organizers can review attendee attendance.
7. Sponsors can fund and distribute rewards.
