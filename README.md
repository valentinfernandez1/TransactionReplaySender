# StoreTransaction Sender

Used with the `evm-tx-replay` pallet to perform transaction replay migration into a substrate chain. It sends all the transactions from the old chain to the new chain. All the transactions are stored in a mongoDB collection.

### Configuration

Inside `config.json` some values can be customized

```json
{
  "poolBuffer": 20, //Amount of space to leave in the pool to avoid filling it
  "poolLimit": 5000, //Limit set in the receiving chain
  "startingIndex": 0, //starting transaction number to send in case the script stops
  "timeout": 6000 //Time between transaction pool checks
}
```

Also inside a `.env` file the following values are needed

```
CHAIN_URL = #Receiving blockchain
MONGO_URL = #MongoDB collection where the txs are stored
```
