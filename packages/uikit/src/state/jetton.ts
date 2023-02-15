import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { updateWalletProperty } from '@tonkeeper/core/dist/service/walletService';
import {
  AccountEvents,
  JettonApi,
  JettonBalance,
  JettonInfo,
  JettonsBalances,
} from '@tonkeeper/core/dist/tonApi';
import { getActiveWalletJetton } from '@tonkeeper/core/dist/tonApiExtended/walletApi';
import { useMemo } from 'react';
import { useAppContext, useWalletContext } from '../hooks/appContext';
import { useStorage } from '../hooks/storage';
import { JettonKey, QueryKey } from '../libs/queryKey';

export const useJettonInfo = (jettonAddress: string) => {
  const wallet = useWalletContext();
  const { tonApi } = useAppContext();
  return useQuery<JettonInfo, Error>(
    [wallet.active.rawAddress, QueryKey.jettons, JettonKey.info, jettonAddress],
    async () => {
      const result = await new JettonApi(tonApi).getJettonInfo({
        account: jettonAddress,
      });
      return result;
    }
  );
};

export const useJettonHistory = (walletAddress: string) => {
  const wallet = useWalletContext();
  const { tonApi } = useAppContext();
  return useQuery<AccountEvents, Error>(
    [
      wallet.active.rawAddress,
      QueryKey.jettons,
      JettonKey.history,
      walletAddress,
    ],
    async () => {
      const result = await new JettonApi(tonApi).getJettonHistory({
        account: walletAddress,
        limit: 100,
      });
      return result;
    }
  );
};

export const useJettonBalance = (jettonAddress: string) => {
  const wallet = useWalletContext();
  const { tonApi } = useAppContext();
  return useQuery<JettonBalance, Error>(
    [wallet.publicKey, QueryKey.jettons, JettonKey.balance, jettonAddress],
    async () => {
      const result = await getActiveWalletJetton(tonApi, wallet);

      const balance = result.balances.find(
        (item) => item.jettonAddress === jettonAddress
      );
      if (!balance) {
        throw new Error('Missing jetton balance');
      }
      return balance;
    }
  );
};

export const useToggleJettonMutation = () => {
  const storage = useStorage();
  const client = useQueryClient();
  const wallet = useWalletContext();
  const { tonApi } = useAppContext();
  return useMutation<void, Error, JettonBalance>(async (jetton) => {
    if (jetton.verification == 'whitelist') {
      const hiddenJettons = wallet.hiddenJettons ?? [];

      const updated = hiddenJettons.includes(jetton.jettonAddress)
        ? hiddenJettons.filter((item) => item !== jetton.jettonAddress)
        : hiddenJettons.concat([jetton.jettonAddress]);

      await updateWalletProperty(tonApi, storage, wallet, {
        hiddenJettons: updated,
      });
    } else {
      const shownJettons = wallet.shownJettons ?? [];

      const updated = shownJettons.includes(jetton.jettonAddress)
        ? shownJettons.filter((item) => item !== jetton.jettonAddress)
        : shownJettons.concat([jetton.jettonAddress]);

      await updateWalletProperty(tonApi, storage, wallet, {
        shownJettons: updated,
      });
    }

    await client.invalidateQueries([QueryKey.account]);
  });
};

export const sortJettons = (
  orderJettons: string[] | undefined,
  jettons: JettonBalance[]
) => {
  if (!orderJettons) return jettons;
  return jettons.sort(
    (a, b) =>
      orderJettons.indexOf(a.jettonAddress) -
      orderJettons.indexOf(b.jettonAddress)
  );
};

export const hideJettons = (
  hiddenJettons: string[] | undefined,
  shownJettons: string[] | undefined,
  jettons: JettonBalance[]
) => {
  return jettons.filter((jetton) => {
    if (jetton.verification == 'whitelist') {
      return hiddenJettons
        ? !hiddenJettons.includes(jetton.jettonAddress)
        : true;
    } else {
      return shownJettons ? shownJettons.includes(jetton.jettonAddress) : false;
    }
  });
};

export const hideEmptyJettons = (jettons: JettonBalance[]) => {
  return jettons.filter((jetton) => {
    return jetton.balance != '0';
  });
};

export const useUserJettonList = (jettons?: JettonsBalances) => {
  const { hiddenJettons, orderJettons, shownJettons } = useWalletContext();

  return useMemo(() => {
    if (!jettons) return { balances: [] };
    const order = sortJettons(orderJettons, jettons.balances);
    const hide = hideJettons(hiddenJettons, shownJettons, order);
    const notEmpty = hideEmptyJettons(hide);

    return {
      balances: notEmpty,
    };
  }, [jettons, hiddenJettons, orderJettons]);
};
