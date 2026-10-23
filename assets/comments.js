/* Public post comments. Entries are stored by /api/comments, never in localStorage. */
(() => {
  'use strict';
  let request, activePost;
  window.addEventListener('mamas:articlechange', event => mount(event.detail.article));

  function mount(article) {
    request?.abort();
    activePost = article?.id;
    const host = document.getElementById('postComments');
    if (!host) return;
    host.replaceChildren();
    if (!article) return;
    const post = article.id;
    const controller = request = new AbortController();
    host.innerHTML = `<div class="comments-heading"><span class="eyebrow">THE CONVERSATION</span><h2 id="commentsHeading">Leave a comment.</h2><p>Share a thought or something that helped you. Keep personal medical details private.</p></div><p class="comments-status" id="commentsStatus" role="status" aria-live="polite">Loading comments…</p><button class="comments-retry" type="button" id="commentsRetry" hidden>Try again</button><form class="comment-form" id="commentForm" aria-labelledby="commentsHeading"><fieldset disabled><legend class="sr-only">Your comment</legend><label for="commentName">Your name<input id="commentName" name="name" type="text" autocomplete="nickname" minlength="2" maxlength="60" required></label><label for="commentBody">Your comment<textarea id="commentBody" name="comment" rows="5" minlength="2" maxlength="2000" required placeholder="Add to the conversation…"></textarea></label><div class="comment-trap" aria-hidden="true"><label for="commentWebsite">Leave this field empty<input id="commentWebsite" name="website" type="text" autocomplete="off" tabindex="-1"></label></div><div class="comment-form-end"><p>Your name and comment will be public.</p><button class="btn btn-plum" type="submit">Post comment <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg></button></div></fieldset></form><div class="comments-thread"><h3 id="commentsCount">Comments</h3><p class="comments-empty" id="commentsEmpty" hidden>No comments yet. Start the conversation.</p><ol class="comment-list" id="commentList"></ol></div>`;
    host.setAttribute('aria-labelledby', 'commentsHeading');
    const form = host.querySelector('form');
    const fieldset = form.querySelector('fieldset');
    const status = host.querySelector('#commentsStatus');
    const retry = host.querySelector('#commentsRetry');
    const list = host.querySelector('#commentList');
    let comments = [];
    const current = () => !controller.signal.aborted && activePost === post;
    function render() {
      list.replaceChildren();
      for (const comment of comments) {
        const item = document.createElement('li');
        item.className = 'comment-item';
        const avatar = document.createElement('span');
        avatar.className = 'comment-avatar';
        avatar.setAttribute('aria-hidden', 'true');
        avatar.textContent = [...comment.name.trim()][0]?.toUpperCase() || 'M';
        const content = document.createElement('div');
        const meta = document.createElement('div');
        meta.className = 'comment-meta';
        const author = document.createElement('strong');
        author.textContent = comment.name;
        const time = document.createElement('time');
        const date = new Date(comment.createdAt);
        if (Number.isFinite(date.getTime())) {
          time.dateTime = date.toISOString();
          time.textContent = new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date);
        }
        const text = document.createElement('p');
        text.textContent = comment.comment;
        meta.append(author, time);
        content.append(meta, text);
        item.append(avatar, content);
        list.append(item);
      }
      host.querySelector('#commentsCount').textContent = comments.length === 50 ? '50 recent comments' : `${comments.length} ${comments.length === 1 ? 'comment' : 'comments'}`;
      host.querySelector('#commentsEmpty').hidden = comments.length !== 0;
    }
    async function call(method, body) {
      const response = await fetch(`/api/comments?post=${encodeURIComponent(post)}`, {
        method,
        signal: controller.signal,
        credentials: 'same-origin',
        cache: 'no-store',
        headers: body ? { 'Content-Type': 'application/json' } : {},
        ...(body ? { body: JSON.stringify(body) } : {})
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || 'Comments are temporarily unavailable. Please try again later.');
      if (!data) throw new Error('Comments are temporarily unavailable. Please try again later.');
      return data;
    }
    async function load() {
      retry.hidden = true;
      fieldset.disabled = true;
      status.classList.remove('comments-error');
      status.textContent = 'Loading comments…';
      try {
        const data = await call('GET');
        if (!current()) return;
        if (!Array.isArray(data.comments)) throw new Error('Comments are temporarily unavailable. Please try again later.');
        comments = data.comments.filter(c => typeof c.name === 'string' && typeof c.comment === 'string').slice(0, 50);
        render();
        fieldset.disabled = false;
        status.textContent = '';
      } catch (error) {
        if (!current()) return;
        status.textContent = error.message === 'Failed to fetch' ? 'Unable to load comments. Please check your connection and try again.' : error.message;
        status.classList.add('comments-error');
        retry.hidden = false;
      }
    }
    retry.addEventListener('click', load);
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const name = form.elements.name.value.trim();
      const comment = form.elements.comment.value.trim();
      if (name.length < 2 || comment.length < 2) {
        status.textContent = 'Please enter your name and a comment of at least two characters.';
        status.classList.add('comments-error');
        return;
      }
      const body = { post, name, comment, website: form.elements.website.value };
      fieldset.disabled = true;
      status.classList.remove('comments-error');
      status.textContent = 'Posting your comment…';
      try {
        const data = await call('POST', body);
        if (!current()) return;
        if (!data.comment?.id || typeof data.comment.name !== 'string' || typeof data.comment.comment !== 'string') throw new Error('Your comment could not be confirmed. Reload the comments before trying again.');
        comments = [data.comment, ...comments.filter(c => c.id !== data.comment.id)].slice(0, 50);
        render();
        form.elements.comment.value = '';
        status.textContent = 'Your comment has been posted.';
        list.firstElementChild?.scrollIntoView({ behavior: 'instant', block: 'nearest' });
      } catch (error) {
        if (!current()) return;
        status.textContent = error.message === 'Failed to fetch' ? 'Your comment could not be confirmed. Reload the comments before trying again; your text is still here.' : error.message;
        status.classList.add('comments-error');
      } finally {
        if (current()) fieldset.disabled = false;
      }
    });
    load();
  }
})();
