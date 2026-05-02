import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface Props {
  text: string;
  size?: number;
}

export function QRCodeBlock({ text, size = 220 }: Props) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL(text, { width: size, margin: 1, color: { dark: '#c94625', light: '#ffffff' } })
      .then(setDataUrl)
      .catch(() => setDataUrl(''));
  }, [text, size]);

  if (!dataUrl) {
    return <div style={{ width: size, height: size }} className="bg-cream rounded-2xl" />;
  }
  return (
    <img
      src={dataUrl}
      alt="QR Code"
      width={size}
      height={size}
      className="rounded-2xl bg-white p-2 shadow"
    />
  );
}
