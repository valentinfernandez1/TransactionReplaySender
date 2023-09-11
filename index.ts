import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { testData } from './src/utils/test-data';
import connectWithRetry from './src/utils/mongodb';
import { migrationWorker } from './src/migrationWorker';
import { I_Transaction } from 'utils/interfaces';
import { Option, Text, Enum } from '@polkadot/types';

require('dotenv').config();

const CHAIN_URL = process.env.CHAIN_URL || 'ws://localhost:9933';
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const PERMISSIONED_AUTHORITY = process.env.PERMISSIONED_AUTHORITY;

const main = async () => {
    if (!PERMISSIONED_AUTHORITY) {
        console.log('No permissioned authority account was provided');
        process.exit(0);
    }

    //Initial setup
    const wsProvider = new WsProvider(CHAIN_URL);
    const api: ApiPromise = await ApiPromise.create({ provider: wsProvider });

    const keyring = new Keyring({ type: 'ethereum' });
    const authorityAccount = keyring.addFromUri(PERMISSIONED_AUTHORITY);
    const authorityNonce = (
        await api.rpc.system.accountNextIndex(authorityAccount.address)
    ).toNumber();

    //Connect to mongoDB and start transactionSender script
    await connectWithRetry(MONGO_URL, async () => {
        try {
            await migrationWorker(api, authorityAccount, authorityNonce);
        } catch (error) {
            console.log(error);
        }
    });
};

main();
