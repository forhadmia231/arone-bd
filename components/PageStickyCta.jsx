import styles from './PageStickyCta.module.css';

function hrefFor(settings) {
  if (settings.stickyType === 'CALL') {
    const phone = String(settings.stickyPhone || '').replace(/[^\d+]/g, '');
    return phone ? `tel:${phone}` : '#';
  }

  if (settings.stickyType === 'WHATSAPP') {
    let phone = String(settings.stickyPhone || '').replace(/\D/g, '');
    if (phone.startsWith('0')) phone = `88${phone}`;
    const message = encodeURIComponent(settings.stickyMessage || 'Hello');
    return phone ? `https://wa.me/${phone}?text=${message}` : '#';
  }

  return settings.stickyUrl || '/shop';
}

export default function PageStickyCta({ settings }) {
  if (!settings?.stickyEnabled) return null;

  const href = hrefFor(settings);
  const external = href.startsWith('https://wa.me/');

  return (
    <div className={styles.wrap}>
      <a
        href={href}
        className={styles.button}
        data-page-cta={`Sticky CTA: ${settings.stickyLabel || 'Order Now'}`}
        {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      >
        {settings.stickyLabel || 'Order Now'}
      </a>
    </div>
  );
}
