import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { relative, SettingsRoute } from '../../libs/routes';
import { useUserThemes } from '../../state/theme';
import { LocalizationIcon } from './SettingsIcons';
import { SettingsItem, SettingsList } from './SettingsList';

export const ThemeSettings = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const { fiat } = useAppContext();
  const { data: themes } = useUserThemes();

  const secondaryItems = useMemo(() => {
    const items: SettingsItem[] = [
      {
        name: t('settings_primary_currency'),
        icon: fiat,
        action: () => navigate(relative(SettingsRoute.fiat)),
      },
    ];

    if (i18n.enable) {
      items.push({
        name: t('Localization'),
        icon: <LocalizationIcon />,
        action: () => navigate(relative(SettingsRoute.localization)),
      });
    }

    // if (themes && themes.length > 1) {
    //   items.push({
    //     name: t('Theme'),
    //     icon: <ThemeIcon />,
    //     action: () => navigate(relative(SettingsRoute.theme)),
    //   });
    // }

    return items;
  }, [t, i18n.enable, navigate, fiat, themes]);

  return <SettingsList items={secondaryItems} />;
};
