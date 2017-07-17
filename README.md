This script was used to update the ETH/USD exchange rate during the Moeda fundraiser. It uses a volume weighted average of prices across Bitfinex, Gemini, GDAX and Kraken.

With the current settings it will update the contract ETH/USD rate about every 2 hours.

### Install

```
yarn
```

### Running

```
CONTRACT_ADDRESS=foo ACCOUNT_PASSWORD=bar OWNER_ADDRESS=baz yarn start
```

Where `CONTRACT_ADDRESS` is the Moeda fundraiser contract, `OWNER_ADDRES` is the address of the account that deployed the contract and `ACCOUNT_PASSWORD` is the password of that account.


### Running tests

```
yarn test
```
