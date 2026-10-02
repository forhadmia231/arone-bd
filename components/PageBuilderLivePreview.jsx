'use client';

import styles from './PageBuilder.module.css';

function clampNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function color(value, fallback) {
  const text = String(value || '').trim();
  return /^#[0-9a-fA-F]{6}$/.test(text) ? text : fallback;
}

function sectionStyle(block, defaults = {}) {
  return {
    backgroundColor: color(block.backgroundColor, defaults.backgroundColor || '#ffffff'),
    color: color(block.textColor, defaults.textColor || '#17251c'),
    paddingTop: clampNumber(block.paddingTop, defaults.paddingTop ?? 58, 0, 160),
    paddingBottom: clampNumber(block.paddingBottom, defaults.paddingBottom ?? 58, 0, 160),
  };
}

function buttonStyle(block) {
  return {
    backgroundColor: color(block.buttonColor, '#235b37'),
    color: color(block.buttonTextColor, '#ffffff'),
  };
}

export default function PageBuilderLivePreview({ form, products, device = 'desktop' }) {
  const productMap = new Map((products || []).map((product) => [product.id, product]));
  const blocks = Array.isArray(form?.content) ? form.content : [];

  return (
    <div className={`${styles.livePreviewFrame} ${styles[`device_${device}`] || ''}`}>
      <div className={styles.livePreviewViewport}>
        {blocks.length === 0 ? (
          <div className={styles.previewEmpty}>
            <strong>{form?.title || 'Your page preview'}</strong>
            <span>Add a section to start building.</span>
          </div>
        ) : (
          blocks.map((block, index) => (
            <PreviewBlock key={block.id || index} block={block} productMap={productMap} />
          ))
        )}
      </div>
    </div>
  );
}

function PreviewBlock({ block, productMap }) {
  if (block.type === 'hero') {
    const overlay = clampNumber(block.overlay, 35, 0, 85) / 100;
    const minHeight = clampNumber(block.minHeight, 520, 260, 800);
    const align = ['left', 'center', 'right'].includes(block.align) ? block.align : 'left';
    const backgroundPosition = ['top', 'center', 'bottom'].includes(block.backgroundPosition)
      ? block.backgroundPosition
      : 'center';

    return (
      <section
        className={styles.previewHero}
        style={{
          ...sectionStyle(block, { backgroundColor: '#173f29', textColor: '#ffffff', paddingTop: 60, paddingBottom: 60 }),
          minHeight,
          backgroundImage: block.image
            ? `linear-gradient(rgba(0,0,0,${overlay}), rgba(0,0,0,${overlay})), url(${block.image})`
            : undefined,
          backgroundPosition,
          textAlign: align,
        }}
      >
        <div className={styles.previewInner}>
          <h1>{block.title || 'Hero headline'}</h1>
          {block.subtitle && <p>{block.subtitle}</p>}
          {block.buttonText && <span className={styles.previewButton} style={buttonStyle(block)}>{block.buttonText}</span>}
        </div>
      </section>
    );
  }

  if (block.type === 'text') {
    return (
      <section className={styles.previewSection} style={sectionStyle(block)}>
        <div className={styles.previewInner}>
          {block.heading && <h2>{block.heading}</h2>}
          <p>{block.text}</p>
        </div>
      </section>
    );
  }

  if (block.type === 'imageText') {
    return (
      <section className={styles.previewSection} style={sectionStyle(block)}>
        <div className={`${styles.previewImageText} ${block.imageSide === 'right' ? styles.previewImageRight : ''}`}>
          <div className={styles.previewImageBox}>
            {block.image ? <img src={block.image} alt="" /> : <span>Image</span>}
          </div>
          <div>
            <h2>{block.heading || 'Section heading'}</h2>
            <p>{block.text}</p>
            {block.buttonText && <span className={styles.previewButton} style={buttonStyle(block)}>{block.buttonText}</span>}
          </div>
        </div>
      </section>
    );
  }

  if (block.type === 'products') {
    const selected = (block.productIds || []).map((id) => productMap.get(id)).filter(Boolean);
    const columns = [2, 3, 4].includes(Number(block.columns)) ? Number(block.columns) : 4;

    return (
      <section className={styles.previewSection} style={sectionStyle(block)}>
        <div className={styles.previewInner}>
          <h2>{block.heading || 'Featured Products'}</h2>
          <div className={`${styles.previewProducts} ${styles[`previewCols${columns}`] || ''}`}>
            {selected.length === 0 ? (
              <div className={styles.previewProductEmpty}>Select products in the editor.</div>
            ) : (
              selected.map((product) => (
                <article className={styles.previewProductCard} key={product.id}>
                  <div className={styles.previewProductImage}>
                    {product.imageUrl ? <img src={product.imageUrl} alt="" /> : null}
                  </div>
                  <div className={styles.previewProductBody}>
                    <strong>{product.name}</strong>
                    <span>৳{product.price}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    );
  }

  if (block.type === 'cta') {
    return (
      <section className={styles.previewSection} style={sectionStyle(block, { backgroundColor: '#eff5eb' })}>
        <div className={styles.previewCta}>
          <h2>{block.heading || 'Ready to order?'}</h2>
          {block.text && <p>{block.text}</p>}
          {block.buttonText && <span className={styles.previewButton} style={buttonStyle(block)}>{block.buttonText}</span>}
        </div>
      </section>
    );
  }

  if (block.type === 'faq') {
    return (
      <section className={styles.previewSection} style={sectionStyle(block)}>
        <div className={styles.previewInner}>
          <h2>{block.heading || 'Frequently Asked Questions'}</h2>
          <div className={styles.previewFaq}>
            {(block.items || []).slice(0, 4).map((item, index) => (
              <div key={index}>
                <strong>{item.q || 'Question'}</strong>
                <p>{item.a || 'Answer'}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (block.type === 'form') {
    const fields = block.fields || {};

    return (
      <section className={styles.previewSection} style={sectionStyle(block, { backgroundColor: '#f7faf5' })}>
        <div className={styles.previewInner}>
          <h2>{block.heading || 'Request a Call'}</h2>
          {block.text && <p>{block.text}</p>}
          <div className={styles.previewLeadForm}>
            {fields.name !== false && <span>Name</span>}
            {fields.phone !== false && <span>Phone</span>}
            {fields.email === true && <span>Email</span>}
            {fields.message !== false && <span className={styles.previewFormWide}>Message</span>}
            <b style={buttonStyle(block)}>{block.submitText || 'Submit'}</b>
          </div>
        </div>
      </section>
    );
  }

  return null;
}
