'use client';

import { useState } from 'react';
import styles from './PageLeadForm.module.css';

async function readJson(response) {
  const text = await response.text();
  if (!text.trim()) throw new Error(`Server returned an empty response (HTTP ${response.status}).`);
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('Server returned invalid JSON.'); }
  if (!response.ok) throw new Error(data?.error || 'Could not submit the form.');
  return data;
}

export default function PageLeadForm({ page, block }) {
  const fields = block?.fields || {};
  const required = block?.required || {};
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '', company: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function change(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/page-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: page?.id || '',
          pageTitle: page?.title || '',
          pageSlug: page?.slug || '',
          formName: block?.formName || 'Lead Form',
          name: form.name,
          phone: form.phone,
          email: form.email,
          message: form.message,
          company: form.company,
        }),
      });

      await readJson(response);
      setForm({ name: '', phone: '', email: '', message: '', company: '' });
      setSuccess(block?.successMessage || 'Thank you. We received your information.');
    } catch (err) {
      setError(err.message || 'Could not submit the form.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.heading}>
        <h2>{block?.heading || 'Request a Call'}</h2>
        {block?.text && <p>{block.text}</p>}
      </div>

      {success ? (
        <div className={styles.success}>{success}</div>
      ) : (
        <form onSubmit={submit} className={styles.form}>
          <input
            type="text"
            value={form.company}
            onChange={(e) => change('company', e.target.value)}
            className={styles.honeypot}
            tabIndex="-1"
            autoComplete="off"
            aria-hidden="true"
          />

          {fields.name !== false && (
            <label>
              Name {required.name ? '*' : ''}
              <input
                value={form.name}
                onChange={(e) => change('name', e.target.value)}
                required={required.name === true}
                maxLength="120"
              />
            </label>
          )}

          {fields.phone !== false && (
            <label>
              Phone {required.phone ? '*' : ''}
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => change('phone', e.target.value)}
                required={required.phone === true}
                maxLength="40"
              />
            </label>
          )}

          {fields.email === true && (
            <label>
              Email {required.email ? '*' : ''}
              <input
                type="email"
                value={form.email}
                onChange={(e) => change('email', e.target.value)}
                required={required.email === true}
                maxLength="160"
              />
            </label>
          )}

          {fields.message !== false && (
            <label className={styles.full}>
              Message {required.message ? '*' : ''}
              <textarea
                rows="4"
                value={form.message}
                onChange={(e) => change('message', e.target.value)}
                required={required.message === true}
                maxLength="1200"
              />
            </label>
          )}

          {error && <div className={styles.error}>{error}</div>}

          <button
            type="submit"
            disabled={busy}
            className={styles.submit}
            style={{
              backgroundColor: /^#[0-9a-fA-F]{6}$/.test(block?.buttonColor || '') ? block.buttonColor : '#235B37',
              color: /^#[0-9a-fA-F]{6}$/.test(block?.buttonTextColor || '') ? block.buttonTextColor : '#FFFFFF',
            }}
          >
            {busy ? 'Submitting...' : block?.submitText || 'Submit'}
          </button>
        </form>
      )}
    </div>
  );
}
