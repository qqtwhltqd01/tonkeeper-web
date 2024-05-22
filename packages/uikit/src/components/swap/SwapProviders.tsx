import { styled } from 'styled-components';
import { Body3, Label2 } from '../Text';
import { FC } from 'react';
import { useCalculatedSwap } from '../../state/swap/useCalculatedSwap';
import { useFormatFiat, useRate } from '../../state/rates';
import { tonAssetAddressToString } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import {
    useIsSwapFormNotCompleted,
    useSelectedSwap,
    useSwapToAsset
} from '../../state/swap/useSwapForm';
import { Skeleton } from '../shared/Skeleton';
import BigNumber from 'bignumber.js';

const SwapProvidersContainer = styled.div`
    width: 292px;
    padding: 0 12px 12px;
    background: ${p => p.theme.backgroundContent};
    border-radius: ${p =>
        p.theme.displayType === 'full-width' ? p.theme.corner2xSmall : p.theme.cornerSmall};
    height: fit-content;
`;

const Heading = styled.div`
    color: ${p => p.theme.textSecondary};
    padding: 10px 0;
`;

export const SwapProviders = () => {
    const isNotCompleted = useIsSwapFormNotCompleted();

    if (isNotCompleted) {
        return null;
    }

    return (
        <SwapProvidersContainer>
            <Heading>
                <Body3>Provider</Body3>
            </Heading>
            <ProviderCard provider="stonfi" />
            <ProviderCard provider="dedust" />
        </SwapProvidersContainer>
    );
};

const ProviderCardStyled = styled.div<{ isActive: boolean; isDisabled: boolean }>`
    border-radius: ${p =>
        p.theme.displayType === 'full-width' ? p.theme.corner2xSmall : p.theme.cornerSmall};
    border: 1px solid ${p => (p.isActive ? p.theme.accentBlue : p.theme.separatorCommon)};
    padding: 0 12px;
    display: flex;
    gap: 0.5rem;
    align-items: center;
    cursor: ${p => (p.isDisabled ? 'not-allowed' : 'pointer')};

    transition: border-color 0.15s ease-in-out;

    &:not(:last-child) {
        margin-bottom: 8px;
    }
`;

const ProviderImage = styled.img`
    width: 24px;
    height: 24px;
    border-radius: 6px;
`;

const ProviderLabelContainer = styled.div`
    padding: 10px 0;
    display: flex;
    flex-direction: column;
`;

const ProviderPriceContainer = styled.div`
    padding: 10px 0;
    margin-left: auto;
    display: flex;
    flex-direction: column;
`;

const Body3Styled = styled(Body3)`
    color: ${p => p.theme.textSecondary};
`;

const providersConfig = {
    stonfi: {
        imageUrl: 'https://wallet.tonkeeper.com/img/swap/stonfi.png',
        label: 'STON.fi'
    },
    dedust: {
        imageUrl: 'https://wallet.tonkeeper.com/img/swap/dedust.png',
        label: 'DeDust'
    }
};

const ProviderCard: FC<{ provider: keyof typeof providersConfig }> = ({ provider }) => {
    const [selectedSwap, setSelectedSwap] = useSelectedSwap();
    const isActive = selectedSwap?.provider === provider;

    const { fetchedSwaps, isFetching } = useCalculatedSwap();

    const swap = fetchedSwaps.find(t => t.provider === provider);
    const trade = swap?.trade;
    const [toAsset] = useSwapToAsset();
    const { data: rate } = useRate(tonAssetAddressToString(toAsset.address));
    const isBest = fetchedSwaps.findIndex(t => t.provider === provider) === 0;

    const providerConfig = providersConfig[provider];

    const { fiatAmount } = useFormatFiat(rate, trade?.to.relativeAmount || new BigNumber(0));

    return (
        <ProviderCardStyled
            isDisabled={!swap || !trade}
            isActive={isActive}
            onClick={() => swap && trade && setSelectedSwap(swap)}
        >
            <ProviderImage />
            <ProviderLabelContainer>
                <Label2>{providerConfig.label}</Label2>
                {isBest && <Body3Styled>Best price</Body3Styled>}
            </ProviderLabelContainer>
            <ProviderPriceContainer>
                {!isFetching && !trade ? (
                    <Body3Styled>Trade is not available</Body3Styled>
                ) : (
                    <>
                        {trade ? (
                            <Label2>{trade.to.stringAssetRelativeAmount}</Label2>
                        ) : (
                            <Skeleton width="60px" height="14px" margin="3px 0" />
                        )}
                        {rate && trade ? (
                            <Body3Styled>≈&nbsp;{fiatAmount}</Body3Styled>
                        ) : (
                            <Skeleton width="60px" height="12px" margin="2px 0" />
                        )}
                        <Body3Styled></Body3Styled>
                    </>
                )}
            </ProviderPriceContainer>
        </ProviderCardStyled>
    );
};
