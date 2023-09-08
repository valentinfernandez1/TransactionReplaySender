import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { testData } from './src/utils/test-data';
import connectWithRetry from './src/utils/mongodb';
import { migrationWorker } from './src/migrationWorker';
import { I_Transaction } from 'utils/interfaces';
import { Option, Text, Enum } from '@polkadot/types';

require('dotenv').config();

const CHAIN_URL = process.env.CHAIN_URL || 'ws://localhost:9933';
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';

const main = async () => {
    //Initial setup
    const wsProvider = new WsProvider(CHAIN_URL);
    const api: ApiPromise = await ApiPromise.create({ provider: wsProvider });

    const keyring = new Keyring({ type: 'ethereum' });
    const sudoAccount = keyring.addFromUri(testData.SUDO_PRIVKEY);
    const sudoNonce = (await api.rpc.system.accountNextIndex(sudoAccount.address)).toNumber();

    //Connect to mongoDB and start transactionSender script
    await connectWithRetry(MONGO_URL, async () => {
        try {
            await migrationWorker(api, sudoAccount, sudoNonce);
        } catch (error) {
            console.log(error);
        }
    });
};

main();
