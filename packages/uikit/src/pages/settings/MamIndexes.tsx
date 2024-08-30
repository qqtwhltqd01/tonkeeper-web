import { AccountMAM } from '@tonkeeper/core/dist/entries/account';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import React, { FC, useLayoutEffect, useRef } from 'react';
import styled from 'styled-components';
import { InnerBody } from '../../components/Body';
import { SubHeader } from '../../components/SubHeader';
import { Body2, Label2 } from '../../components/Text';
import { useTranslation } from '../../hooks/translation';
import {
    useTonWalletsBalances,
    useMutateAccountActiveDerivation,
    useActiveAccount,
    useCreateMAMAccountDerivation,
    useHideMAMAccountDerivation,
    useEnableMAMAccountDerivation
} from '../../state/wallet';
import { ListBlockDesktopAdaptive, ListItem, ListItemPayload } from '../../components/List';
import { toFormattedTonBalance } from '../../hooks/balance';
import { Button } from '../../components/fields/Button';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '../../libs/routes';
import { SkeletonListDesktopAdaptive } from '../../components/Skeleton';
import { WalletEmoji } from '../../components/shared/emoji/WalletEmoji';
import { AccountBadge, WalletIndexBadge } from '../../components/account/AccountBadge';
import { NotificationFooterPortal } from '../../components/Notification';
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';
import {
    DesktopViewHeader,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { IconButtonTransparentBackground } from '../../components/fields/IconButton';
import { PencilIcon } from '../../components/Icon';
import { useRenameNotification } from '../../components/modals/RenameNotificationControlled';
import { useRecoveryNotification } from '../../components/modals/RecoveryNotificationControlled';
import { useProState } from '../../state/pro';
import { useProFeaturesNotification } from '../../components/modals/ProFeaturesNotificationControlled';
import { useAppContext } from '../../hooks/appContext';
import { scrollToContainersBottom } from '../../libs/web';
import { usePrevious } from '../../hooks/usePrevious';

const FirstLineContainer = styled.div`
    display: flex;
    gap: 6px;
    align-items: center;
`;

const TextContainer = styled.span`
    flex-direction: column;
    display: flex;
    align-items: flex-start;
`;

const Body2Secondary = styled(Body2)`
    color: ${props => props.theme.textSecondary};
`;

const ButtonsContainer = styled.div`
    margin-left: auto;
    display: flex;
    gap: 8px;
`;

export const MAMIndexesPage = () => {
    const { t } = useTranslation();
    const account = useActiveAccount();
    const isFullWidth = useIsFullWidthMode();

    if (account.type !== 'mam') {
        return null;
    }

    if (isFullWidth) {
        return (
            <DesktopViewPageLayout>
                <DesktopViewHeader backButton>
                    <Label2>{t('settings_mam_indexes')}</Label2>
                </DesktopViewHeader>
                <MAMIndexesPageContentStyled
                    buttonWrapperClassName="mam-page-sticky-button-wrapper"
                    account={account}
                />
            </DesktopViewPageLayout>
        );
    }

    return (
        <>
            <SubHeader title={t('settings_mam_indexes')} />
            <InnerBody>
                <MAMIndexesPageContent account={account} />
            </InnerBody>
        </>
    );
};

const ListBlockStyled = styled(ListBlockDesktopAdaptive)`
    margin-bottom: 0;
`;

const FooterButtonContainerStyled = styled.div`
    padding: 1rem;
    margin: 0 -1rem;
    background-color: ${p => p.theme.backgroundPage};
`;

const IconButtonTransparentBackgroundStyled = styled(IconButtonTransparentBackground)`
    > svg {
        color: ${p => p.theme.iconTertiary};
    }
`;

const ContentWrapper = styled.div``;

export const MAMIndexesPageContent: FC<{
    afterWalletOpened?: () => void;
    account: AccountMAM;
    className?: string;
    buttonWrapperClassName?: string;
}> = ({ afterWalletOpened, account, className, buttonWrapperClassName }) => {
    const { t } = useTranslation();
    const { config } = useAppContext();
    const { data: proState } = useProState();
    const { onOpen: recovery } = useRecoveryNotification();
    const { onOpen: buyPro } = useProFeaturesNotification();
    const ref = useRef<HTMLDivElement | null>(null);

    const { mutateAsync: selectDerivation, isLoading: isSelectDerivationLoading } =
        useMutateAccountActiveDerivation();
    const navigate = useNavigate();

    const { data: balances } = useTonWalletsBalances(
        account.allAvailableDerivations.map(
            d => d.tonWallets.find(w => w.id === d.activeTonWalletId)!.rawAddress
        )
    );

    const { mutate: createDerivation, isLoading: isCreatingDerivationLoading } =
        useCreateMAMAccountDerivation();

    const { mutate: hideDerivation, isLoading: isHideDerivationLoading } =
        useHideMAMAccountDerivation();

    const { mutate: enableDerivation, isLoading: isEnableDerivationLoading } =
        useEnableMAMAccountDerivation();

    const { onOpen: rename } = useRenameNotification();

    const onOpenDerivation = async (index: number) => {
        if (index !== account.activeDerivationIndex) {
            await selectDerivation({ accountId: account.id, derivationIndex: index });
        }
        navigate(AppRoute.home);
        afterWalletOpened?.();
    };

    const onCreateDerivation = async () => {
        createDerivation({
            accountId: account.id
        });
    };

    const totalDerivationsDisplayed = balances?.length;
    const totalDerivationsDisplayedPrev = usePrevious(totalDerivationsDisplayed);
    useLayoutEffect(() => {
        if (
            totalDerivationsDisplayed !== undefined &&
            totalDerivationsDisplayedPrev !== undefined &&
            totalDerivationsDisplayed > totalDerivationsDisplayedPrev &&
            ref.current
        ) {
            scrollToContainersBottom(ref.current);
        }
    }, [totalDerivationsDisplayed, totalDerivationsDisplayedPrev]);

    const onEnableDerivation = async (index: number) => {
        enableDerivation({
            accountId: account.id,
            derivationIndex: index
        });
    };

    const onHideDerivation = async (index: number) => {
        hideDerivation({
            accountId: account.id,
            derivationIndex: index
        });
    };

    if (!balances) {
        return <SkeletonListDesktopAdaptive size={account.allAvailableDerivations.length} />;
    }

    const isLoading =
        isSelectDerivationLoading ||
        isCreatingDerivationLoading ||
        isHideDerivationLoading ||
        isEnableDerivationLoading;

    const canHide = account.derivations.length > 1;

    const mamMaxWalletsWithoutPro = config.mam_max_wallets_without_pro || 3;
    const showByProButton =
        !proState?.subscription.valid &&
        account.allAvailableDerivations.length >= mamMaxWalletsWithoutPro;

    return (
        <ContentWrapper className={className} ref={ref}>
            <ListBlockStyled>
                <ListItem hover={false}>
                    <ListItemPayload>
                        <WalletEmoji containerSize="24px" emoji={account.emoji} />
                        <FirstLineContainer>
                            <Label2>{account.name}</Label2>
                            <AccountBadge accountType="mam" />
                        </FirstLineContainer>
                        <ButtonsContainer>
                            <IconButtonTransparentBackgroundStyled
                                onClick={() => rename({ accountId: account.id })}
                            >
                                <PencilIcon />
                            </IconButtonTransparentBackgroundStyled>
                            <Button
                                onClick={() => recovery({ accountId: account.id })}
                                loading={isLoading}
                            >
                                {t('backup_screen_title')}
                            </Button>
                        </ButtonsContainer>
                    </ListItemPayload>
                </ListItem>
                {balances.map((balance, cycleIndex) => {
                    const derivationIndex = account.allAvailableDerivations[cycleIndex].index;
                    const derivation = account.allAvailableDerivations.find(
                        d => d.index === derivationIndex
                    )!;

                    const isDerivationAdded = account.derivations.some(
                        d => d.index === derivationIndex
                    );

                    return (
                        <ListItem hover={false} key={balance.address}>
                            <ListItemPayload>
                                <WalletEmoji containerSize="24px" emoji={derivation.emoji} />
                                <TextContainer>
                                    <FirstLineContainer>
                                        <Label2>{derivation.name}</Label2>
                                        <WalletIndexBadge>#{derivationIndex + 1}</WalletIndexBadge>
                                    </FirstLineContainer>
                                    <Body2Secondary>
                                        {toShortValue(formatAddress(balance.address)) + ' '}·
                                        {' ' + toFormattedTonBalance(balance.tonBalance)}&nbsp;TON
                                    </Body2Secondary>
                                </TextContainer>
                                {isDerivationAdded ? (
                                    <ButtonsContainer>
                                        <IconButtonTransparentBackgroundStyled
                                            onClick={() =>
                                                rename({ accountId: account.id, derivationIndex })
                                            }
                                        >
                                            <PencilIcon />
                                        </IconButtonTransparentBackgroundStyled>
                                        <Button
                                            onClick={() => onOpenDerivation(derivationIndex)}
                                            loading={isLoading}
                                        >
                                            {t('open')}
                                        </Button>
                                        {canHide && (
                                            <Button
                                                onClick={() => onHideDerivation(derivationIndex)}
                                                loading={isLoading}
                                            >
                                                {t('hide')}
                                            </Button>
                                        )}
                                    </ButtonsContainer>
                                ) : (
                                    <ButtonsContainer>
                                        <IconButtonTransparentBackgroundStyled
                                            onClick={() =>
                                                rename({ accountId: account.id, derivationIndex })
                                            }
                                        >
                                            <PencilIcon />
                                        </IconButtonTransparentBackgroundStyled>
                                        <Button
                                            primary
                                            onClick={() => onEnableDerivation(derivationIndex)}
                                            loading={isLoading}
                                        >
                                            {t('add')}
                                        </Button>
                                    </ButtonsContainer>
                                )}
                            </ListItemPayload>
                        </ListItem>
                    );
                })}
            </ListBlockStyled>
            <NotificationFooterPortal>
                <FooterButtonContainerStyled className={buttonWrapperClassName}>
                    {showByProButton ? (
                        <Button primary fullWidth onClick={buyPro}>
                            {t('settings_mam_add_wallet_with_pro')}
                        </Button>
                    ) : (
                        <Button fullWidth onClick={onCreateDerivation}>
                            {t('settings_mam_add_wallet')}
                        </Button>
                    )}
                </FooterButtonContainerStyled>
            </NotificationFooterPortal>
        </ContentWrapper>
    );
};

const MAMIndexesPageContentStyled = styled(MAMIndexesPageContent)`
    .mam-page-sticky-button-wrapper {
        margin: 0;
        position: sticky;
        bottom: 0;
    }
`;
