import { TransactionResponse } from '@ethersproject/providers';
import debug from 'debug';
import { NetworkChainID } from '../config/config-chain-ids';
import { createTransactionGasDetails } from '../fees/calculate-transaction-gas';
import { validateFee } from '../fees/fee-validator';
import {
  getEstimateGasDetails,
  calculateMaximumGas,
} from '../fees/gas-estimate';
import { executeTransaction } from './execute-transaction';
import { extractPackagedFeeFromTransaction } from './extract-packaged-fee';
import { deserializePopulatedTransaction } from './populated-transaction';

const dbg = debug('relayer:transact:validate');

export const processTransaction = async (
  chainID: NetworkChainID,
  feeCacheID: string,
  serializedTransaction: string,
): Promise<TransactionResponse> => {
  const populatedTransaction = deserializePopulatedTransaction(
    serializedTransaction,
  );

  const gasEstimateDetails = await getEstimateGasDetails(
    chainID,
    populatedTransaction,
  );

  const maximumGas = calculateMaximumGas(gasEstimateDetails);
  dbg('Maximum gas:', maximumGas);

  const { tokenAddress, packagedFeeAmount } =
    await extractPackagedFeeFromTransaction(chainID, populatedTransaction);
  validateFee(chainID, tokenAddress, maximumGas, feeCacheID, packagedFeeAmount);
  dbg('Fee validated:', packagedFeeAmount, tokenAddress);

  const transactionGasDetails = createTransactionGasDetails(
    chainID,
    gasEstimateDetails,
    tokenAddress,
    packagedFeeAmount,
  );
  dbg('Transaction gas details:', transactionGasDetails);

  return executeTransaction(
    chainID,
    populatedTransaction,
    transactionGasDetails,
  );
};
