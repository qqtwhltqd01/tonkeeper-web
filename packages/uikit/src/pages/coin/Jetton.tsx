import { useInfiniteQuery } from '@tanstack/react-query';
import { JettonBalance } from '@tonkeeper/core/dist/tonApiV1';
import { AccountsApi, JettonInfo } from '@tonkeeper/core/dist/tonApiV2';
import { formatDecimals } from '@tonkeeper/core/dist/utils/balance';
import React, { FC, useMemo, useRef } from 'react';
import { Address } from 'ton-core';
import { InnerBody } from '../../components/Body';
import { CoinSkeletonPage } from '../../components/Skeleton';
import { SubHeader } from '../../components/SubHeader';
import { ActivityList } from '../../components/activity/ActivityGroup';
import { ActionsRow } from '../../components/home/Actions';
import { ReceiveAction } from '../../components/home/ReceiveAction';
import { CoinInfo } from '../../components/jettons/Info';
import { SendAction } from '../../components/transfer/SendNotifications';
import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { useFetchNext } from '../../hooks/useFetchNext';
import { JettonKey, QueryKey } from '../../libs/queryKey';
import { useJettonBalance, useJettonInfo } from '../../state/jetton';
import { useFormatFiat, useRate } from '../../state/rates';

const JettonHistory: FC<{ balance: JettonBalance; innerRef: React.RefObject<HTMLDivElement> }> = ({
    balance,
    innerRef
}) => {
    const { tonApiV2, standalone } = useAppContext();
    const wallet = useWalletContext();

    const { isFetched, hasNextPage, data, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
        queryKey: [balance.walletAddress.address, QueryKey.activity, JettonKey.history],
        queryFn: ({ pageParam = undefined }) =>
            new AccountsApi(tonApiV2).getAccountJettonHistoryByID({
                accountId: wallet.active.rawAddress,
                jettonId: balance.jettonAddress,
                limit: 20,
                beforeLt: pageParam
            }),
        getNextPageParam: lastPage => (lastPage.nextFrom > 0 ? lastPage.nextFrom : undefined)
    });

    useFetchNext(hasNextPage, isFetchingNextPage, fetchNextPage, standalone, innerRef);

    return (
        <ActivityList
            isFetched={isFetched}
            isFetchingNextPage={isFetchingNextPage}
            tonEvents={data}
        />
    );
};

const JettonHeader: FC<{ info: JettonInfo; balance: JettonBalance }> = ({ info, balance }) => {
    const [amount, address] = useMemo(
        () => [
            formatDecimals(balance.balance, info.metadata.decimals),
            Address.parse(balance.jettonAddress).toString()
        ],
        [info, balance]
    );

    const { data } = useRate(address);
    const { fiatAmount } = useFormatFiat(data, amount);
    const { description, image } = info.metadata;

    return (
        <CoinInfo
            amount={amount}
            symbol={info.metadata.symbol}
            price={fiatAmount}
            description={description}
            image={image}
        />
    );
};

export const JettonContent: FC<{ jettonAddress: string }> = ({ jettonAddress }) => {
    const { data: info } = useJettonInfo(jettonAddress);
    const { data: balance } = useJettonBalance(jettonAddress);

    const ref = useRef<HTMLDivElement>(null);
    if (!info || !balance) {
        return <CoinSkeletonPage />;
    }

    return (
        <>
            <SubHeader title={info.metadata.name} />
            <InnerBody ref={ref}>
                <JettonHeader balance={balance} info={info} />
                <ActionsRow>
                    <SendAction asset={info.metadata.address} />
                    <ReceiveAction info={info} />
                </ActionsRow>

                <JettonHistory balance={balance} innerRef={ref} />
            </InnerBody>
        </>
    );
};
