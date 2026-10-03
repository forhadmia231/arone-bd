'use client';

import { useMemo } from 'react';
import styles from './PageBuilder.module.css';
import BundleBlockEditor from './BundleBlockEditor';

const MAX_IMAGE_BYTES = 450 * 1024;
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

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

function AdvancedImageField({ label, value, onChange, onError, media = [] }) {
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
    reader.onerror = () => onError?.('Could not read the selected image.');
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

        {media.length > 0 && (
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) onChange(e.target.value);
            }}
          >
            <option value="">Choose from Media Library...</option>
            {media.map((item) => (
              <option key={item.id} value={item.url}>
                {item.name}
              </option>
            ))}
          </select>
        )}

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

export default function AdvancedBlockEditor({
  block,
  index,
  updateBlock,
  media = [],
  setError,
}) {
  const field = (name, value) => updateBlock(index, { [name]: value });

  const testimonials = useMemo(
    () => (Array.isArray(block.items) ? block.items : []),
    [block.items]
  );

  if (block.type === 'countdown') {
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
            Message
            <textarea
              rows="3"
              value={block.text || ''}
              onChange={(e) => field('text', e.target.value)}
            />
          </label>
          <label>
            Offer Ends At
            <input
              type="datetime-local"
              value={block.endsAt || ''}
              onChange={(e) => field('endsAt', e.target.value)}
            />
          </label>
          <label>
            Expired Text
            <input
              value={block.expiredText || ''}
              onChange={(e) => field('expiredText', e.target.value)}
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
          <label className={styles.checkField}>
            <input
              type="checkbox"
              checked={block.showDays !== false}
              onChange={(e) => field('showDays', e.target.checked)}
            />
            Show days
          </label>
        </div>
        <DesignControls block={block} field={field} hasButton />
      </div>
    );
  }

  if (block.type === 'trust') {
    const items = Array.isArray(block.items) ? block.items : [];

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
            Columns
            <select
              value={Number(block.columns || 3)}
              onChange={(e) => field('columns', Number(e.target.value))}
            >
              <option value="2">2 columns</option>
              <option value="3">3 columns</option>
              <option value="4">4 columns</option>
            </select>
          </label>
        </div>

        {items.map((item, itemIndex) => (
          <div key={itemIndex} className={styles.faqEdit}>
            <input
              value={item.icon || ''}
              onChange={(e) =>
                field(
                  'items',
                  items.map((row, i) =>
                    i === itemIndex ? { ...row, icon: e.target.value } : row
                  )
                )
              }
              placeholder="Icon / emoji e.g. ✓"
            />
            <input
              value={item.title || ''}
              onChange={(e) =>
                field(
                  'items',
                  items.map((row, i) =>
                    i === itemIndex ? { ...row, title: e.target.value } : row
                  )
                )
              }
              placeholder="Title"
            />
            <textarea
              rows="2"
              value={item.text || ''}
              onChange={(e) =>
                field(
                  'items',
                  items.map((row, i) =>
                    i === itemIndex ? { ...row, text: e.target.value } : row
                  )
                )
              }
              placeholder="Short supporting text"
            />
            <button
              type="button"
              onClick={() =>
                field('items', items.filter((_, i) => i !== itemIndex))
              }
            >
              Remove
            </button>
          </div>
        ))}

        <button
          type="button"
          className={styles.smallButton}
          onClick={() =>
            field('items', [
              ...items,
              { icon: '✓', title: 'Trust point', text: 'Add a short benefit.' },
            ])
          }
        >
          + Add Trust Item
        </button>

        <DesignControls block={block} field={field} />
      </div>
    );
  }

  if (block.type === 'testimonials') {
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
            Columns
            <select
              value={Number(block.columns || 3)}
              onChange={(e) => field('columns', Number(e.target.value))}
            >
              <option value="1">1 column</option>
              <option value="2">2 columns</option>
              <option value="3">3 columns</option>
            </select>
          </label>
        </div>

        {testimonials.map((item, itemIndex) => (
          <div key={itemIndex} className={styles.faqEdit}>
            <input
              value={item.name || ''}
              onChange={(e) =>
                field(
                  'items',
                  testimonials.map((row, i) =>
                    i === itemIndex ? { ...row, name: e.target.value } : row
                  )
                )
              }
              placeholder="Customer name"
            />
            <select
              value={Number(item.rating || 5)}
              onChange={(e) =>
                field(
                  'items',
                  testimonials.map((row, i) =>
                    i === itemIndex
                      ? { ...row, rating: Number(e.target.value) }
                      : row
                  )
                )
              }
            >
              <option value="5">★★★★★ 5 stars</option>
              <option value="4">★★★★☆ 4 stars</option>
              <option value="3">★★★☆☆ 3 stars</option>
            </select>
            <textarea
              rows="3"
              value={item.text || ''}
              onChange={(e) =>
                field(
                  'items',
                  testimonials.map((row, i) =>
                    i === itemIndex ? { ...row, text: e.target.value } : row
                  )
                )
              }
              placeholder="Customer review"
            />
            <button
              type="button"
              onClick={() =>
                field(
                  'items',
                  testimonials.filter((_, i) => i !== itemIndex)
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
          onClick={() =>
            field('items', [
              ...testimonials,
              { name: 'Customer', rating: 5, text: 'Write the review here.' },
            ])
          }
        >
          + Add Testimonial
        </button>

        <DesignControls block={block} field={field} />
      </div>
    );
  }


  if (block.type === 'liveReviews') {
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
            Reviews to Show
            <select
              value={Number(block.limit || 6)}
              onChange={(e) => field('limit', Number(e.target.value))}
            >
              <option value="3">3 reviews</option>
              <option value="6">6 reviews</option>
              <option value="9">9 reviews</option>
              <option value="12">12 reviews</option>
            </select>
          </label>

          <label>
            Minimum Rating
            <select
              value={Number(block.minRating || 1)}
              onChange={(e) => field('minRating', Number(e.target.value))}
            >
              <option value="1">1+ stars</option>
              <option value="2">2+ stars</option>
              <option value="3">3+ stars</option>
              <option value="4">4+ stars</option>
              <option value="5">5 stars only</option>
            </select>
          </label>

          <label>
            Columns
            <select
              value={Number(block.columns || 3)}
              onChange={(e) => field('columns', Number(e.target.value))}
            >
              <option value="1">1 column</option>
              <option value="2">2 columns</option>
              <option value="3">3 columns</option>
            </select>
          </label>

          <label className={styles.full}>
            Review Submission Link
            <input
              value={block.submitLink || '/reviews'}
              onChange={(e) => field('submitLink', e.target.value)}
              placeholder="/reviews"
            />
          </label>
        </div>

        <div className={styles.formGrid}>
          <label className={styles.checkField}>
            <input
              type="checkbox"
              checked={block.featuredOnly === true}
              onChange={(e) => field('featuredOnly', e.target.checked)}
            />
            Featured reviews only
          </label>

          <label className={styles.checkField}>
            <input
              type="checkbox"
              checked={block.showImages !== false}
              onChange={(e) => field('showImages', e.target.checked)}
            />
            Show customer images
          </label>

          <label className={styles.checkField}>
            <input
              type="checkbox"
              checked={block.showSource !== false}
              onChange={(e) => field('showSource', e.target.checked)}
            />
            Show review source
          </label>

          <label className={styles.checkField}>
            <input
              type="checkbox"
              checked={block.showSubmitLink !== false}
              onChange={(e) => field('showSubmitLink', e.target.checked)}
            />
            Show “Write a Review” link
          </label>
        </div>

        <p className={styles.muted}>
          Reviews come from Admin → Reviews. Only approved reviews are shown publicly.
        </p>

        <DesignControls block={block} field={field} />
      </div>
    );
  }

  if (block.type === 'video') {
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
            Intro Text
            <textarea
              rows="3"
              value={block.text || ''}
              onChange={(e) => field('text', e.target.value)}
            />
          </label>
          <label className={styles.full}>
            YouTube / Vimeo URL
            <input
              value={block.videoUrl || ''}
              onChange={(e) => field('videoUrl', e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </label>
          <label>
            Video Width
            <select
              value={block.width || 'wide'}
              onChange={(e) => field('width', e.target.value)}
            >
              <option value="normal">Normal</option>
              <option value="wide">Wide</option>
              <option value="full">Full width</option>
            </select>
          </label>
        </div>
        <DesignControls block={block} field={field} />
      </div>
    );
  }

  if (block.type === 'gallery') {
    const images = Array.isArray(block.images) ? block.images : [];

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
            Columns
            <select
              value={Number(block.columns || 3)}
              onChange={(e) => field('columns', Number(e.target.value))}
            >
              <option value="2">2 columns</option>
              <option value="3">3 columns</option>
              <option value="4">4 columns</option>
            </select>
          </label>
          <label>
            Image Fit
            <select
              value={block.imageFit || 'cover'}
              onChange={(e) => field('imageFit', e.target.value)}
            >
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
            </select>
          </label>
        </div>

        {images.map((item, imageIndex) => (
          <div key={item.id || imageIndex} className={styles.editorStack}>
            <AdvancedImageField
              label={`Gallery Image ${imageIndex + 1}`}
              value={item.url || ''}
              onChange={(value) =>
                field(
                  'images',
                  images.map((row, i) =>
                    i === imageIndex ? { ...row, url: value } : row
                  )
                )
              }
              onError={setError}
              media={media}
            />
            <div className={styles.formGrid}>
              <label>
                Alt Text
                <input
                  value={item.alt || ''}
                  onChange={(e) =>
                    field(
                      'images',
                      images.map((row, i) =>
                        i === imageIndex ? { ...row, alt: e.target.value } : row
                      )
                    )
                  }
                />
              </label>
              <button
                type="button"
                className={styles.dangerButton}
                onClick={() =>
                  field('images', images.filter((_, i) => i !== imageIndex))
                }
              >
                Remove Image
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          className={styles.smallButton}
          onClick={() =>
            field('images', [
              ...images,
              {
                id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                url: '',
                alt: '',
              },
            ])
          }
        >
          + Add Gallery Image
        </button>

        <DesignControls block={block} field={field} />
      </div>
    );
  }


  if (block.type === 'steps') {
    const items = Array.isArray(block.items) ? block.items : [];

    return (
      <div className={styles.editorStack}>
        <div className={styles.formGrid}>
          <label className={styles.full}>
            Section Heading
            <input value={block.heading || ''} onChange={(e) => field('heading', e.target.value)} />
          </label>
          <label>
            Columns
            <select value={Number(block.columns || 3)} onChange={(e) => field('columns', Number(e.target.value))}>
              <option value="2">2 columns</option>
              <option value="3">3 columns</option>
              <option value="4">4 columns</option>
            </select>
          </label>
        </div>

        {items.map((item, itemIndex) => (
          <div key={itemIndex} className={styles.faqEdit}>
            <input
              value={item.title || ''}
              onChange={(e) => field('items', items.map((row, i) => i === itemIndex ? { ...row, title: e.target.value } : row))}
              placeholder={`Step ${itemIndex + 1} title`}
            />
            <textarea
              rows="2"
              value={item.text || ''}
              onChange={(e) => field('items', items.map((row, i) => i === itemIndex ? { ...row, text: e.target.value } : row))}
              placeholder="Step description"
            />
            <button type="button" onClick={() => field('items', items.filter((_, i) => i !== itemIndex))}>Remove</button>
          </div>
        ))}

        <button
          type="button"
          className={styles.smallButton}
          onClick={() => field('items', [...items, { title: `Step ${items.length + 1}`, text: 'Add the next step.' }])}
        >
          + Add Step
        </button>
        <DesignControls block={block} field={field} />
      </div>
    );
  }

  if (block.type === 'comparison') {
    const rows = Array.isArray(block.rows) ? block.rows : [];

    return (
      <div className={styles.editorStack}>
        <div className={styles.formGrid}>
          <label className={styles.full}>
            Section Heading
            <input value={block.heading || ''} onChange={(e) => field('heading', e.target.value)} />
          </label>
          <label>
            Feature Column Label
            <input value={block.featureLabel || ''} onChange={(e) => field('featureLabel', e.target.value)} />
          </label>
          <label>
            Your Column Label
            <input value={block.ourLabel || ''} onChange={(e) => field('ourLabel', e.target.value)} />
          </label>
          <label>
            Other Column Label
            <input value={block.otherLabel || ''} onChange={(e) => field('otherLabel', e.target.value)} />
          </label>
          <ColorField
            label="Highlight Color"
            value={block.highlightColor || '#EDF4E8'}
            onChange={(value) => field('highlightColor', value)}
          />
        </div>

        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className={styles.faqEdit}>
            <input
              value={row.feature || ''}
              onChange={(e) => field('rows', rows.map((item, i) => i === rowIndex ? { ...item, feature: e.target.value } : item))}
              placeholder="Feature"
            />
            <input
              value={row.ours || ''}
              onChange={(e) => field('rows', rows.map((item, i) => i === rowIndex ? { ...item, ours: e.target.value } : item))}
              placeholder="Arone Bd value"
            />
            <input
              value={row.others || ''}
              onChange={(e) => field('rows', rows.map((item, i) => i === rowIndex ? { ...item, others: e.target.value } : item))}
              placeholder="Others value"
            />
            <button type="button" onClick={() => field('rows', rows.filter((_, i) => i !== rowIndex))}>Remove</button>
          </div>
        ))}

        <button type="button" className={styles.smallButton} onClick={() => field('rows', [...rows, { feature: '', ours: '✓', others: '—' }])}>
          + Add Comparison Row
        </button>
        <DesignControls block={block} field={field} />
      </div>
    );
  }

  if (block.type === 'coupon') {
    return (
      <div className={styles.editorStack}>
        <div className={styles.formGrid}>
          <label className={styles.full}>
            Heading
            <input value={block.heading || ''} onChange={(e) => field('heading', e.target.value)} />
          </label>
          <label className={styles.full}>
            Message
            <textarea rows="3" value={block.text || ''} onChange={(e) => field('text', e.target.value)} />
          </label>
          <label>
            Coupon Code
            <input value={block.code || ''} onChange={(e) => field('code', e.target.value.toUpperCase())} placeholder="ARONE10" />
          </label>
          <label>
            Button Text
            <input value={block.buttonText || ''} onChange={(e) => field('buttonText', e.target.value)} />
          </label>
          <label>
            Copied Text
            <input value={block.copiedText || ''} onChange={(e) => field('copiedText', e.target.value)} />
          </label>
          <label className={styles.full}>
            Note / Terms
            <input value={block.note || ''} onChange={(e) => field('note', e.target.value)} />
          </label>
        </div>
        <DesignControls block={block} field={field} hasButton />
      </div>
    );
  }

  if (block.type === 'beforeAfter') {
    return (
      <div className={styles.editorStack}>
        <div className={styles.formGrid}>
          <label className={styles.full}>
            Heading
            <input value={block.heading || ''} onChange={(e) => field('heading', e.target.value)} />
          </label>
          <label className={styles.full}>
            Intro Text
            <textarea rows="2" value={block.text || ''} onChange={(e) => field('text', e.target.value)} />
          </label>
          <label>
            Before Label
            <input value={block.beforeLabel || ''} onChange={(e) => field('beforeLabel', e.target.value)} />
          </label>
          <label>
            After Label
            <input value={block.afterLabel || ''} onChange={(e) => field('afterLabel', e.target.value)} />
          </label>
          <label>
            Starting Slider ({Number(block.startPosition ?? 50)}%)
            <input
              type="range"
              min="5"
              max="95"
              value={Number(block.startPosition ?? 50)}
              onChange={(e) => field('startPosition', Number(e.target.value))}
            />
          </label>
        </div>

        <AdvancedImageField
          label="Before Image"
          value={block.beforeImage || ''}
          onChange={(value) => field('beforeImage', value)}
          onError={setError}
          media={media}
        />
        <AdvancedImageField
          label="After Image"
          value={block.afterImage || ''}
          onChange={(value) => field('afterImage', value)}
          onError={setError}
          media={media}
        />
        <DesignControls block={block} field={field} />
      </div>
    );
  }

  if (block.type === 'specs') {
    const rows = Array.isArray(block.rows) ? block.rows : [];

    return (
      <div className={styles.editorStack}>
        <label className={styles.full}>
          Section Heading
          <input value={block.heading || ''} onChange={(e) => field('heading', e.target.value)} />
        </label>

        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className={styles.faqEdit}>
            <input
              value={row.label || ''}
              onChange={(e) => field('rows', rows.map((item, i) => i === rowIndex ? { ...item, label: e.target.value } : item))}
              placeholder="Specification name"
            />
            <input
              value={row.value || ''}
              onChange={(e) => field('rows', rows.map((item, i) => i === rowIndex ? { ...item, value: e.target.value } : item))}
              placeholder="Value"
            />
            <button type="button" onClick={() => field('rows', rows.filter((_, i) => i !== rowIndex))}>Remove</button>
          </div>
        ))}

        <button type="button" className={styles.smallButton} onClick={() => field('rows', [...rows, { label: '', value: '' }])}>
          + Add Specification
        </button>
        <DesignControls block={block} field={field} />
      </div>
    );
  }


  if (block.type === 'bundleOffer') {
    return <BundleBlockEditor block={block} field={field} />;
  }

  return null;
}
