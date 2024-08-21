# PAPI Actions

This is a proof-of-concept for an intent system to simplify common use cases when interacting with blockchains.

This will be a series of intents, a routing system that uniquely identifies one action to be performed, which can be implemented by dApps or extensions.

The idea is that anyone can "Create an action", which is serialised into a route, and then this route can be shared to other peers. A dApp implementation that supports that intent can then perform the action based on the user's state.

As an example, the `send` action defines the intent of sending a specified amount of a specific token to an address of a chain, through the route `/send/${chain}/${address}?amount=${amount}&token=${token}`.

When a user opens this route with a dApp that supports this intent, the dApp should look at the user's accounts, find where it has balances throughout the addresses and offer the user the choice of where the tokens should come from. It can then hide all the complexity of whether the `send` action is executed as a `Balances.transfer_keep_alive`, `XcmPallet.teleport_assets` or `XcmPallet.reserve_transfer_assets`, as it's not necessarily something a user needs to be familiar with in order to complete the action.

The intent system is completely independent from the dApp implementation though. There could be dApps that target more technically-experienced users, and dApps which are more user-friendly.

## Getting started

To run the demo of this PoC, you need NodeJS and pnpm installed, then run the following commands:

```sh
pnpm i
pnpm vite dev
```

You can now open the address vite is listening with your browser of choice. You can set the route in the URL for some example actions:

- Send 3 WND to a `westend` account: `/send/westend/5FxrUu1PUugUYs6HQ83bDswjGLyHYTEzm7yqmrkKVPaYe71Y?amount=3&token=WND`
- Delegate vote to an account in `polkadot`: `/delegate/polkadot/13EyMuuDHwtq5RD6w3psCJ9WvJFZzDDion6Fd2FVAqxz1g7K`

You can also create your own actions from the landing page of the dApp.

## License

MIT - Refer to [LICENSE](https://github.com/polkadot-api/web3-blockspace-actions/blob/main/LICENSE)
