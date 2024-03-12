import { useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryKey } from '../../libs/queryKey';
import { ClientColumns, useDashboardColumnsAsForm } from './useDashboardColumns';
import { useAppContext } from '../../hooks/appContext';
import { DashboardCell } from '@tonkeeper/core/dist/entries/dashboard';
import { getDashboardData } from '@tonkeeper/core/dist/service/proService';
import { useTranslation } from '../../hooks/translation';
import { WalletState } from '@tonkeeper/core/dist/entries/wallet';
import { Address } from 'ton-core';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { useWalletsState } from '../wallet';

export function useDashboardData() {
    const { data: columns } = useDashboardColumnsAsForm();
    const selectedColumns = columns?.filter(c => c.isEnabled);
    const { fiat } = useAppContext();
    const {
        i18n: { language },
        t
    } = useTranslation();
    const selectedColIds = selectedColumns?.map(c => c.id);
    const client = useQueryClient();

    const { data: walletsState } = useWalletsState();
    const mainnetWallets = walletsState?.filter(w => w && w.network !== Network.TESTNET);
    const publicKeysMainnet = mainnetWallets?.map(w => w!.publicKey);

    return useQuery<DashboardCell[][]>(
        [QueryKey.dashboardData, selectedColIds, publicKeysMainnet, fiat, language],
        async ctx => {
            if (!selectedColIds?.length || !publicKeysMainnet?.length || !mainnetWallets?.length) {
                return [];
            }

            const accounts = mainnetWallets.map(acc => acc!.active.friendlyAddress);

            const loadData = async (query: { columns: string[]; accounts: string[] }) => {
                const queryToFetch = {
                    columns: query.columns.filter(col => !ClientColumns.some(c => c.id === col)),
                    accounts: query.accounts
                };

                let fetchResult: DashboardCell[][] = query.accounts.map(() => []);
                if (queryToFetch.columns.length > 0) {
                    fetchResult = await getDashboardData(queryToFetch, {
                        currency: fiat,
                        lang: language
                    });
                }

                /* append client columns */
                const defaultWalletName = t('wallet_title');
                const result: DashboardCell[][] = query.accounts.map(() => []);
                query.accounts.forEach((walletAddress, rowIndex) => {
                    const wallet = mainnetWallets.find(w =>
                        Address.parse(w!.active.friendlyAddress).equals(
                            Address.parse(walletAddress)
                        )
                    );
                    query.columns.forEach((col, colIndex) => {
                        const ClientColumnName = ClientColumns.find(c => c.id === 'name')!;
                        if (col === ClientColumnName.id) {
                            result[rowIndex][colIndex] = {
                                columnId: ClientColumnName.id,
                                type: 'string',
                                value: wallet?.name || defaultWalletName
                            };
                            return;
                        }

                        result[rowIndex][colIndex] =
                            fetchResult[rowIndex][queryToFetch.columns.indexOf(col)];
                    });
                });
                /* append client columns */

                return result;
            };

            const pastQueries = client.getQueriesData({
                predicate: q =>
                    q.queryKey[0] === QueryKey.dashboardData &&
                    !!q.queryKey[1] &&
                    !!q.queryKey[2] &&
                    q.queryKey[3] === ctx.queryKey[3] &&
                    q.queryKey[4] === ctx.queryKey[4],
                fetchStatus: 'idle'
            });

            /* cache */
            if (pastQueries?.length) {
                const walletsToQuerySet = new Set<WalletState>();
                const columnsToQuerySet = new Set<string>();

                const result: (DashboardCell | null)[][] = publicKeysMainnet.map(() => []);
                publicKeysMainnet.forEach((pk, walletIndex) => {
                    selectedColIds.forEach((col, colIndex) => {
                        const matchingQueries = pastQueries.filter(
                            ([key, _]) =>
                                (key[2] as string[] | undefined)?.includes(pk) &&
                                (key[1] as string[] | undefined)?.includes(col)
                        );

                        if (!matchingQueries.length) {
                            result[walletIndex][colIndex] = null;
                            walletsToQuerySet.add(mainnetWallets[walletIndex]!);
                            columnsToQuerySet.add(col);
                            return;
                        }

                        const [actualQueryKey, actualQueryValue] =
                            matchingQueries[matchingQueries.length - 1];
                        const actualQueryWalletIndex = (actualQueryKey[2] as string[]).indexOf(pk);
                        const actualQueryColIndex = (actualQueryKey[1] as string[]).indexOf(col);

                        result[walletIndex][colIndex] = (actualQueryValue as DashboardCell[][])[
                            actualQueryWalletIndex
                        ][actualQueryColIndex];
                    });
                });

                const walletsToQuery = [...walletsToQuerySet.values()];
                const accountsToQuery = walletsToQuery.map(acc => acc.active.friendlyAddress);
                const columnsToQuery = [...columnsToQuerySet.values()];

                if (!accountsToQuery.length || !columnsToQuery.length) {
                    return result as DashboardCell[][];
                }

                const newData = await loadData({
                    accounts: accountsToQuery,
                    columns: columnsToQuery
                });

                newData.forEach((row, rowIndex) => {
                    const walletIndex = publicKeysMainnet.indexOf(
                        walletsToQuery[rowIndex].publicKey
                    );
                    row.forEach(cell => {
                        const colIndex = selectedColIds.indexOf(cell.columnId);
                        result[walletIndex][colIndex] = cell;
                    });
                });

                return result as DashboardCell[][];
            }
            /* cache */

            return loadData({ accounts, columns: selectedColIds });
        },
        {
            enabled: !!selectedColIds && !!mainnetWallets
        }
    );
}
