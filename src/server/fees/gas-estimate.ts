import { TransactionRequest } from '@ethersproject/providers';
import { BigNumber } from 'ethers';
import { EVMGasType } from '../../models/network-models';
import { ErrorMessage } from '../../util/errors';
import { logger } from '../../util/logger';
import { throwErr } from '../../util/promise-utils';
import { NetworkChainID } from '../config/config-chain-ids';
import { getProviderForNetwork } from '../providers/active-network-providers';
import { getStandardGasDetails } from './gas-by-speed';

export type TransactionGasDetails =
  | TransactionGasDetailsType0
  | TransactionGasDetailsType2;

export type TransactionGasDetailsType0 = {
  evmGasType: EVMGasType.Type0;
  gasEstimate: BigNumber;
  gasPrice: BigNumber;
};

export type TransactionGasDetailsType2 = {
  evmGasType: EVMGasType.Type2;
  gasEstimate: BigNumber;
  maxFeePerGas: BigNumber;
  maxPriorityFeePerGas: BigNumber;
};

export const getEstimateGasDetails = async (
  chainID: NetworkChainID,
  transactionRequest: TransactionRequest,
  devLog?: boolean,
): Promise<TransactionGasDetails> => {
  try {
    const provider = getProviderForNetwork(chainID);
    const [gasEstimate, gasDetailsBySpeed] = await Promise.all([
      provider.estimateGas(transactionRequest).catch(throwErr),
      getStandardGasDetails(chainID),
    ]);

    return { gasEstimate, ...gasDetailsBySpeed };
  } catch (err) {
    logger.error(err);
    if (devLog) {
      throw new Error(err);
    }
    throw new Error(ErrorMessage.GAS_ESTIMATE_ERROR);
  }
};

export const calculateGasLimit = (gasEstimate: BigNumber): BigNumber => {
  // Gas Limit: Add 20% to gas estimate.
  return gasEstimate.mul(12000).div(10000);
};

const getGasPrice = (gasDetails: TransactionGasDetails) => {
  switch (gasDetails.evmGasType) {
    case EVMGasType.Type0: {
      return gasDetails.gasPrice;
    }
    case EVMGasType.Type2: {
      const { maxFeePerGas, maxPriorityFeePerGas } = gasDetails;
      return maxFeePerGas.add(maxPriorityFeePerGas);
    }
  }
  throw new Error('Unrecognized gas type.');
};

export const calculateTotalGas = (
  transactionGasDetails: TransactionGasDetails,
) => {
  const gasPrice = getGasPrice(transactionGasDetails);
  const { gasEstimate } = transactionGasDetails;
  return gasEstimate.mul(gasPrice);
};

export const calculateMaximumGas = (
  transactionGasDetails: TransactionGasDetails,
): BigNumber => {
  const gasPrice = getGasPrice(transactionGasDetails);
  const { gasEstimate } = transactionGasDetails;
  return calculateGasLimit(gasEstimate).mul(gasPrice);
};
