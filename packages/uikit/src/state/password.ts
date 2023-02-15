import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AuthState,
  defaultAuthState,
} from '@tonkeeper/core/dist/entries/password';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import {
  addWalletVoucher,
  deleteWalletVoucher,
} from '@tonkeeper/core/dist/service/walletService';
import { useAppContext, useWalletContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';
import { useStorage } from '../hooks/storage';
import { QueryKey } from '../libs/queryKey';
import { getPasswordByNotification } from '../pages/home/UnlockNotification';

export const useAuthState = () => {
  const storage = useStorage();
  return useQuery([QueryKey.password], async () => {
    const auth = await storage.get<AuthState>(AppKey.password);
    return auth ?? defaultAuthState;
  });
};

export const useMutateAuthState = () => {
  const storage = useStorage();
  const client = useQueryClient();
  return useMutation<void, Error, AuthState>(async (state) => {
    await storage.set(AppKey.password, state);
    await client.invalidateQueries([QueryKey.password]);
  });
};

export const useLookScreen = () => {
  const storage = useStorage();
  return useQuery([QueryKey.lock], async () => {
    const lock = await storage.get<boolean>(AppKey.lock);
    return lock ?? false;
  });
};

export const useMutateLookScreen = () => {
  const storage = useStorage();
  const client = useQueryClient();
  return useMutation<void, Error, boolean>(async (value) => {
    await storage.set(AppKey.lock, value);
    await client.invalidateQueries([QueryKey.lock]);
  });
};

export const useMutateVoucher = () => {
  const storage = useStorage();
  const wallet = useWalletContext();
  const sdk = useAppSdk();
  const { tonApi } = useAppContext();
  const client = useQueryClient();

  return useMutation<void, Error, boolean>(async () => {
    if (wallet.voucher) {
      await deleteWalletVoucher(tonApi, storage, wallet);
    } else {
      const auth = await storage.get<AuthState>(AppKey.password);
      if (!auth) {
        throw new Error('Auth not defined');
      }
      const password = await getPasswordByNotification(sdk, auth);
      await addWalletVoucher(tonApi, storage, wallet, password);
    }

    await client.invalidateQueries();
  });
};
