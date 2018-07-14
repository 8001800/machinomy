import * as Web3 from 'web3'
import * as BigNumber from 'bignumber.js'
import { TransactionResult } from 'truffle-contract'
import ChannelEthContract from './ChannelEthContract'
import ChannelTokenContract from './ChannelTokenContract'
import Signature from './Signature'
import ChannelId from './ChannelId'
import IChannelsDatabase from './storage/IChannelsDatabase'

export type Channel = [string, string, BigNumber.BigNumber, BigNumber.BigNumber, BigNumber.BigNumber]
export type ChannelWithTokenContract = [string, string, BigNumber.BigNumber, BigNumber.BigNumber, BigNumber.BigNumber, string]
export type ChannelFromContract = Channel | ChannelWithTokenContract

export default class ChannelContract {
  channelEthContract: ChannelEthContract
  channelTokenContract: ChannelTokenContract
  channelsDao: IChannelsDatabase

  constructor (web3: Web3, channelsDao: IChannelsDatabase, channelEthContract: ChannelEthContract, channelTokenContract: ChannelTokenContract) {
    this.channelEthContract = channelEthContract
    this.channelTokenContract = channelTokenContract
    this.channelsDao = channelsDao
  }

  async open (sender: string, receiver: string, price: BigNumber.BigNumber, settlementPeriod: number | BigNumber.BigNumber, channelId?: ChannelId | string, tokenContract?: string): Promise<TransactionResult> {
    if (this.isTokenContractDefined(tokenContract)) {
      return this.channelTokenContract.open(sender, receiver, price, settlementPeriod, tokenContract!, channelId)
    } else {
      return this.channelEthContract.open(sender, receiver, price, settlementPeriod, channelId)
    }
  }

  async claim (receiver: string, channelId: string, value: BigNumber.BigNumber, signature: Signature): Promise<TransactionResult> {
    const channel = await this.channelsDao.firstById(channelId)
    const tokenContract = channel!.contractAddress
    const contract = this.actualContract(tokenContract)
    return contract.claim(receiver, channelId, value, signature)
  }

  async deposit (sender: string, channelId: string, value: BigNumber.BigNumber, tokenContract?: string): Promise<TransactionResult> {
    const contract = this.actualContract(tokenContract)
    return contract.deposit(sender, channelId, value)
  }

  async getState (channelId: string): Promise<number> {
    const channel = await this.channelsDao.firstById(channelId)
    const tokenContract = channel!.contractAddress
    const contract = this.actualContract(tokenContract)
    return contract.getState(channelId)
  }

  async getSettlementPeriod (channelId: string): Promise<BigNumber.BigNumber> {
    const channel = await this.channelsDao.firstById(channelId)
    const tokenContract = channel!.contractAddress
    const contract = this.actualContract(tokenContract)
    return contract.getSettlementPeriod(channelId)
  }

  async startSettle (account: string, channelId: string): Promise<TransactionResult> {
    const channel = await this.channelsDao.firstById(channelId)
    const tokenContract = channel!.contractAddress
    const contract = this.actualContract(tokenContract)
    return contract.startSettle(account, channelId)
  }

  async finishSettle (account: string, channelId: string): Promise<TransactionResult> {
    const channel = await this.channelsDao.firstById(channelId)
    const tokenContract = channel!.contractAddress
    const contract = this.actualContract(tokenContract)
    return contract.finishSettle(account, channelId)
  }

  async paymentDigest (channelId: string, value: BigNumber.BigNumber): Promise<string> {
    const channel = await this.channelsDao.firstById(channelId)
    const tokenContract = channel!.contractAddress
    if (this.isTokenContractDefined(tokenContract)) {
      return this.channelTokenContract.paymentDigest(channelId, value, tokenContract)
    } else {
      return this.channelEthContract.paymentDigest(channelId, value)
    }
  }

  async canClaim (channelId: string, payment: BigNumber.BigNumber, receiver: string, signature: Signature) {
    const channel = await this.channelsDao.firstById(channelId)
    const tokenContract = channel!.contractAddress
    const contract = this.actualContract(tokenContract)
    return contract.canClaim(channelId, payment, receiver, signature)
  }

  async channelById (channelId: string): Promise<ChannelFromContract> {
    const channel = await this.channelsDao.firstById(channelId)
    const tokenContract = channel!.contractAddress
    const contract = this.actualContract(tokenContract)
    return contract.channelById(channelId)
  }

  setChannelsDAO (channelsDao: IChannelsDatabase) {
    this.channelsDao = channelsDao
  }

  isTokenContractDefined (tokenContract: string | undefined) {
    return tokenContract && tokenContract.startsWith('0x') && parseInt(tokenContract, 16) !== 0
  }

  actualContract (tokenContract?: string) {
    if (this.isTokenContractDefined(tokenContract)) {
      return this.channelTokenContract
    } else {
      return this.channelEthContract
    }
  }
}
