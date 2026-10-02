'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { slugifyPage, publicPageHref } from '@/lib/page-builder';
import styles from './PageBuilder.module.css';

const newPage = {
  title: '',
  slug: '',
  pageType: 'PAGE',
  status: 'DRAFT',
  seoTitle: '',
  seoDescription: '',
  featuredImage: '',
  showHeader: true,
  showFooter: true,
  fullWidth: false,
  content: [],
};

const BLOCK_LABELS = {
  hero: 'Hero Banner',
  text: 'Text',
  imageText: 'Image + Text',
  products: 'Product Grid',
  cta: 'Call To Action',
  faq: 'FAQ',
};

function blockTemplate(type) {
  const id = `blk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const common = { id, type };
  if (type === 'hero') return { ...common, title: 'Your headline', subtitle: 'Add a short campaign message.', image: '', buttonText: 'Shop Now', buttonUrl: '/shop', align: 'left' };
  if (type === 'text') return { ...common, heading: 'Section heading', text: 'Write your content here.' };
  if (type === 'imageText') return { ...common, heading: 'Tell your story', text: 'Describe the collection or offer.', image: '', imageSide: 'left', buttonText: '', buttonUrl: '' };
  if (type === 'products') return { ...common, heading: 'Featured Products', productIds: [] };
  if (type === 'cta') return { ...common, heading: 'Ready to order?', text: 'Shop your favourites today.', buttonText: 'Shop Now', buttonUrl: '/shop' };
  if (type === 'faq') return { ...common, heading: 'Frequently Asked Questions', items: [{ q: 'How do I order?', a: 'Choose your product and complete checkout.' }] };
  return common;
}

export default function AdminPageBuilder({ pageId = '' }) {
  const router = useRouter();
  const [form, setForm] = useState(newPage);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(Boolean(pageId));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const isEdit = Boolean(pageId);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch('/api/admin/pages/product-options', { cache: 'no-store' }).then((r) => r.json()),
      pageId ? fetch(`/api/admin/pages/${pageId}`, { cache: 'no-store' }).then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Could not load page.');
        return data;
      }) : Promise.resolve(null),
    ])
      .then(([productData, pageData]) => {
        if (!active) return;
        setProducts(productData.products || []);
        if (pageData?.page) setForm({ ...newPage, ...pageData.page, content: Array.isArray(pageData.page.content) ? pageData.page.content : [] });
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [pageId]);

  const publicUrl = useMemo(() => publicPageHref(form), [form.pageType, form.slug]);

  function change(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function changeTitle(value) {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: prev.slug ? prev.slug : slugifyPage(value),
    }));
  }

  function addBlock(type) {
    setForm((prev) => ({ ...prev, content: [...prev.content, blockTemplate(type)] }));
  }

  function updateBlock(index, patch) {
    setForm((prev) => ({
      ...prev,
      content: prev.content.map((block, i) => i === index ? { ...block, ...patch } : block),
    }));
  }

  function moveBlock(index, direction) {
    setForm((prev) => {
      const next = [...prev.content];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...prev, content: next };
    });
  }

  function duplicateBlock(index) {
    setForm((prev) => {
      const copy = { ...prev.content[index], id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` };
      const next = [...prev.content];
      next.splice(index + 1, 0, copy);
      return { ...prev, content: next };
    });
  }

  function deleteBlock(index) {
    setForm((prev) => ({ ...prev, content: prev.content.filter((_, i) => i !== index) }));
  }

  async function save(statusOverride) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        ...form,
        slug: slugifyPage(form.slug || form.title),
        status: statusOverride || form.status,
      };
      const response = await fetch(isEdit ? `/api/admin/pages/${pageId}` : '/api/admin/pages', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not save page.');
      setForm((prev) => ({ ...prev, ...data.page }));
      setMessage(statusOverride === 'PUBLISHED' ? 'Page published successfully.' : 'Page saved successfully.');
      if (!isEdit) router.replace(`/admin/pages/${data.page.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className={styles.adminPage}>Loading page builder...</div>;

  return (
    <div className={styles.adminPage}>
      <div className={styles.adminHeading}>
        <div>
          <span className={styles.eyebrow}>PAGE BUILDER</span>
          <h1>{isEdit ? 'Edit Page' : 'Create New Page'}</h1>
          <p>Build a responsive page using reusable sections.</p>
        </div>
        <div className={styles.actionRow}>
          <Link href="/admin/pages" className={styles.smallButton}>← All Pages</Link>
          {isEdit && <Link href={`/admin/pages/${pageId}/preview`} className={styles.smallButton}>Preview</Link>}
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {message && <div className={styles.success}>{message}</div>}

      <div className={styles.builderGrid}>
        <main className={styles.builderMain}>
          <section className={styles.card}>
            <h2>Page Details</h2>
            <div className={styles.formGrid}>
              <label className={styles.full}>Page Title<input value={form.title} onChange={(e) => changeTitle(e.target.value)} placeholder="Eid Special Offer" /></label>
              <label>Page Type<select value={form.pageType} onChange={(e) => change('pageType', e.target.value)}><option value="PAGE">Normal Page</option><option value="LANDING">Landing Page</option></select></label>
              <label>Status<select value={form.status} onChange={(e) => change('status', e.target.value)}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option></select></label>
              <label className={styles.full}>URL Slug<div className={styles.slugRow}><span>{form.pageType === 'LANDING' ? '/landing/' : '/page/'}</span><input value={form.slug} onChange={(e) => change('slug', slugifyPage(e.target.value))} placeholder="eid-special" /></div></label>
              <label className={styles.full}>Featured Image URL<input value={form.featuredImage} onChange={(e) => change('featuredImage', e.target.value)} placeholder="https://... or /images/..." /></label>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.sectionHeading}><div><h2>Page Sections</h2><p>Add sections, then move them up or down.</p></div></div>
            <div className={styles.addBlockRow}>
              {Object.entries(BLOCK_LABELS).map(([type, label]) => <button type="button" key={type} onClick={() => addBlock(type)}>+ {label}</button>)}
            </div>

            <div className={styles.blockList}>
              {form.content.length === 0 && <div className={styles.emptyBlocks}>No sections yet. Add a Hero, Text, Product Grid or another section above.</div>}
              {form.content.map((block, index) => (
                <div className={styles.blockCard} key={block.id || index}>
                  <div className={styles.blockTop}>
                    <strong>{index + 1}. {BLOCK_LABELS[block.type] || block.type}</strong>
                    <div className={styles.actionRow}>
                      <button type="button" onClick={() => moveBlock(index, -1)} disabled={index === 0}>↑</button>
                      <button type="button" onClick={() => moveBlock(index, 1)} disabled={index === form.content.length - 1}>↓</button>
                      <button type="button" onClick={() => duplicateBlock(index)}>Duplicate</button>
                      <button type="button" onClick={() => deleteBlock(index)} className={styles.dangerButton}>Delete</button>
                    </div>
                  </div>
                  <BlockEditor block={block} index={index} updateBlock={updateBlock} products={products} />
                </div>
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <h2>SEO</h2>
            <div className={styles.formGrid}>
              <label className={styles.full}>SEO Title<input value={form.seoTitle} onChange={(e) => change('seoTitle', e.target.value)} placeholder={form.title || 'Page title'} /></label>
              <label className={styles.full}>SEO Description<textarea rows="4" value={form.seoDescription} onChange={(e) => change('seoDescription', e.target.value)} placeholder="Short Google/social description" /></label>
            </div>
          </section>
        </main>

        <aside className={styles.builderSidebar}>
          <section className={styles.card}>
            <h2>Publish</h2>
            <p className={styles.muted}>Public URL</p>
            <code className={styles.urlPreview}>{publicUrl}</code>
            <label className={styles.check}><input type="checkbox" checked={form.showHeader} onChange={(e) => change('showHeader', e.target.checked)} /> Show Header</label>
            <label className={styles.check}><input type="checkbox" checked={form.showFooter} onChange={(e) => change('showFooter', e.target.checked)} /> Show Footer</label>
            <label className={styles.check}><input type="checkbox" checked={form.fullWidth} onChange={(e) => change('fullWidth', e.target.checked)} /> Full Width Layout</label>
            <div className={styles.publishButtons}>
              <button type="button" className={styles.secondaryButton} disabled={busy} onClick={() => save('DRAFT')}>{busy ? 'Saving...' : 'Save Draft'}</button>
              <button type="button" className={styles.primaryButton} disabled={busy} onClick={() => save('PUBLISHED')}>{busy ? 'Saving...' : 'Publish'}</button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function BlockEditor({ block, index, updateBlock, products }) {
  const field = (name, value) => updateBlock(index, { [name]: value });

  if (block.type === 'hero') return <div className={styles.formGrid}>
    <label className={styles.full}>Headline<input value={block.title || ''} onChange={(e) => field('title', e.target.value)} /></label>
    <label className={styles.full}>Subtitle<textarea rows="3" value={block.subtitle || ''} onChange={(e) => field('subtitle', e.target.value)} /></label>
    <label className={styles.full}>Background / Hero Image<input value={block.image || ''} onChange={(e) => field('image', e.target.value)} placeholder="https://... or /images/..." /></label>
    <label>Button Text<input value={block.buttonText || ''} onChange={(e) => field('buttonText', e.target.value)} /></label>
    <label>Button URL<input value={block.buttonUrl || ''} onChange={(e) => field('buttonUrl', e.target.value)} /></label>
    <label>Text Align<select value={block.align || 'left'} onChange={(e) => field('align', e.target.value)}><option value="left">Left</option><option value="center">Center</option></select></label>
  </div>;

  if (block.type === 'text') return <div className={styles.formGrid}>
    <label className={styles.full}>Heading<input value={block.heading || ''} onChange={(e) => field('heading', e.target.value)} /></label>
    <label className={styles.full}>Text<textarea rows="7" value={block.text || ''} onChange={(e) => field('text', e.target.value)} /></label>
  </div>;

  if (block.type === 'imageText') return <div className={styles.formGrid}>
    <label className={styles.full}>Heading<input value={block.heading || ''} onChange={(e) => field('heading', e.target.value)} /></label>
    <label className={styles.full}>Text<textarea rows="5" value={block.text || ''} onChange={(e) => field('text', e.target.value)} /></label>
    <label className={styles.full}>Image URL<input value={block.image || ''} onChange={(e) => field('image', e.target.value)} /></label>
    <label>Image Side<select value={block.imageSide || 'left'} onChange={(e) => field('imageSide', e.target.value)}><option value="left">Left</option><option value="right">Right</option></select></label>
    <label>Button Text<input value={block.buttonText || ''} onChange={(e) => field('buttonText', e.target.value)} /></label>
    <label>Button URL<input value={block.buttonUrl || ''} onChange={(e) => field('buttonUrl', e.target.value)} /></label>
  </div>;

  if (block.type === 'products') {
    const selected = Array.isArray(block.productIds) ? block.productIds : [];
    return <div>
      <label className={styles.full}>Section Heading<input value={block.heading || ''} onChange={(e) => field('heading', e.target.value)} /></label>
      <div className={styles.productPicker}>
        {products.map((product) => <label key={product.id} className={styles.productOption}>
          <input type="checkbox" checked={selected.includes(product.id)} onChange={(e) => {
            const next = e.target.checked ? [...selected, product.id] : selected.filter((id) => id !== product.id);
            field('productIds', next.slice(0, 12));
          }} />
          {product.imageUrl ? <img src={product.imageUrl} alt="" /> : <span className={styles.productThumb} />}
          <span>{product.name}<small>৳{product.price}</small></span>
        </label>)}
      </div>
      <p className={styles.muted}>Selected: {selected.length} / 12</p>
    </div>;
  }

  if (block.type === 'cta') return <div className={styles.formGrid}>
    <label className={styles.full}>Heading<input value={block.heading || ''} onChange={(e) => field('heading', e.target.value)} /></label>
    <label className={styles.full}>Text<textarea rows="3" value={block.text || ''} onChange={(e) => field('text', e.target.value)} /></label>
    <label>Button Text<input value={block.buttonText || ''} onChange={(e) => field('buttonText', e.target.value)} /></label>
    <label>Button URL<input value={block.buttonUrl || ''} onChange={(e) => field('buttonUrl', e.target.value)} /></label>
  </div>;

  if (block.type === 'faq') {
    const items = Array.isArray(block.items) ? block.items : [];
    return <div>
      <label className={styles.full}>Section Heading<input value={block.heading || ''} onChange={(e) => field('heading', e.target.value)} /></label>
      {items.map((item, itemIndex) => <div key={itemIndex} className={styles.faqEdit}>
        <input value={item.q || ''} onChange={(e) => field('items', items.map((row, i) => i === itemIndex ? { ...row, q: e.target.value } : row))} placeholder="Question" />
        <textarea rows="2" value={item.a || ''} onChange={(e) => field('items', items.map((row, i) => i === itemIndex ? { ...row, a: e.target.value } : row))} placeholder="Answer" />
        <button type="button" onClick={() => field('items', items.filter((_, i) => i !== itemIndex))}>Remove</button>
      </div>)}
      <button type="button" className={styles.smallButton} onClick={() => field('items', [...items, { q: '', a: '' }])}>+ Add Question</button>
    </div>;
  }

  return null;
}
