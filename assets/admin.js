(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  let posts = [], current = null, dirty = false, busy = false, cover = 'pregnancy-alt.webp', gallery = [];
  const imageURL = path => path.startsWith('/api/media?') ? path : `assets/${path}`;
  const text = (tag, value, className) => { const node = document.createElement(tag); node.textContent = value; if (className) node.className = className; return node; };
  function status(message = '') { $('status').textContent = message; }
  function error(message = '') { $('error').textContent = message; $('error').hidden = !message; }
  function authenticated(value) { $('loginPanel').hidden = value; $('workspace').hidden = !value; $('logout').hidden = !value; }
  async function api(path, input) {
    const response = await fetch(path, { method: input ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store', ...(input ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) } : {}) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 && !path.endsWith('/admin')) authenticated(false);
      throw new Error(data.error || 'The request could not be completed. Please try again.');
    }
    return data;
  }
  function setBusy(value) {
    busy = value; $('editorFields').disabled = value;
    $('newPost').disabled = value; $('logout').disabled = value;
    $('postList').querySelectorAll('button').forEach(button => { button.disabled = value; });
  }
  function maySwitch() { return !dirty || window.confirm('Leave this post and discard unsaved changes?'); }
  function renderList() {
    const query = $('postSearch').value.toLowerCase().trim();
    const matches = posts.filter(post => `${post.title} ${post.category}`.toLowerCase().includes(query));
    $('postCount').textContent = `${posts.length} posts · ${posts.filter(post => post.status === 'draft').length} drafts`;
    $('postList').replaceChildren();
    if (!matches.length) $('postList').append(text('p', 'No posts match your search.', 'muted'));
    for (const post of matches) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'post-item'; button.disabled = busy;
      button.classList.toggle('active', post.id === current?.id); button.setAttribute('aria-pressed', String(post.id === current?.id));
      const meta = document.createElement('span'); meta.className = 'post-meta';
      meta.append(text('span', post.status === 'published' ? 'Published' : 'Draft', `badge ${post.status}`), text('span', post.category));
      button.append(meta, text('strong', post.title));
      button.addEventListener('click', () => { if (!busy && maySwitch()) openPost(post); });
      $('postList').append(button);
    }
  }
  async function loadPosts() {
    const data = await api('/api/posts?admin=1');
    posts = data.posts; renderList();
  }
  function sectionText(sections) {
    return sections.map(section => `${section.heading ? `## ${section.heading}\n\n` : ''}${section.paragraphs.join('\n\n')}`).join('\n\n');
  }
  function parseSections(value) {
    const sections = []; let section = { heading: '', paragraphs: [] };
    for (const block of value.trim().split(/\n\s*\n/)) {
      if (!block.trim()) continue;
      if (/^##\s/.test(block.trim())) {
        if (section.paragraphs.length) sections.push(section);
        const [heading, ...rest] = block.trim().split('\n');
        section = { heading: heading.replace(/^##\s+/, ''), paragraphs: rest.join('\n').trim() ? [rest.join('\n').trim()] : [] };
      } else section.paragraphs.push(block.trim());
    }
    if (section.paragraphs.length) sections.push(section);
    return sections;
  }
  function updateSaveLabel() {
    const published = $('postStatus').value === 'published';
    $('savePost').textContent = published ? current?.status === 'published' ? 'Save changes' : 'Publish post' : 'Save draft';
    $('saveHint').textContent = published ? 'Saving makes this version visible to everyone on the blog.' : current?.status === 'published' ? 'Saving as a draft removes this post from the public blog.' : 'Drafts stay private until you publish them.';
  }
  function openPost(post) {
    current = post ? structuredClone(post) : null;
    $('postForm').reset();
    $('postTitle').value = post?.title || ''; $('postSummary').value = post?.summary || '';
    $('postCategory').value = post?.category || 'Pregnancy'; $('postAuthor').value = post?.author || 'Mama’s Love';
    $('coverAlt').value = post?.imageAlt || ''; $('postBody').value = sectionText(post?.sections || []);
    $('postSources').value = (post?.sources || []).map(source => `${source.label} | ${source.url}`).join('\n');
    $('postStatus').value = post?.status || 'draft';
    cover = post?.image || 'pregnancy-alt.webp'; gallery = structuredClone(post?.gallery || []);
    $('coverPreview').src = imageURL(cover); renderGallery();
    $('editorHeading').textContent = post ? 'Edit your post' : 'Write a new post';
    $('savedAt').textContent = post?.updatedAt ? `Last saved ${new Date(post.updatedAt).toLocaleString()}` : post ? 'An existing article from your blog.' : 'Start with a title and a story.';
    $('viewPost').hidden = post?.status !== 'published'; $('viewPost').href = `learn.html#${post?.id || ''}`;
    $('previewPanel').hidden = true; dirty = false; error(); updateSaveLabel(); renderList();
  }
  function renderGallery() {
    $('galleryList').replaceChildren();
    gallery.forEach((picture, index) => {
      const item = document.createElement('div'); item.className = 'gallery-item';
      const image = document.createElement('img'); image.src = imageURL(picture.url); image.alt = picture.alt || 'Uploaded picture';
      const label = text('label', `Picture ${index + 1} description`); const input = document.createElement('input');
      input.value = picture.alt; input.maxLength = 240; input.placeholder = 'Describe this picture';
      input.addEventListener('input', () => { picture.alt = input.value; dirty = true; }); label.append(input);
      const remove = text('button', 'Remove'); remove.type = 'button'; remove.addEventListener('click', () => { gallery.splice(index, 1); dirty = true; renderGallery(); });
      item.append(image, label, remove); $('galleryList').append(item);
    });
  }
  function collect() {
    const sources = $('postSources').value.split('\n').filter(line => line.trim()).map(line => {
      const separator = line.indexOf('|');
      if (separator < 1) throw new Error('Write each source as: label | https://address');
      return { label: line.slice(0, separator).trim(), url: line.slice(separator + 1).trim() };
    });
    return { id: current?.id, revision: current?.revision || 0, title: $('postTitle').value, summary: $('postSummary').value, category: $('postCategory').value, author: $('postAuthor').value, image: cover, imageAlt: $('coverAlt').value, sections: parseSections($('postBody').value), sources, gallery, status: $('postStatus').value };
  }
  async function preparePicture(file) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a JPG, PNG or WebP picture.');
    if (file.size > 15 * 1024 * 1024) throw new Error('Choose a picture smaller than 15 MB.');
    const image = await createImageBitmap(file).catch(() => { throw new Error('This picture could not be opened. Choose another file.'); });
    try {
      if (image.width * image.height > 60 * 1000 * 1000) throw new Error('This picture is too large. Resize it before uploading.');
      const ratio = Math.min(1, 1600 / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.width * ratio)); canvas.height = Math.max(1, Math.round(image.height * ratio));
      const context = canvas.getContext('2d'); context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height);
      let data;
      for (const quality of [.85, .72, .58, .45]) { data = canvas.toDataURL('image/jpeg', quality); if (data.length < 780000) break; }
      if (data.length >= 780000) throw new Error('Choose a smaller picture or crop it before uploading.');
      return data;
    } finally { image.close(); }
  }
  async function upload(event, isCover) {
    const files = [...event.target.files]; if (!files.length || busy) return;
    if (!isCover && gallery.length + files.length > 8) { error('You can add up to eight extra pictures.'); event.target.value = ''; return; }
    setBusy(true); error();
    try {
      for (const [index, file] of files.entries()) {
        status(`Uploading picture ${index + 1} of ${files.length}…`);
        const data = await preparePicture(file); const result = await api('/api/media', { data });
        if (isCover) { cover = result.url; $('coverPreview').src = cover; }
        else { gallery.push({ url: result.url, alt: '' }); renderGallery(); }
        dirty = true;
      }
      status('Picture uploaded. Save the post to publish your changes.');
    } catch (err) { status(); error(err.message); }
    finally { event.target.value = ''; setBusy(false); }
  }
  $('loginForm').addEventListener('submit', async event => {
    event.preventDefault(); error(); const button = event.target.querySelector('button'); button.disabled = true; status('Signing in…');
    try {
      const fields = new FormData(event.target);
      await api('/api/admin', { action: 'login', username: fields.get('username'), password: fields.get('password') });
      event.target.elements.password.value = ''; await loadPosts(); authenticated(true); if (!current && !dirty) openPost(null); status('Welcome to your editor’s desk.');
    } catch (err) { error(err.message); status(); }
    finally { button.disabled = false; }
  });
  $('logout').addEventListener('click', async () => {
    if (!maySwitch()) return; setBusy(true); error();
    try { await api('/api/admin', { action: 'logout' }); dirty = false; current = null; authenticated(false); status('You have signed out.'); }
    catch (err) { error(err.message); } finally { setBusy(false); }
  });
  $('newPost').addEventListener('click', () => { if (maySwitch()) { openPost(null); $('postTitle').focus(); } });
  $('postSearch').addEventListener('input', renderList);
  $('postForm').addEventListener('input', () => { dirty = true; });
  $('postStatus').addEventListener('change', updateSaveLabel);
  $('coverUpload').addEventListener('change', event => upload(event, true));
  $('galleryUpload').addEventListener('change', event => upload(event, false));
  $('postForm').addEventListener('submit', async event => {
    event.preventDefault(); if (busy) return; error(); setBusy(true); status('Saving your post…');
    try {
      const result = await api('/api/posts', collect());
      posts = [result.post, ...posts.filter(post => post.id !== result.post.id)]; openPost(result.post);
      status(result.post.status === 'published' ? 'Published. Your post is now on the blog.' : 'Draft saved. Only the admin can see it.');
    } catch (err) { status(); error(err.message); }
    finally { setBusy(false); }
  });
  $('previewButton').addEventListener('click', () => {
    error();
    try {
      const post = collect(), article = $('previewArticle'); article.replaceChildren();
      article.append(text('p', post.category, 'eyebrow'), text('h1', post.title), text('p', post.summary), text('p', `By ${post.author}`, 'muted'));
      const coverImage = document.createElement('img'); coverImage.src = imageURL(post.image); coverImage.alt = post.imageAlt; article.append(coverImage);
      for (const section of post.sections) { if (section.heading) article.append(text('h2', section.heading)); for (const paragraph of section.paragraphs) article.append(text('p', paragraph)); }
      for (const picture of gallery) { const image = document.createElement('img'); image.src = imageURL(picture.url); image.alt = picture.alt; article.append(image); }
      $('previewPanel').hidden = false; $('previewPanel').scrollIntoView({ behavior: 'instant', block: 'start' });
    } catch (err) { error(err.message); }
  });
  $('closePreview').addEventListener('click', () => { $('previewPanel').hidden = true; });
  window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
  (async () => {
    try {
      const session = await api('/api/admin'); authenticated(session.authenticated);
      if (session.authenticated) { await loadPosts(); openPost(null); }
      else if (!session.storageConfigured) error('Connect Upstash Redis to the Vercel project, then redeploy to enable sign-in.');
      status();
    } catch (err) { authenticated(false); status(); error(err.message); }
  })();
})();
