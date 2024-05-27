import React, { FC, useLayoutEffect, useState } from 'react';
import { styled } from 'styled-components';
import { Body3, Label2 } from '../Text';
import { RadioFlatInput } from '../shared/RadioFlatInput';
import { Notification } from '../Notification';
import { Button } from '../fields/Button';
import { useMutateSwapOptions, useSwapOptions } from '../../state/swap/useSwapOptions';
import { SpinnerIcon } from '../Icon';

export const SwapSettingsNotification: FC<{
    isOpen: boolean;
    onClose: (confirmed?: boolean) => void;
}> = ({ isOpen, onClose }) => {
    return (
        <>
            <Notification isOpen={isOpen} handleClose={onClose} title="Settings">
                {() => <SwapSettingsNotificationContent onClose={onClose} />}
            </Notification>
        </>
    );
};

const SlippageToleranceTextWrapper = styled.div`
    padding-bottom: 10px;

    > * {
        display: block;
    }

    > ${Body3} {
        color: ${p => p.theme.textSecondary};
    }
`;

const SlippageOptionsContainer = styled.div`
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
`;

const RadioFlatInputStyled = styled(RadioFlatInput)`
    height: 36px;
    flex: 1;
`;

const ButtonsContainer = styled.div`
    display: flex;
    gap: 0.5rem;
    > * {
        flex: 1;
    }
`;

const slippagePercentValues = [0.5, 1, 3, 5];
const defaultPercent = slippagePercentValues[1];

const LoadingContainer = styled.div`
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const SwapSettingsNotificationContent: FC<{ onClose: () => void }> = ({ onClose }) => {
    const { data: swapOptions } = useSwapOptions();
    const { mutate } = useMutateSwapOptions();
    const [checkedRadioValue, setCheckedRadioValue] = useState<
        (typeof slippagePercentValues)[number] | undefined
    >();

    useLayoutEffect(() => {
        if (swapOptions?.slippagePercent) {
            if (slippagePercentValues.includes(swapOptions?.slippagePercent)) {
                setCheckedRadioValue(swapOptions?.slippagePercent);
            } else {
                setCheckedRadioValue(defaultPercent);
                mutate({ slippagePercent: defaultPercent });
            }
        }
    }, [swapOptions?.slippagePercent]);

    if (!swapOptions) {
        return (
            <LoadingContainer>
                <SpinnerIcon />
            </LoadingContainer>
        );
    }

    const onSave = () => {
        mutate({ slippagePercent: checkedRadioValue });
        onClose?.();
    };

    return (
        <>
            <SlippageToleranceTextWrapper>
                <Label2>Slippage Tolerance</Label2>
                <Body3>The amount the price can change unfavorably before the trade reverts.</Body3>
            </SlippageToleranceTextWrapper>
            <SlippageOptionsContainer>
                {slippagePercentValues.map(value => (
                    <RadioFlatInputStyled
                        key={value}
                        name="slippage-percent"
                        value={value}
                        checked={checkedRadioValue === value}
                        onChange={() => setCheckedRadioValue(value)}
                    >
                        {value}%
                    </RadioFlatInputStyled>
                ))}
            </SlippageOptionsContainer>
            <ButtonsContainer>
                <Button secondary onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    primary
                    disabled={checkedRadioValue === swapOptions.slippagePercent}
                    onClick={onSave}
                >
                    Save
                </Button>
            </ButtonsContainer>
        </>
    );
};
