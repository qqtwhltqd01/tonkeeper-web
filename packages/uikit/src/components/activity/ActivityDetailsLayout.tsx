import React, { FC } from 'react';
import styled from 'styled-components';
import { useFormatCoinValue } from '../../hooks/balance';
import { useTranslation } from '../../hooks/translation';
import { ListItem, ListItemPayload } from '../List';
import { Body1, Label1 } from '../Text';
import { ActionDate, Label, Title } from './NotificationCommon';

export const Amount = styled(Body1)`
    display: block;
    user-select: none;
    color: ${props => props.theme.textSecondary};
`;

const Span = styled(Label1)`
    user-select: none;
    color: ${props => props.theme.textPrimary};
    background: ${props => props.theme.accentOrange};
    padding: 4px 8px;
    border-radius: 8px;
    margin-bottom: 12px;
    display: inline-block;
`;

export const ActivityDetailsHeader: FC<{
    amount: string | number;
    decimals?: number;
    symbol: string;
    total?: string;
    timestamp: number;
    isScam?: boolean;
    kind: 'received' | 'send';
}> = ({ amount, decimals, symbol, total, timestamp, isScam, kind }) => {
    const format = useFormatCoinValue();
    const { t } = useTranslation();
    return (
        <div>
            {isScam && <Span>{t('spam_action')}</Span>}
            <Title>
                {kind === 'received' ? '+' : '-'}&thinsp;
                {format(amount, decimals)} {symbol}
            </Title>
            {total && <Amount>≈&thinsp;{total}</Amount>}
            <ActionDate kind={kind} timestamp={timestamp} />
        </div>
    );
};

const LabelRight = styled(Label1)`
    padding-left: 1rem;
    box-sizing: border-box;
    text-align: right;

    word-break: break-all;

    white-space: break-spaces;
    overflow: hidden;
`;

export const TransferComment: FC<{ comment?: string }> = ({ comment }) => {
    const { t } = useTranslation();

    if (comment) {
        return (
            <ListItem hover={false}>
                <ListItemPayload>
                    <Label>{t('transaction_message')}</Label>
                    <LabelRight>{comment}</LabelRight>
                </ListItemPayload>
            </ListItem>
        );
    } else {
        return null;
    }
};
