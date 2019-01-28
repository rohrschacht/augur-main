import { NetworkId } from 'augur-artifacts';
import { Provider, Log, Filter, LogValues } from 'augur-api';
import { Transaction } from 'contract-dependencies';
import { EthersProvider as EProvider, EthersSigner} from 'contract-dependencies-ethers';
import { ethers } from 'ethers'
import { Abi } from 'ethereum';
import * as _ from "lodash";

interface ContractMapping {
    [contractName: string]: ethers.utils.Interface;
}

export class EthersProvider extends ethers.providers.JsonRpcProvider implements Provider, EProvider {
    private contractMapping: ContractMapping = {};

    public async call(transaction: Transaction<ethers.utils.BigNumber>): Promise<string> {
        return await super.call(transaction);
    }

    public async getNetworkId(): Promise<NetworkId> {
        return <NetworkId>(await this.getNetwork()).chainId.toString();
    }

    public async getBlockNumber(): Promise<number> {
        return await super.getBlockNumber();
    }

    public storeAbiData(abi: Abi, contractName: string): void {
        this.contractMapping[contractName] = new ethers.utils.Interface(abi);
    }

    public getEventTopic(contractName: string, eventName: string): string {
        const contractInterface = this.contractMapping[contractName];
        if (!contractInterface) {
            throw new Error(`Contract name ${contractName} not found in EthersJSProvider. Call 'storeAbiData' first with this name and the contract abi`);
        }
        return contractInterface.events[eventName].topic;
    }

    public parseLogValues(contractName: string, log: Log): LogValues {
        const contractInterface = this.contractMapping[contractName];
        if (!contractInterface) {
            throw new Error(`Contract name ${contractName} not found in EthersJSProvider. Call 'storeAbiData' first with this name and the contract abi`);
        }
        return contractInterface.parseLog(log);
    }

    public async getLogs(filter: Filter): Promise<Array<Log>> {
        return super.getLogs(filter);
    }
}
