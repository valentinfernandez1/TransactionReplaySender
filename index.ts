import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { testData } from './src/utils/test-data';
import connectWithRetry from './src/utils/mongodb';
import { migrationWorker } from './src/migrationWorker';

require('dotenv').config();

const CHAIN_URL = process.env.CHAIN_URL || 'ws://localhost:9933';
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';

const main = async () => {
  //Initial setup
  const wsProvider = new WsProvider(CHAIN_URL);
  const api: ApiPromise = await ApiPromise.create({ provider: wsProvider });

  const keyring = new Keyring({ type: 'ethereum' });
  const sudoAccount = keyring.addFromUri(testData.SUDO_PRIVKEY);

  //Connect to mongoDB and start transactionSender script
  await connectWithRetry(MONGO_URL, async () => {
    try {
      await migrationWorker(api, sudoAccount);
    } catch (error) {
      console.log(error);
    }
  });
};

main();
