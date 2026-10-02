import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import styles from './PageRenderer.module.css';

export default async function PageRenderer({ page, preview = false }) {
  const blocks = Array.isArray(page?.content) ? page.content : [];
  const productIds = blocks
    .filter((block) => block.type === 'products')
    .flatMap((block) => Array.isArray(block.productIds) ? block.productIds : []);

  const products = productIds.length
    ? await prisma.product.findMany({
        where: { id: { in: [...new Set(productIds)] }, active: true },
        select: { id: true, name: true, slug: true, imageUrl: true, price: true, compareAtPrice: true },
      })
    : [];
  const productMap = new Map(products.map((product) => [product.id, product]));

  return (
    <>
      {!page.showHeader && <style>{`.top-strip,.site-header{display:none!important}`}</style>}
      {!page.showFooter && <style>{`footer,.abg-footer{display:none!important}`}</style>}
      <main className={`${styles.page} ${page.fullWidth ? styles.fullWidth : ''}`}>
        {preview && <div className={styles.previewBar}>Preview mode — this may be unpublished.</div>}
        {blocks.map((block, index) => (
          <Block key={block.id || index} block={block} productMap={productMap} />
        ))}
        {blocks.length === 0 && <section className={styles.empty}><h1>{page.title}</h1><p>This page has no sections yet.</p></section>}
      </main>
    </>
  );
}

function Block({ block, productMap }) {
  if (block.type === 'hero') {
    const style = block.image ? { backgroundImage: `linear-gradient(rgba(15,35,22,.35),rgba(15,35,22,.35)),url(${block.image})` } : {};
    return <section className={`${styles.hero} ${block.align === 'center' ? styles.center : ''}`} style={style}>
      <div className={styles.inner}><h1>{block.title}</h1>{block.subtitle && <p>{block.subtitle}</p>}{block.buttonText && <Link href={block.buttonUrl || '/shop'} className={styles.button}>{block.buttonText}</Link>}</div>
    </section>;
  }

  if (block.type === 'text') return <section className={styles.section}><div className={styles.content}>{block.heading && <h2>{block.heading}</h2>}<p className={styles.preline}>{block.text}</p></div></section>;

  if (block.type === 'imageText') return <section className={styles.section}><div className={`${styles.imageText} ${block.imageSide === 'right' ? styles.imageRight : ''}`}>
    <div className={styles.imageBox}>{block.image ? <img src={block.image} alt={block.heading || ''} /> : <div className={styles.imagePlaceholder}>Image</div>}</div>
    <div><h2>{block.heading}</h2><p className={styles.preline}>{block.text}</p>{block.buttonText && <Link href={block.buttonUrl || '/shop'} className={styles.button}>{block.buttonText}</Link>}</div>
  </div></section>;

  if (block.type === 'products') {
    const list = (block.productIds || []).map((id) => productMap.get(id)).filter(Boolean);
    return <section className={styles.section}><div className={styles.content}><h2>{block.heading || 'Featured Products'}</h2><div className={styles.productGrid}>{list.map((product) => <article className={styles.productCard} key={product.id}>
      <Link href={`/product/${product.slug}`} className={styles.productImage}>{product.imageUrl && <img src={product.imageUrl} alt={product.name} />}</Link>
      <div className={styles.productBody}><Link href={`/product/${product.slug}`}><strong>{product.name}</strong></Link><div className={styles.price}>৳{product.price}{product.compareAtPrice ? <del>৳{product.compareAtPrice}</del> : null}</div><Link href={`/product/${product.slug}`} className={styles.productButton}>View Product</Link></div>
    </article>)}</div></div></section>;
  }

  if (block.type === 'cta') return <section className={styles.section}><div className={styles.cta}><h2>{block.heading}</h2>{block.text && <p>{block.text}</p>}{block.buttonText && <Link href={block.buttonUrl || '/shop'} className={styles.button}>{block.buttonText}</Link>}</div></section>;

  if (block.type === 'faq') return <section className={styles.section}><div className={styles.content}><h2>{block.heading || 'Frequently Asked Questions'}</h2><div className={styles.faqList}>{(block.items || []).map((item, index) => <details key={index}><summary>{item.q}</summary><p>{item.a}</p></details>)}</div></div></section>;

  return null;
}
