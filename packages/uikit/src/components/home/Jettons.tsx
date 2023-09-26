import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { JettonBalance, JettonsBalances } from '@tonkeeper/core/dist/tonApiV1';
import { Account } from '@tonkeeper/core/dist/tonApiV2';
import { TronBalances } from '@tonkeeper/core/dist/tronApi';
import { formatDecimals } from '@tonkeeper/core/dist/utils/balance';
import React, { FC, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Address } from 'ton-core';
import { useFormatBalance } from '../../hooks/balance';
import { useTranslation } from '../../hooks/translation';
import { AppRoute } from '../../libs/routes';
import { useFormatFiat, useRate } from '../../state/rates';
import { ListBlock, ListItem } from '../List';
import { ListItemPayload, TokenLayout, TokenLogo } from './TokenLayout';

export interface TonAssetData {
    info: Account;
    jettons: JettonsBalances;
}

export interface AssetData {
    ton: TonAssetData;
    tron: TronBalances;
}

export interface AssetProps {
    assets: AssetData;
}

const TonAsset: FC<{
    info: Account;
}> = ({ info }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const amount = useMemo(() => formatDecimals(info.balance), [info.balance]);
    const balance = useFormatBalance(amount);

    const { data } = useRate(CryptoCurrency.TON);
    const { fiatPrice, fiatAmount } = useFormatFiat(data, amount);

    return (
        <ListItem onClick={() => navigate(AppRoute.coins + '/ton')}>
            <ListItemPayload>
                <TokenLogo src="/img/toncoin.svg" />
                <TokenLayout
                    name={t('Toncoin')}
                    symbol={CryptoCurrency.TON}
                    balance={balance}
                    secondary={fiatPrice}
                    fiatAmount={fiatAmount}
                    rate={data}
                />
            </ListItemPayload>
        </ListItem>
    );
};

const JettonAsset: FC<{
    jetton: JettonBalance;
}> = ({ jetton }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [amount, address] = useMemo(
        () => [
            formatDecimals(jetton.balance, jetton.metadata?.decimals),
            Address.parse(jetton.jettonAddress).toString()
        ],
        [jetton]
    );
    const balance = useFormatBalance(amount, jetton.metadata?.decimals);

    const { data } = useRate(address);
    const { fiatPrice, fiatAmount } = useFormatFiat(data, amount);

    return (
        <ListItem
            onClick={() =>
                navigate(AppRoute.coins + `/${encodeURIComponent(jetton.jettonAddress)}`)
            }
        >
            <ListItemPayload>
                <TokenLogo src={jetton.metadata?.image} />
                <TokenLayout
                    name={jetton.metadata?.name ?? t('Unknown_COIN')}
                    symbol={jetton.metadata?.symbol}
                    balance={balance}
                    secondary={fiatPrice}
                    fiatAmount={fiatAmount}
                    rate={data}
                />
            </ListItemPayload>
        </ListItem>
    );
};

export const JettonList: FC<AssetProps> = ({
    assets: {
        ton: { info, jettons },
        tron: _tron
    }
}) => {
    return (
        <>
            <ListBlock noUserSelect>
                <TonAsset info={info} />
                {/* TODO: ENABLE TRON */}
                {/* <TronAssets tokens={tron} /> */}
            </ListBlock>
            <ListBlock noUserSelect>
                {jettons.balances.map(jetton => (
                    <JettonAsset key={jetton.jettonAddress} jetton={jetton} />
                ))}
            </ListBlock>
        </>
    );
};
