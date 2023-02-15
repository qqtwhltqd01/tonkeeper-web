import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChangePasswordNotification } from '../../components/create/ChangePassword';
import { Switch } from '../../components/fields/Switch';
import { ListBlock, ListItem, ListItemPayload } from '../../components/List';
import { KeyIcon, LockIcon } from '../../components/settings/SettingsIcons';
import {
  SettingsItem,
  SettingsList,
} from '../../components/settings/SettingsList';
import { SubHeader } from '../../components/SubHeader';
import { Label1 } from '../../components/Text';
import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { AppRoute, SettingsRoute } from '../../libs/routes';
import {
  useLookScreen,
  useMutateLookScreen,
  useMutateVoucher,
} from '../../state/password';

const LockSwitch = () => {
  const { t } = useTranslation();

  const { data } = useLookScreen();
  const { mutate: toggleLock } = useMutateLookScreen();
  const wallet = useWalletContext();
  const { mutate: toggleVoucher } = useMutateVoucher();

  return (
    <ListBlock>
      <ListItem hover={false}>
        <ListItemPayload>
          <Label1>{t('Lock_screen')}</Label1>
          <Switch checked={!!data} onChange={toggleLock} />
        </ListItemPayload>
      </ListItem>
      <ListItem hover={false}>
        <ListItemPayload>
          <Label1>{t('Enable_storing_config')}</Label1>
          <Switch checked={!!wallet.voucher} onChange={toggleVoucher} />
        </ListItemPayload>
      </ListItem>
    </ListBlock>
  );
};

const ChangePassword = () => {
  const { t } = useTranslation();
  const [isOpen, setOpen] = useState(false);

  const { auth } = useAppContext();
  const items = useMemo(() => {
    const items: SettingsItem[] = [
      {
        name: t('Change_password'),
        icon: <LockIcon />,
        action: () => setOpen(true),
      },
    ];
    return items;
  }, []);

  if (auth.kind === 'password') {
    return (
      <>
        <SettingsList items={items} />
        <ChangePasswordNotification
          isOpen={isOpen}
          handleClose={() => setOpen(false)}
        />
      </>
    );
  } else {
    return <></>;
  }
};

const ShowPhrases = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const items = useMemo(() => {
    const items: SettingsItem[] = [
      {
        name: t('settings_backup_seed'),
        icon: <KeyIcon />,
        action: () => navigate(AppRoute.settings + SettingsRoute.recovery),
      },
    ];
    return items;
  }, []);

  return <SettingsList items={items} />;
};

export const SecuritySettings = () => {
  const { t } = useTranslation();
  return (
    <>
      <SubHeader title={t('settings_security')} />
      <LockSwitch />
      <ChangePassword />
      <ShowPhrases />
    </>
  );
};
