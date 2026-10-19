#!/usr/bin/env node
/**
 * Read the estimate leads out of R2 from a terminal.
 *
 * Not part of the site. `src/scripts/` is browser code that ships; this
 * directory is operator tooling that never reaches a build. Nothing imports
 * it and nothing breaks if it is deleted.
 *
 * WHY IT EXISTS. Every submission is written to R2 whether or not the email
 * leg works, and between launch and 18 October the email leg did not work at
 * all. R2 therefore holds leads nobody has ever seen. The dashboard can show
 * them one folder at a time, which is fine for "find Tuesday's job" and
 * useless for "who did we miss". This lists the lot in one table.
 *
 * It is read-only. There is no delete here on purpose: a tool that can empty
 * the only surviving copy of a customer enquiry should not be one flag away
 * from doing it by accident.
 *
 * CREDENTIALS come from the environment and must never be written into this
 * file or passed on the command line, where they would land in shell history:
 *
 *   R2_ACCOUNT_ID         the hex string at the front of the R2 endpoint
 *   R2_ACCESS_KEY_ID      from R2 > API > Manage API tokens
 *   R2_SECRET_ACCESS_KEY  shown once, at creation
 *   R2_BUCKET             optional, defaults to idf-estimates
 *
 * Signing is left to curl's own --aws-sigv4, rather than reimplemented here
 * or pulled from the AWS SDK. R2 speaks S3 with region "auto".
 *
 *   node scripts/r2-leads.mjs list              every submission, oldest first
 *   node scripts/r2-leads.mjs list --json       the same, as JSON
 *   node scripts/r2-leads.mjs show IDF-...      one submission in full
 *   node scripts/r2-leads.mjs export ./out      every record and photo to disk
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const run = promisify(execFile);

const ACCOUNT = process.env.R2_ACCOUNT_ID;
const KEY = process.env.R2_ACCESS_KEY_ID;
const SECRET = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET = process.env.R2_BUCKET ?? 'idf-estimates';
const PREFIX = 'estimates/';

if (!ACCOUNT || !KEY || !SECRET) {
  console.error(
    'Missing credentials. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and ' +
      'R2_SECRET_ACCESS_KEY in the environment, not on the command line.',
  );
  process.exit(2);
}

const ENDPOINT = `https://${ACCOUNT}.r2.cloudflarestorage.com`;

/**
 * One signed request, returning the body as a Buffer.
 *
 * --fail-with-body rather than --fail: an S3 error is XML with the reason in
 * it, and throwing away that body to report "exit 22" would turn every
 * permissions mistake into a guess.
 */
const s3 = async (path) => {
  const { stdout } = await run(
    'curl',
    [
      '--silent',
      '--show-error',
      '--fail-with-body',
      '--aws-sigv4', 'aws:amz:auto:s3',
      '--user', `${KEY}:${SECRET}`,
      `${ENDPOINT}${path}`,
    ],
    { encoding: 'buffer', maxBuffer: 256 * 1024 * 1024 },
  );
  return stdout;
};

/* A regex reader rather than an XML parser. The shape here is fixed and
   narrow, every value is a plain scalar, and the alternative is a dependency
   in a repo that currently has none for this. */
const tagged = (xml, tag) => {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return match ? match[1] : null;
};

const unescapeXml = (text) =>
  text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

/** Every key under the prefix, following continuation tokens to the end. */
const listAll = async () => {
  const out = [];
  let token = null;

  do {
    const query = new URLSearchParams({ 'list-type': '2', prefix: PREFIX, 'max-keys': '1000' });
    if (token) query.set('continuation-token', token);

    const xml = (await s3(`/${BUCKET}?${query}`)).toString('utf8');

    for (const block of xml.match(/<Contents>[\s\S]*?<\/Contents>/g) ?? []) {
      out.push({
        key: unescapeXml(tagged(block, 'Key') ?? ''),
        size: Number(tagged(block, 'Size') ?? 0),
        modified: tagged(block, 'LastModified') ?? '',
      });
    }

    token = tagged(xml, 'IsTruncated') === 'true'
      ? unescapeXml(tagged(xml, 'NextContinuationToken') ?? '')
      : null;
  } while (token);

  return out;
};

/**
 * Group the flat key list into one entry per submission.
 *
 * The folder is the unit, not the submission.json: a submission whose record
 * failed to write but whose photos landed would otherwise vanish from this
 * listing entirely, which is the exact kind of silent gap this tool is for.
 */
const group = (objects) => {
  const folders = new Map();

  for (const object of objects) {
    const parts = object.key.split('/');
    if (parts.length < 4) continue;
    const reference = parts[2];
    const entry = folders.get(reference) ?? { reference, month: parts[1], record: null, files: [] };
    if (parts[3] === 'submission.json') entry.record = object;
    else entry.files.push(object);
    folders.set(reference, entry);
  }

  return [...folders.values()].sort((a, b) => a.reference.localeCompare(b.reference));
};

const loadRecord = async (entry) => {
  if (!entry.record) return null;
  try {
    return JSON.parse((await s3(`/${BUCKET}/${entry.record.key}`)).toString('utf8'));
  } catch (err) {
    console.error(`  ! could not read ${entry.record.key}: ${err.message}`);
    return null;
  }
};

const field = (record, ...names) => {
  const fields = record?.fields ?? record ?? {};
  for (const name of names) {
    const value = fields[name];
    if (typeof value === 'string' && value.trim() !== '') return value.trim();
  }
  return '';
};

const pad = (text, width) =>
  (text.length > width ? `${text.slice(0, width - 1)}…` : text).padEnd(width);

const [command = 'list', ...rest] = process.argv.slice(2);

if (command === 'list') {
  const entries = group(await listAll());
  const rows = [];

  for (const entry of entries) {
    const record = await loadRecord(entry);
    rows.push({
      reference: entry.reference,
      submitted: record?.submittedAt ?? entry.record?.modified ?? entry.files[0]?.modified ?? '',
      name: field(record, 'name', 'fullName'),
      phone: field(record, 'phone'),
      email: field(record, 'email'),
      enquiry: field(record, 'enquiry'),
      files: entry.files.length,
      hasRecord: Boolean(entry.record),
    });
  }

  if (rest.includes('--json')) {
    console.log(JSON.stringify(rows, null, 2));
  } else {
    console.log(
      pad('REFERENCE', 20) + pad('SUBMITTED', 22) + pad('NAME', 22) +
      pad('PHONE', 16) + pad('EMAIL', 28) + pad('TYPE', 12) + 'FILES',
    );
    for (const row of rows) {
      console.log(
        pad(row.reference, 20) + pad(row.submitted.slice(0, 19), 22) + pad(row.name, 22) +
        pad(row.phone, 16) + pad(row.email, 28) + pad(row.enquiry, 12) +
        String(row.files) + (row.hasRecord ? '' : '  (NO submission.json)'),
      );
    }
    console.log(`\n${rows.length} submission(s) in ${BUCKET}/${PREFIX}`);
  }
} else if (command === 'show') {
  const reference = rest[0];
  if (!reference) {
    console.error('Usage: node scripts/r2-leads.mjs show IDF-20261018-XXXXX');
    process.exit(2);
  }
  const entry = group(await listAll()).find((candidate) => candidate.reference === reference);
  if (!entry) {
    console.error(`No folder for ${reference}.`);
    process.exit(1);
  }
  console.log(JSON.stringify(await loadRecord(entry), null, 2));
  for (const file of entry.files) console.log(`file: ${file.key}  ${file.size} bytes`);
} else if (command === 'export') {
  const target = rest[0];
  if (!target) {
    console.error('Usage: node scripts/r2-leads.mjs export ./some-directory');
    process.exit(2);
  }
  const objects = await listAll();
  for (const object of objects) {
    const path = join(target, object.key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, await s3(`/${BUCKET}/${object.key}`));
    console.log(`${object.key}  ${object.size} bytes`);
  }
  console.log(`\n${objects.length} object(s) written under ${target}`);
} else {
  console.error(`Unknown command "${command}". Try list, show or export.`);
  process.exit(2);
}
