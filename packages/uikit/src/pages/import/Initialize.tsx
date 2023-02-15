import React, { FC, PropsWithChildren, useState } from 'react';
import styled, { css } from 'styled-components';
import { RocketIcon, ShieldIcon } from '../../components/create/CreateIcon';
import { Description } from '../../components/create/Description';
import { ImportNotification } from '../../components/create/ImportNotification';
import { Button } from '../../components/fields/Button';
import { H1 } from '../../components/Text';
import { useFBAnalyticsEvent } from '../../hooks/analytics';
import { useTranslation } from '../../hooks/translation';

const Block = styled.div<{ fullHeight: boolean }>`
  display: flex;
  flex-direction: column;
  min-height: var(--app-height);
  padding: 1rem 1rem;
  box-sizing: border-box;
  position: relative;

  ${(props) =>
    props.fullHeight
      ? css`
          justify-content: space-between;
        `
      : css`
          justify-content: center;
        `}
`;

export const InitializeContainer: FC<
  PropsWithChildren<{ fullHeight?: boolean }>
> = ({ fullHeight = true, children }) => {
  return <Block fullHeight={fullHeight}>{children}</Block>;
};

const Accent = styled.span`
  color: ${(props) => props.theme.accentBlue};
`;

const Title = styled(H1)`
  margin-bottom: 2rem;
  user-select: none;
`;

export const Initialize: FC = () => {
  const { t } = useTranslation();
  const [isOpen, setOpen] = useState(false);

  useFBAnalyticsEvent('screen_view');

  return (
    <>
      <Title>
        {t('intro_title')}
        <Accent>Tonkeeper</Accent>
      </Title>
      <div>
        <Description
          icon={<RocketIcon />}
          title={t('intro_item1_title')}
          description={t('intro_item1_caption')}
        />
        <Description
          icon={<ShieldIcon />}
          title={t('intro_item2_title')}
          description={t('intro_item2_caption')}
        />
        {/* <Description
          icon={<TicketIcon />}
          title={t('intro_item3_title')}
          description={t('intro_item3_caption')}
        /> */}
      </div>
      <Button
        size="large"
        fullWidth
        primary
        marginTop
        onClick={() => setOpen(true)}
      >
        {t('intro_continue_btn')}
      </Button>
      <ImportNotification isOpen={isOpen} setOpen={setOpen} />
    </>
  );
};
