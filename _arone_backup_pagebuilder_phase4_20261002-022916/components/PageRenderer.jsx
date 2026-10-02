import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import styles from './PageRenderer.module.css';

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
    backgroundColor: color(
      block.backgroundColor,
      defaults.backgroundColor || '#ffffff'
    ),
    color: color(
      block.textColor,
      defaults.textColor || '#17251c'
    ),
    paddingTop: clampNumber(
      block.paddingTop,
      defaults.paddingTop ?? 58,
      0,
      160
    ),
    paddingBottom: clampNumber(
      block.paddingBottom,
      defaults.paddingBottom ?? 58,
      0,
      160
    ),
  };
}

function buttonStyle(block) {
  return {
    backgroundColor: color(block.buttonColor, '#235b37'),
    color: color(block.buttonTextColor, '#ffffff'),
  };
}

export default async function PageRenderer({ page, preview = false }) {
  const blocks = Array.isArray(page?.content) ? page.content : [];

  const productIds = blocks
    .filter((block) => block.type === 'products')
    .flatMap((block) =>
      Array.isArray(block.productIds) ? block.productIds : []
    );

  const products = productIds.length
    ? await prisma.product.findMany({
        where: {
          id: {
            in: [...new Set(productIds)],
          },
          active: true,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
          price: true,
          compareAtPrice: true,
        },
      })
    : [];

  const productMap = new Map(
    products.map((product) => [product.id, product])
  );

  return (
    <>
      {!page.showHeader && (
        <style>{`.top-strip,.site-header{display:none!important}`}</style>
      )}

      {!page.showFooter && (
        <style>{`footer,.abg-footer{display:none!important}`}</style>
      )}

      <main
        className={`${styles.page} ${
          page.fullWidth ? styles.fullWidth : ''
        }`}
      >
        {preview && (
          <div className={styles.previewBar}>
            Preview mode — this page may be unpublished.
          </div>
        )}

        {blocks.map((block, index) => (
          <Block
            key={block.id || index}
            block={block}
            productMap={productMap}
          />
        ))}

        {blocks.length === 0 && (
          <section className={styles.empty}>
            <h1>{page.title}</h1>
            <p>This page has no sections yet.</p>
          </section>
        )}
      </main>
    </>
  );
}

function Block({ block, productMap }) {
  if (block.type === 'hero') {
    const overlay = clampNumber(block.overlay, 35, 0, 85) / 100;
    const minHeight = clampNumber(block.minHeight, 520, 260, 800);
    const backgroundPosition = ['top', 'center', 'bottom'].includes(
      block.backgroundPosition
    )
      ? block.backgroundPosition
      : 'center';

    const style = {
      ...sectionStyle(block, {
        backgroundColor: '#173f29',
        textColor: '#ffffff',
        paddingTop: 60,
        paddingBottom: 60,
      }),
      minHeight,
      backgroundPosition,
      backgroundImage: block.image
        ? `linear-gradient(rgba(0,0,0,${overlay}),rgba(0,0,0,${overlay})),url(${block.image})`
        : undefined,
    };

    const alignClass =
      block.align === 'center'
        ? styles.center
        : block.align === 'right'
          ? styles.right
          : '';

    return (
      <section
        className={`${styles.hero} ${alignClass}`}
        style={style}
      >
        <div className={styles.inner}>
          <h1>{block.title}</h1>
          {block.subtitle && <p>{block.subtitle}</p>}

          {block.buttonText && (
            <Link
              href={block.buttonUrl || '/shop'}
              className={styles.button}
              style={buttonStyle(block)}
            >
              {block.buttonText}
            </Link>
          )}
        </div>
      </section>
    );
  }

  if (block.type === 'text') {
    return (
      <section
        className={styles.section}
        style={sectionStyle(block)}
      >
        <div className={styles.content}>
          {block.heading && <h2>{block.heading}</h2>}
          <p className={styles.preline}>{block.text}</p>
        </div>
      </section>
    );
  }

  if (block.type === 'imageText') {
    return (
      <section
        className={styles.section}
        style={sectionStyle(block)}
      >
        <div
          className={`${styles.imageText} ${
            block.imageSide === 'right' ? styles.imageRight : ''
          }`}
        >
          <div className={styles.imageBox}>
            {block.image ? (
              <img src={block.image} alt={block.heading || ''} />
            ) : (
              <div className={styles.imagePlaceholder}>Image</div>
            )}
          </div>

          <div>
            <h2>{block.heading}</h2>
            <p className={styles.preline}>{block.text}</p>

            {block.buttonText && (
              <Link
                href={block.buttonUrl || '/shop'}
                className={styles.button}
                style={buttonStyle(block)}
              >
                {block.buttonText}
              </Link>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (block.type === 'products') {
    const list = (block.productIds || [])
      .map((id) => productMap.get(id))
      .filter(Boolean);

    const columns = [2, 3, 4].includes(Number(block.columns))
      ? Number(block.columns)
      : 4;

    const columnClass =
      columns === 2
        ? styles.cols2
        : columns === 3
          ? styles.cols3
          : styles.cols4;

    return (
      <section
        className={styles.section}
        style={sectionStyle(block)}
      >
        <div className={styles.content}>
          <h2>{block.heading || 'Featured Products'}</h2>

          <div className={`${styles.productGrid} ${columnClass}`}>
            {list.map((product) => (
              <article
                className={styles.productCard}
                key={product.id}
              >
                <Link
                  href={`/product/${product.slug}`}
                  className={styles.productImage}
                >
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                    />
                  )}
                </Link>

                <div className={styles.productBody}>
                  <Link href={`/product/${product.slug}`}>
                    <strong>{product.name}</strong>
                  </Link>

                  <div className={styles.price}>
                    ৳{product.price}
                    {block.showComparePrice !== false &&
                    product.compareAtPrice ? (
                      <del>৳{product.compareAtPrice}</del>
                    ) : null}
                  </div>

                  <Link
                    href={`/product/${product.slug}`}
                    className={styles.productButton}
                  >
                    View Product
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (block.type === 'cta') {
    return (
      <section
        className={styles.section}
        style={sectionStyle(block, {
          backgroundColor: '#eff5eb',
        })}
      >
        <div className={styles.cta}>
          <h2>{block.heading}</h2>
          {block.text && <p>{block.text}</p>}

          {block.buttonText && (
            <Link
              href={block.buttonUrl || '/shop'}
              className={styles.button}
              style={buttonStyle(block)}
            >
              {block.buttonText}
            </Link>
          )}
        </div>
      </section>
    );
  }

  if (block.type === 'faq') {
    return (
      <section
        className={styles.section}
        style={sectionStyle(block)}
      >
        <div className={styles.content}>
          <h2>{block.heading || 'Frequently Asked Questions'}</h2>

          <div className={styles.faqList}>
            {(block.items || []).map((item, index) => (
              <details key={index}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return null;
}
