import {
  WalletVersions,
  walletVersionText,
} from '@tonkeeper/core/dist/entries/wallet';
import { getWalletAddress } from '@tonkeeper/core/dist/service/walletService';
import { toShortAddress } from '@tonkeeper/core/dist/utils/common';
import React, { useMemo } from 'react';
import { CheckIcon } from '../../components/Icon';
import {
  SettingsItem,
  SettingsList,
} from '../../components/settings/SettingsList';
import { SubHeader } from '../../components/SubHeader';
import { useWalletContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { useMutateWalletVersion } from '../../state/account';

export const WalletVersion = () => {
  const { t } = useTranslation();

  const wallet = useWalletContext();

  const { mutate, isLoading } = useMutateWalletVersion();

  const items = useMemo<SettingsItem[]>(() => {
    const publicKey = Buffer.from(wallet.publicKey, 'hex');
    return WalletVersions.map((item) => ({
      name: walletVersionText(item),
      secondary: toShortAddress(
        getWalletAddress(publicKey, item).friendlyAddress
      ),
      icon: wallet.active.version === item ? <CheckIcon /> : undefined,
      action: () => mutate(item),
    }));
  }, [wallet, mutate]);

  return (
    <>
      <SubHeader title={t('settings_wallet_version')} />
      <SettingsList items={items} loading={isLoading} />
    </>
  );
};
