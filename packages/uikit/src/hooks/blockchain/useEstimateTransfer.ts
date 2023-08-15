import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Asset, isTonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/asset';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { TronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/tron-asset';
import {
    RecipientData,
    TonRecipientData,
    TransferEstimation
} from '@tonkeeper/core/dist/entries/send';
import { WalletState } from '@tonkeeper/core/dist/entries/wallet';
import { estimateJettonTransfer } from '@tonkeeper/core/dist/service/transfer/jettonService';
import { estimateTonTransfer } from '@tonkeeper/core/dist/service/transfer/tonService';
import { estimateTron } from '@tonkeeper/core/dist/service/tron/tronTransferService';
import { Configuration, JettonsBalances } from '@tonkeeper/core/dist/tonApiV1';
import { Address } from 'ton-core';
import { notifyError } from '../../components/transfer/common';
import { QueryKey } from '../../libs/queryKey';
import { DefaultRefetchInterval } from '../../state/tonendpoint';
import { useTronBalances } from '../../state/tron/tron';
import { useWalletJettonList } from '../../state/wallet';
import { useAppContext, useWalletContext } from '../appContext';
import { useAppSdk } from '../appSdk';
import { useTranslation } from '../translation';

async function estimateTon({
    recipient,
    amount,
    isMax,
    tonApi,
    wallet,
    jettons
}: {
    recipient: RecipientData;
    amount: AssetAmount<TonAsset>;
    isMax: boolean;
    tonApi: Configuration;
    wallet: WalletState;
    jettons: JettonsBalances | undefined;
}): Promise<TransferEstimation<TonAsset>> {
    let payload;
    if (amount.asset.id === TON_ASSET.id) {
        payload = await estimateTonTransfer(
            tonApi,
            wallet,
            recipient as TonRecipientData,
            amount.weiAmount,
            isMax
        );
    } else {
        const jettonInfo = jettons!.balances.find(
            jetton => (amount.asset.address as Address).toRawString() === jetton.jettonAddress
        )!;
        payload = await estimateJettonTransfer(
            tonApi,
            wallet,
            recipient as TonRecipientData,
            amount as AssetAmount<TonAsset>,
            jettonInfo.walletAddress.address
        );
    }

    const fee = new AssetAmount({ asset: TON_ASSET, weiAmount: payload.total });
    return { fee, payload };
}

export function useEstimateTransfer(
    recipient: RecipientData,
    amount: AssetAmount<Asset>,
    isMax: boolean
) {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { api } = useAppContext();
    const wallet = useWalletContext();
    const client = useQueryClient();
    const { data: jettons } = useWalletJettonList();
    const { data: balances } = useTronBalances();

    return useQuery<TransferEstimation<Asset>, Error>(
        [QueryKey.estimate, recipient, amount],
        async () => {
            try {
                if (isTonAsset(amount.asset)) {
                    return await estimateTon({
                        amount: amount as AssetAmount<TonAsset>,
                        tonApi: api.tonApi,
                        wallet,
                        recipient,
                        isMax,
                        jettons
                    });
                } else {
                    return await estimateTron({
                        amount: amount as AssetAmount<TronAsset>,
                        tronApi: api.tronApi,
                        wallet,
                        recipient,
                        isMax,
                        balances
                    });
                }
            } catch (e) {
                await notifyError(client, sdk, t, e);
                throw e;
            }
        },
        {
            refetchInterval: DefaultRefetchInterval,
            refetchOnMount: 'always'
        }
    );
}
