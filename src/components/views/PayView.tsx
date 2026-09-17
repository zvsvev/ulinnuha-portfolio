import { useState } from 'react';
import AppNav from '../AppNav';
import { useI18n } from '../../i18n/strings';
import './PayView.css';

/** Drop the QRIS export at public/img/qris.png to show it here. */
const QRIS_SRC = '/img/qris.png';

type Props = { onBack: () => void };

export default function PayView({ onBack }: Props) {
  const { t } = useI18n();
  const [missing, setMissing] = useState(false);

  return (
    <div className="app-view">
      <AppNav title={t('pay')} onBack={onBack} />

      <div className="pay">
        {missing ? (
          <p className="pay-missing">{t('qris_missing')}</p>
        ) : (
          <img
            className="pay-qr"
            src={QRIS_SRC}
            alt={t('pay')}
            onError={() => setMissing(true)}
          />
        )}
      </div>
    </div>
  );
}
