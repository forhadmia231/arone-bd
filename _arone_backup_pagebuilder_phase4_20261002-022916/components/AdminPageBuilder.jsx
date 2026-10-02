'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { slugifyPage, publicPageHref } from '@/lib/page-builder';
import { PAGE_TEMPLATES, applyPageTemplate } from '@/lib/page-templates';
import PageBuilderLivePreview from './PageBuilderLivePreview';
import styles from './PageBuilder.module.css';

const MAX_IMAGE_BYTES = 450 * 1024;
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

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
  const base = {
    id,
    type,
    backgroundColor: '#FFFFFF',
    textColor: '#17251C',
    paddingTop: 58,
    paddingBottom: 58,
  };

  if (type === 'hero') {
    return {
      ...base,
      backgroundColor: '#173F29',
      textColor: '#FFFFFF',
      title: 'Your headline',
      subtitle: 'Add a short campaign message.',
      image: '',
      buttonText: 'Shop Now',
      buttonUrl: '/shop',
      buttonColor: '#235B37',
      buttonTextColor: '#FFFFFF',
      align: 'left',
      minHeight: 520,
      overlay: 35,
      backgroundPosition: 'center',
    };
  }

  if (type === 'text') {
    return {
      ...base,
      heading: 'Section heading',
      text: 'Write your content here.',
    };
  }

  if (type === 'imageText') {
    return {
      ...base,
      heading: 'Tell your story',
      text: 'Describe the collection or offer.',
      image: '',
      imageSide: 'left',
      buttonText: '',
      buttonUrl: '',
      buttonColor: '#235B37',
      buttonTextColor: '#FFFFFF',
    };
  }

  if (type === 'products') {
    return {
      ...base,
      heading: 'Featured Products',
      productIds: [],
      columns: 4,
      showComparePrice: true,
    };
  }

  if (type === 'cta') {
    return {
      ...base,
      backgroundColor: '#EFF5EB',
      heading: 'Ready to order?',
      text: 'Shop your favourites today.',
      buttonText: 'Shop Now',
      buttonUrl: '/shop',
      buttonColor: '#235B37',
      buttonTextColor: '#FFFFFF',
    };
  }

  if (type === 'faq') {
    return {
      ...base,
      heading: 'Frequently Asked Questions',
      items: [
        {
          q: 'How do I order?',
          a: 'Choose your product and complete checkout.',
        },
      ],
    };
  }

  return base;
}

async function readJson(response, label) {
  const text = await response.text();

  if (!text.trim()) {
    throw new Error(`${label} returned an empty response (HTTP ${response.status}).`);
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`${label} returned invalid JSON (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    throw new Error(data?.error || `${label} failed (HTTP ${response.status}).`);
  }

  return data;
}

export default function AdminPageBuilder({ pageId = '' }) {
  const router = useRouter();
  const [form, setForm] = useState(newPage);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(Boolean(pageId));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [previewDevice, setPreviewDevice] = useState('desktop');
  const [savedSignature, setSavedSignature] = useState(JSON.stringify(newPage));
  const [templateId, setTemplateId] = useState('product-campaign');
  const isEdit = Boolean(pageId);

  const formSignature = useMemo(() => JSON.stringify(form), [form]);
  const hasUnsavedChanges = formSignature !== savedSignature;

  useEffect(() => {
    let active = true;

    Promise.all([
      fetch('/api/admin/pages/product-options', { cache: 'no-store' })
        .then((response) => readJson(response, 'Product list')),
      pageId
        ? fetch(`/api/admin/pages/${pageId}`, { cache: 'no-store' })
            .then((response) => readJson(response, 'Page'))
        : Promise.resolve(null),
    ])
      .then(([productData, pageData]) => {
        if (!active) return;

        setProducts(productData.products || []);

        if (pageData?.page) {
          const loaded = {
            ...newPage,
            ...pageData.page,
            content: Array.isArray(pageData.page.content)
              ? pageData.page.content
              : [],
          };
          setForm(loaded);
          setSavedSignature(JSON.stringify(loaded));
        } else {
          setSavedSignature(JSON.stringify(newPage));
        }
      })
      .catch((err) => {
        if (active) setError(err.message || 'Could not load page builder.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [pageId]);

  useEffect(() => {
    const warn = (event) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasUnsavedChanges]);

  const publicUrl = useMemo(
    () => publicPageHref(form),
    [form.pageType, form.slug]
  );

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
    setForm((prev) => ({
      ...prev,
      content: [...prev.content, blockTemplate(type)],
    }));
  }

  function updateBlock(index, patch) {
    setForm((prev) => ({
      ...prev,
      content: prev.content.map((block, i) =>
        i === index ? { ...block, ...patch } : block
      ),
    }));
  }

  function moveBlock(index, direction) {
    setForm((prev) => {
      const next = [...prev.content];
      const target = index + direction;

      if (target < 0 || target >= next.length) return prev;

      [next[index], next[target]] = [next[target], next[index]];

      return {
        ...prev,
        content: next,
      };
    });
  }

  function duplicateBlock(index) {
    setForm((prev) => {
      const original = prev.content[index];
      const copy = {
        ...original,
        id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        productIds: Array.isArray(original.productIds)
          ? [...original.productIds]
          : original.productIds,
        items: Array.isArray(original.items)
          ? original.items.map((item) => ({ ...item }))
          : original.items,
      };
      const next = [...prev.content];
      next.splice(index + 1, 0, copy);

      return {
        ...prev,
        content: next,
      };
    });
  }

  function deleteBlock(index) {
    setForm((prev) => ({
      ...prev,
      content: prev.content.filter((_, i) => i !== index),
    }));
  }

  function useTemplate() {
    const template = applyPageTemplate(templateId);
    if (!template) return;

    if (
      form.content.length > 0 &&
      !window.confirm('Replace the current page sections with this template?')
    ) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      ...template,
    }));
    setMessage('Template applied. Review the sections, then save or publish.');
    setError('');
  }

  async function duplicateCurrentPage() {
    if (!isEdit || busy) return;

    setBusy(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`/api/admin/pages/${pageId}/duplicate`, {
        method: 'POST',
      });
      const data = await readJson(response, 'Duplicate page');
      router.push(`/admin/pages/${data.page.id}`);
    } catch (err) {
      setError(err.message || 'Could not duplicate page.');
    } finally {
      setBusy(false);
    }
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

      const response = await fetch(
        isEdit ? `/api/admin/pages/${pageId}` : '/api/admin/pages',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await readJson(response, 'Save page');

      const savedPage = {
        ...form,
        ...data.page,
      };

      setForm(savedPage);
      setSavedSignature(JSON.stringify(savedPage));

      setMessage(
        statusOverride === 'PUBLISHED'
          ? 'Page published successfully.'
          : 'Page saved successfully.'
      );

      if (!isEdit) {
        router.replace(`/admin/pages/${data.page.id}`);
      }
    } catch (err) {
      setError(err.message || 'Could not save page.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.adminPage}>
        Loading Page Builder Phase 3...
      </div>
    );
  }

  return (
    <div className={styles.adminPage}>
      <div className={styles.adminHeading}>
        <div>
          <span className={styles.eyebrow}>PAGE BUILDER · PHASE 3</span>
          <h1>{isEdit ? 'Edit Page' : 'Create New Page'}</h1>
          <p>
            Start from templates, build reusable campaigns and preview every device before publishing.
          </p>
        </div>

        <div className={styles.actionRow}>
          <Link href="/admin/pages" className={styles.smallButton}>
            ← All Pages
          </Link>

          {isEdit && (
            <>
              <button
                type="button"
                className={styles.smallButton}
                disabled={busy}
                onClick={duplicateCurrentPage}
              >
                Duplicate Page
              </button>

              <Link
                href={`/admin/pages/${pageId}/preview`}
                className={styles.smallButton}
                target="_blank"
              >
                Open Full Preview ↗
              </Link>
            </>
          )}
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {message && <div className={styles.success}>{message}</div>}

      <div className={styles.builderGrid}>
        <main className={styles.builderMain}>
          <section className={styles.card}>
            <div className={styles.sectionHeading}>
              <div>
                <h2>Starter Templates</h2>
                <p>Apply a ready layout, then replace the text, images and products.</p>
              </div>
            </div>

            <div className={styles.templatePicker}>
              <select
                value={templateId}
                onChange={(event) => setTemplateId(event.target.value)}
              >
                {PAGE_TEMPLATES.map((template) => (
                  <option value={template.id} key={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>

              <button type="button" className={styles.primaryButton} onClick={useTemplate}>
                Apply Template
              </button>
            </div>

            <div className={styles.templateCards}>
              {PAGE_TEMPLATES.map((template) => (
                <button
                  type="button"
                  key={template.id}
                  className={template.id === templateId ? styles.templateActive : ''}
                  onClick={() => setTemplateId(template.id)}
                >
                  <strong>{template.name}</strong>
                  <span>{template.description}</span>
                </button>
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <h2>Page Details</h2>

            <div className={styles.formGrid}>
              <label className={styles.full}>
                Page Title
                <input
                  value={form.title}
                  onChange={(e) => changeTitle(e.target.value)}
                  placeholder="Eid Special Offer"
                />
              </label>

              <label>
                Page Type
                <select
                  value={form.pageType}
                  onChange={(e) => change('pageType', e.target.value)}
                >
                  <option value="PAGE">Normal Page</option>
                  <option value="LANDING">Landing Page</option>
                </select>
              </label>

              <label>
                Status
                <select
                  value={form.status}
                  onChange={(e) => change('status', e.target.value)}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </label>

              <label className={styles.full}>
                URL Slug
                <div className={styles.slugRow}>
                  <span>
                    {form.pageType === 'LANDING' ? '/landing/' : '/page/'}
                  </span>
                  <input
                    value={form.slug}
                    onChange={(e) => change('slug', slugifyPage(e.target.value))}
                    placeholder="eid-special"
                  />
                </div>
              </label>

              <div className={styles.full}>
                <ImageField
                  label="Featured / SEO Image"
                  value={form.featuredImage}
                  onChange={(value) => change('featuredImage', value)}
                  onError={setError}
                />
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.sectionHeading}>
              <div>
                <h2>Page Sections</h2>
                <p>
                  Add sections, customize design, then move them up or down.
                </p>
              </div>
            </div>

            <div className={styles.addBlockRow}>
              {Object.entries(BLOCK_LABELS).map(([type, label]) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => addBlock(type)}
                >
                  + {label}
                </button>
              ))}
            </div>

            <div className={styles.blockList}>
              {form.content.length === 0 && (
                <div className={styles.emptyBlocks}>
                  No sections yet. Add a Hero, Text, Product Grid or another section above.
                </div>
              )}

              {form.content.map((block, index) => (
                <div className={styles.blockCard} key={block.id || index}>
                  <div className={styles.blockTop}>
                    <strong>
                      {index + 1}. {BLOCK_LABELS[block.type] || block.type}
                    </strong>

                    <div className={styles.actionRow}>
                      <button
                        type="button"
                        onClick={() => moveBlock(index, -1)}
                        disabled={index === 0}
                        title="Move up"
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        onClick={() => moveBlock(index, 1)}
                        disabled={index === form.content.length - 1}
                        title="Move down"
                      >
                        ↓
                      </button>

                      <button
                        type="button"
                        onClick={() => duplicateBlock(index)}
                      >
                        Duplicate
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteBlock(index)}
                        className={styles.dangerButton}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <BlockEditor
                    block={block}
                    index={index}
                    updateBlock={updateBlock}
                    products={products}
                    setError={setError}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.previewHeading}>
              <div>
                <h2>Live Preview</h2>
                <p className={styles.muted}>
                  Preview updates instantly without publishing.
                </p>
              </div>

              <div className={styles.deviceButtons}>
                {['desktop', 'tablet', 'mobile'].map((device) => (
                  <button
                    type="button"
                    key={device}
                    className={previewDevice === device ? styles.deviceActive : ''}
                    onClick={() => setPreviewDevice(device)}
                  >
                    {device === 'desktop'
                      ? 'Desktop'
                      : device === 'tablet'
                        ? 'Tablet'
                        : 'Mobile'}
                  </button>
                ))}
              </div>
            </div>

            <PageBuilderLivePreview
              form={form}
              products={products}
              device={previewDevice}
            />
          </section>

          <section className={styles.card}>
            <h2>SEO</h2>

            <div className={styles.formGrid}>
              <label className={styles.full}>
                SEO Title
                <input
                  value={form.seoTitle}
                  onChange={(e) => change('seoTitle', e.target.value)}
                  placeholder={form.title || 'Page title'}
                />
              </label>

              <label className={styles.full}>
                SEO Description
                <textarea
                  rows="4"
                  value={form.seoDescription}
                  onChange={(e) => change('seoDescription', e.target.value)}
                  placeholder="Short Google/social description"
                />
              </label>
            </div>

            <div className={styles.seoPreview}>
              <span>Google Preview</span>
              <strong>{form.seoTitle || form.title || 'Page title'}</strong>
              <code>{publicUrl}</code>
              <p>
                {form.seoDescription ||
                  'Add an SEO description to preview how this page may appear in search results.'}
              </p>
            </div>
          </section>
        </main>

        <aside className={styles.builderSidebar}>
          <section className={styles.card}>
            <h2>Publish</h2>

            <p className={styles.muted}>Public URL</p>
            <code className={styles.urlPreview}>{publicUrl}</code>

            <div
              className={`${styles.saveState} ${
                hasUnsavedChanges ? styles.unsaved : styles.saved
              }`}
            >
              {hasUnsavedChanges ? '● Unsaved changes' : '✓ All changes saved'}
            </div>

            <label className={styles.check}>
              <input
                type="checkbox"
                checked={form.showHeader}
                onChange={(e) => change('showHeader', e.target.checked)}
              />
              Show Header
            </label>

            <label className={styles.check}>
              <input
                type="checkbox"
                checked={form.showFooter}
                onChange={(e) => change('showFooter', e.target.checked)}
              />
              Show Footer
            </label>

            <label className={styles.check}>
              <input
                type="checkbox"
                checked={form.fullWidth}
                onChange={(e) => change('fullWidth', e.target.checked)}
              />
              Full Width Layout
            </label>

            <div className={styles.publishButtons}>
              <button
                type="button"
                className={styles.secondaryButton}
                disabled={busy}
                onClick={() => save('DRAFT')}
              >
                {busy ? 'Saving...' : 'Save Draft'}
              </button>

              <button
                type="button"
                className={styles.primaryButton}
                disabled={busy}
                onClick={() => save('PUBLISHED')}
              >
                {busy ? 'Saving...' : 'Publish'}
              </button>
            </div>

            <p className={styles.saveHint}>
              Images uploaded here are stored with the page. Use optimized WebP/PNG/JPG under 450 KB each.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function BlockEditor({ block, index, updateBlock, products, setError }) {
  const [productSearch, setProductSearch] = useState('');
  const field = (name, value) => updateBlock(index, { [name]: value });

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) return products;

    return products.filter((product) => {
      const category = product.category?.name || '';
      return `${product.name} ${category}`.toLowerCase().includes(query);
    });
  }, [productSearch, products]);

  if (block.type === 'hero') {
    return (
      <div className={styles.editorStack}>
        <div className={styles.formGrid}>
          <label className={styles.full}>
            Headline
            <input
              value={block.title || ''}
              onChange={(e) => field('title', e.target.value)}
            />
          </label>

          <label className={styles.full}>
            Subtitle
            <textarea
              rows="3"
              value={block.subtitle || ''}
              onChange={(e) => field('subtitle', e.target.value)}
            />
          </label>

          <div className={styles.full}>
            <ImageField
              label="Background / Hero Image"
              value={block.image || ''}
              onChange={(value) => field('image', value)}
              onError={setError}
            />
          </div>

          <label>
            Button Text
            <input
              value={block.buttonText || ''}
              onChange={(e) => field('buttonText', e.target.value)}
            />
          </label>

          <label>
            Button URL
            <input
              value={block.buttonUrl || ''}
              onChange={(e) => field('buttonUrl', e.target.value)}
            />
          </label>

          <label>
            Text Align
            <select
              value={block.align || 'left'}
              onChange={(e) => field('align', e.target.value)}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>

          <label>
            Hero Height
            <select
              value={Number(block.minHeight || 520)}
              onChange={(e) => field('minHeight', Number(e.target.value))}
            >
              <option value="360">Compact — 360px</option>
              <option value="440">Medium — 440px</option>
              <option value="520">Large — 520px</option>
              <option value="650">Extra Large — 650px</option>
            </select>
          </label>

          <label>
            Image Position
            <select
              value={block.backgroundPosition || 'center'}
              onChange={(e) => field('backgroundPosition', e.target.value)}
            >
              <option value="top">Top</option>
              <option value="center">Center</option>
              <option value="bottom">Bottom</option>
            </select>
          </label>

          <label>
            Dark Overlay ({Number(block.overlay ?? 35)}%)
            <input
              type="range"
              min="0"
              max="85"
              step="5"
              value={Number(block.overlay ?? 35)}
              onChange={(e) => field('overlay', Number(e.target.value))}
            />
          </label>
        </div>

        <DesignControls block={block} field={field} hasButton />
      </div>
    );
  }

  if (block.type === 'text') {
    return (
      <div className={styles.editorStack}>
        <div className={styles.formGrid}>
          <label className={styles.full}>
            Heading
            <input
              value={block.heading || ''}
              onChange={(e) => field('heading', e.target.value)}
            />
          </label>

          <label className={styles.full}>
            Text
            <textarea
              rows="7"
              value={block.text || ''}
              onChange={(e) => field('text', e.target.value)}
            />
          </label>
        </div>

        <DesignControls block={block} field={field} />
      </div>
    );
  }

  if (block.type === 'imageText') {
    return (
      <div className={styles.editorStack}>
        <div className={styles.formGrid}>
          <label className={styles.full}>
            Heading
            <input
              value={block.heading || ''}
              onChange={(e) => field('heading', e.target.value)}
            />
          </label>

          <label className={styles.full}>
            Text
            <textarea
              rows="5"
              value={block.text || ''}
              onChange={(e) => field('text', e.target.value)}
            />
          </label>

          <div className={styles.full}>
            <ImageField
              label="Section Image"
              value={block.image || ''}
              onChange={(value) => field('image', value)}
              onError={setError}
            />
          </div>

          <label>
            Image Side
            <select
              value={block.imageSide || 'left'}
              onChange={(e) => field('imageSide', e.target.value)}
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </label>

          <label>
            Button Text
            <input
              value={block.buttonText || ''}
              onChange={(e) => field('buttonText', e.target.value)}
            />
          </label>

          <label>
            Button URL
            <input
              value={block.buttonUrl || ''}
              onChange={(e) => field('buttonUrl', e.target.value)}
            />
          </label>
        </div>

        <DesignControls block={block} field={field} hasButton />
      </div>
    );
  }

  if (block.type === 'products') {
    const selected = Array.isArray(block.productIds) ? block.productIds : [];
    const selectedProducts = selected
      .map((id) => products.find((product) => product.id === id))
      .filter(Boolean);

    return (
      <div className={styles.editorStack}>
        <div className={styles.formGrid}>
          <label className={styles.full}>
            Section Heading
            <input
              value={block.heading || ''}
              onChange={(e) => field('heading', e.target.value)}
            />
          </label>

          <label>
            Desktop Columns
            <select
              value={Number(block.columns || 4)}
              onChange={(e) => field('columns', Number(e.target.value))}
            >
              <option value="2">2 Columns</option>
              <option value="3">3 Columns</option>
              <option value="4">4 Columns</option>
            </select>
          </label>

          <label className={styles.checkField}>
            <input
              type="checkbox"
              checked={block.showComparePrice !== false}
              onChange={(e) => field('showComparePrice', e.target.checked)}
            />
            Show Compare Price
          </label>
        </div>

        <div className={styles.productTools}>
          <input
            type="search"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Search product or category..."
          />
          <strong>{selected.length} / 24 selected</strong>
        </div>

        {selectedProducts.length > 0 && (
          <div className={styles.selectedProducts}>
            {selectedProducts.map((product) => (
              <button
                type="button"
                key={product.id}
                onClick={() => field('productIds', selected.filter((id) => id !== product.id))}
                title="Remove product"
              >
                {product.name} ×
              </button>
            ))}
          </div>
        )}

        <div className={styles.productPicker}>
          {filteredProducts.map((product) => (
            <label key={product.id} className={styles.productOption}>
              <input
                type="checkbox"
                checked={selected.includes(product.id)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...selected, product.id]
                    : selected.filter((id) => id !== product.id);

                  field('productIds', next.slice(0, 24));
                }}
              />

              {product.imageUrl ? (
                <img src={product.imageUrl} alt="" />
              ) : (
                <span className={styles.productThumb} />
              )}

              <span>
                {product.name}
                <small>
                  ৳{product.price}
                  {product.category?.name ? ` · ${product.category.name}` : ''}
                  {typeof product.stock === 'number' ? ` · Stock ${product.stock}` : ''}
                </small>
              </span>
            </label>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className={styles.productNoResults}>No matching products.</div>
        )}

        <DesignControls block={block} field={field} />
      </div>
    );
  }

  if (block.type === 'cta') {
    return (
      <div className={styles.editorStack}>
        <div className={styles.formGrid}>
          <label className={styles.full}>
            Heading
            <input
              value={block.heading || ''}
              onChange={(e) => field('heading', e.target.value)}
            />
          </label>

          <label className={styles.full}>
            Text
            <textarea
              rows="3"
              value={block.text || ''}
              onChange={(e) => field('text', e.target.value)}
            />
          </label>

          <label>
            Button Text
            <input
              value={block.buttonText || ''}
              onChange={(e) => field('buttonText', e.target.value)}
            />
          </label>

          <label>
            Button URL
            <input
              value={block.buttonUrl || ''}
              onChange={(e) => field('buttonUrl', e.target.value)}
            />
          </label>
        </div>

        <DesignControls block={block} field={field} hasButton />
      </div>
    );
  }

  if (block.type === 'faq') {
    const items = Array.isArray(block.items) ? block.items : [];

    return (
      <div className={styles.editorStack}>
        <label className={styles.full}>
          Section Heading
          <input
            value={block.heading || ''}
            onChange={(e) => field('heading', e.target.value)}
          />
        </label>

        {items.map((item, itemIndex) => (
          <div key={itemIndex} className={styles.faqEdit}>
            <input
              value={item.q || ''}
              onChange={(e) =>
                field(
                  'items',
                  items.map((row, i) =>
                    i === itemIndex
                      ? { ...row, q: e.target.value }
                      : row
                  )
                )
              }
              placeholder="Question"
            />

            <textarea
              rows="2"
              value={item.a || ''}
              onChange={(e) =>
                field(
                  'items',
                  items.map((row, i) =>
                    i === itemIndex
                      ? { ...row, a: e.target.value }
                      : row
                  )
                )
              }
              placeholder="Answer"
            />

            <button
              type="button"
              onClick={() =>
                field(
                  'items',
                  items.filter((_, i) => i !== itemIndex)
                )
              }
            >
              Remove
            </button>
          </div>
        ))}

        <button
          type="button"
          className={styles.smallButton}
          onClick={() => field('items', [...items, { q: '', a: '' }])}
        >
          + Add Question
        </button>

        <DesignControls block={block} field={field} />
      </div>
    );
  }

  return null;
}

function DesignControls({ block, field, hasButton = false }) {
  return (
    <details className={styles.designPanel}>
      <summary>Design & Spacing</summary>

      <div className={styles.designGrid}>
        <ColorField
          label="Background Color"
          value={block.backgroundColor || '#FFFFFF'}
          onChange={(value) => field('backgroundColor', value)}
        />

        <ColorField
          label="Text Color"
          value={block.textColor || '#17251C'}
          onChange={(value) => field('textColor', value)}
        />

        {hasButton && (
          <>
            <ColorField
              label="Button Color"
              value={block.buttonColor || '#235B37'}
              onChange={(value) => field('buttonColor', value)}
            />

            <ColorField
              label="Button Text"
              value={block.buttonTextColor || '#FFFFFF'}
              onChange={(value) => field('buttonTextColor', value)}
            />
          </>
        )}

        <label>
          Top Spacing (px)
          <input
            type="number"
            min="0"
            max="160"
            step="4"
            value={Number(block.paddingTop ?? 58)}
            onChange={(e) => field('paddingTop', Number(e.target.value))}
          />
        </label>

        <label>
          Bottom Spacing (px)
          <input
            type="number"
            min="0"
            max="160"
            step="4"
            value={Number(block.paddingBottom ?? 58)}
            onChange={(e) => field('paddingBottom', Number(e.target.value))}
          />
        </label>
      </div>
    </details>
  );
}

function ColorField({ label, value, onChange }) {
  const safeValue = /^#[0-9a-fA-F]{6}$/.test(value || '')
    ? value
    : '#FFFFFF';

  return (
    <label>
      {label}
      <div className={styles.colorInputRow}>
        <input
          type="color"
          value={safeValue}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
        />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#FFFFFF"
          maxLength="7"
        />
      </div>
    </label>
  );
}

function ImageField({ label, value, onChange, onError }) {
  function upload(event) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (!IMAGE_TYPES.includes(file.type)) {
      onError?.('Only PNG, JPG and WebP images are allowed.');
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      onError?.('Image is too large. Please optimize it to under 450 KB.');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      onError?.('');
      onChange(String(reader.result || ''));
    };

    reader.onerror = () => {
      onError?.('Could not read the selected image.');
    };

    reader.readAsDataURL(file);
  }

  const isDataUrl = String(value || '').startsWith('data:image/');

  return (
    <div className={styles.imageField}>
      <div className={styles.imageFieldHead}>
        <strong>{label}</strong>
        <span>WebP / PNG / JPG · max 450 KB</span>
      </div>

      <div className={styles.imageFieldControls}>
        <label className={styles.uploadButton}>
          Upload Image
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={upload}
          />
        </label>

        <input
          type="text"
          value={isDataUrl ? '' : value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Or paste https://... or /images/..."
        />

        {value && (
          <button
            type="button"
            className={styles.removeImageButton}
            onClick={() => onChange('')}
          >
            Remove
          </button>
        )}
      </div>

      {value && (
        <div className={styles.imagePreviewBox}>
          <img src={value} alt="Selected preview" />
          {isDataUrl && <span>Uploaded image ready to save</span>}
        </div>
      )}
    </div>
  );
}
