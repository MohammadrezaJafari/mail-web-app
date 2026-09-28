<template>
  <q-card class="compose-window" :class="{ 'is-minimized': compose.minimized }" flat>
    <q-bar class="compose-bar text-white">
      <span class="ellipsis">{{ subject || t('compose.title') }}</span>
      <q-space />
      <q-btn
        dense
        flat
        :icon="compose.minimized ? 'open_in_full' : 'minimize'"
        size="sm"
        @click="compose.minimized = !compose.minimized"
      >
        <q-tooltip>{{
          compose.minimized ? t('compose.restore') : t('compose.minimize')
        }}</q-tooltip>
      </q-btn>
      <q-btn dense flat icon="close" size="sm" @click="discard"
        ><q-tooltip>{{ t('compose.close') }}</q-tooltip></q-btn
      >
    </q-bar>

    <template v-if="!compose.minimized">
      <q-card-section class="q-py-sm">
        <q-select
          v-if="fromOptions.length > 1"
          v-model="fromAlias"
          :options="fromOptions"
          dense
          borderless
          emit-value
          map-options
          :label="t('compose.sendAs')"
          class="q-mb-xs"
        />
        <recipient-input v-model="to" :label="t('mail.to')" autofocus>
          <template #after>
            <q-btn v-if="!showCc" flat dense no-caps size="sm" label="Cc" @click="showCc = true" />
            <q-btn
              v-if="!showBcc"
              flat
              dense
              no-caps
              size="sm"
              label="Bcc"
              @click="showBcc = true"
            />
          </template>
        </recipient-input>
        <recipient-input v-if="showCc" v-model="cc" :label="t('mail.cc')" />
        <recipient-input v-if="showBcc" v-model="bcc" :label="t('mail.bcc')" />
        <q-input
          v-model="subject"
          dense
          borderless
          :placeholder="t('mail.subject')"
          class="q-mt-xs subject-input bidi-auto"
        />
      </q-card-section>
      <q-separator />

      <q-card-section class="q-pa-none scroll compose-body">
        <q-editor
          v-model="html"
          class="compose-editor"
          flat
          :toolbar="[
            ['bold', 'italic', 'underline', 'strike'],
            ['unordered', 'ordered'],
            ['link', 'quote'],
            ['undo', 'redo'],
          ]"
        />
        <div v-if="files.length" class="row q-gutter-xs q-pa-sm">
          <q-chip
            v-for="(f, i) in files"
            :key="i"
            removable
            icon="attach_file"
            @remove="files.splice(i, 1)"
          >
            {{ f.name }} <span class="text-grey q-ml-xs">({{ fileSize(f.size) }})</span>
          </q-chip>
        </div>
      </q-card-section>
      <q-separator />

      <q-card-actions class="q-px-md">
        <q-btn
          color="primary"
          unelevated
          no-caps
          icon="send"
          :label="t('compose.send')"
          :loading="sending"
          @click="send"
        />
        <q-btn
          flat
          no-caps
          icon="attach_file"
          :label="t('compose.attach')"
          @click="fileInput?.click()"
        />
        <input ref="fileInput" type="file" multiple hidden @change="addFiles" />
        <q-space />
        <q-btn
          flat
          no-caps
          icon="save"
          :label="t('compose.saveDraft')"
          :loading="savingDraft"
          @click="saveDraft"
        />
        <q-btn flat no-caps icon="delete" :label="t('compose.discard')" @click="discard" />
      </q-card-actions>
    </template>
  </q-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useComposeStore } from '@/stores/compose';
import { useAuthStore } from '@/stores/auth';
import { useMailStore } from '@/stores/mail';
import { errorMessage, mailApi } from '@/api';
import { addressLine, fileSize, fullDate, textToHtml } from '@/utils/format';
import RecipientInput from '@/components/mail/RecipientInput.vue';
import type { MessageDetail } from '@/types/api';

const { t, locale } = useI18n();
const $q = useQuasar();
const compose = useComposeStore();
const auth = useAuthStore();
const mail = useMailStore();

const request = compose.request;
const source: MessageDetail | null = request?.source ?? null;
const me = auth.mailbox?.address?.toLowerCase() ?? auth.user?.email?.toLowerCase() ?? '';

const to = ref<string[]>([]);
const cc = ref<string[]>([]);
const bcc = ref<string[]>([]);
const subject = ref('');
const html = ref('');
const files = ref<File[]>([]);
const showCc = ref(false);
const showBcc = ref(false);
const sending = ref(false);
const savingDraft = ref(false);
const fromAlias = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const fromOptions = computed(() => [
  { label: auth.mailbox?.address ?? auth.user?.email ?? '', value: null },
  ...(auth.mailbox?.aliases ?? [])
    .filter((a) => a.is_active)
    .map((a) => ({ label: a.address, value: a.address })),
]);

function signatureHtml(): string {
  const sig = auth.mailbox?.signature?.trim();
  return sig ? `<br><br>-- <br>${textToHtml(sig)}` : '';
}

function quoted(msg: MessageDetail): string {
  const header =
    `<p style="color:#555">${t('mail.originalMessage')}<br>` +
    `<b>${t('mail.from')}:</b> ${addressLine(msg.from ? [msg.from] : [])}<br>` +
    `<b>${t('mail.to')}:</b> ${addressLine(msg.to)}<br>` +
    `${fullDate(msg.date, locale.value)}</p>`;
  const body = msg.html ?? textToHtml(msg.text ?? '');
  return `<br><br>${header}<blockquote style="border-left:3px solid #ccc;padding-left:10px;margin-left:0">${body}</blockquote>`;
}

if (request) {
  if (request.to) to.value = [...request.to];

  if (source && request.mode !== 'new') {
    const replyTo = source.reply_to.length ? source.reply_to : source.from ? [source.from] : [];
    const prefix = (p: string, s: string) => (new RegExp(`^${p}:`, 'i').test(s) ? s : `${p}: ${s}`);

    if (request.mode === 'reply' || request.mode === 'replyAll') {
      to.value = replyTo.map((a) => a.email);
      subject.value = prefix('Re', source.subject);
      html.value = `<p></p>${signatureHtml()}${quoted(source)}`;
    }
    if (request.mode === 'replyAll') {
      const others = [...source.to, ...source.cc]
        .map((a) => a.email)
        .filter((e) => e.toLowerCase() !== me && !to.value.includes(e));
      cc.value = [...new Set(others)];
      showCc.value = cc.value.length > 0;
    }
    if (request.mode === 'forward') {
      subject.value = prefix('Fwd', source.subject);
      html.value = `<p></p>${signatureHtml()}${quoted(source)}`;
    }
  } else {
    html.value = `<p></p>${signatureHtml()}`;
  }
}

function addFiles(event: Event) {
  const input = event.target as HTMLInputElement;
  files.value.push(...Array.from(input.files ?? []));
  input.value = '';
}

function payload() {
  const isReply = source && (request?.mode === 'reply' || request?.mode === 'replyAll');
  return {
    to: to.value,
    cc: cc.value,
    bcc: bcc.value,
    subject: subject.value,
    html: html.value,
    from_alias: fromAlias.value,
    in_reply_to: isReply ? source.message_id : null,
    references: isReply ? source.references : null,
    reply_folder: isReply ? source.folder : null,
    reply_uid: isReply ? source.uid : null,
    attachments: files.value,
  };
}

async function send() {
  if (!to.value.length) {
    $q.notify({ type: 'warning', message: t('compose.recipientRequired') });
    return;
  }
  sending.value = true;
  try {
    await mailApi.send(payload());
    $q.notify({ type: 'positive', message: t('compose.sent') });
    if (payload().reply_uid) mail.patch(payload().reply_uid as number, { answered: true });
    compose.close();
    void mail.loadFolders();
  } catch (e) {
    $q.notify({ type: 'negative', message: errorMessage(e, t('compose.sendFailed')) });
  } finally {
    sending.value = false;
  }
}

async function saveDraft() {
  savingDraft.value = true;
  try {
    await mailApi.saveDraft(payload());
    $q.notify({ type: 'positive', message: t('compose.draftSaved') });
    compose.close();
    void mail.loadFolders();
  } catch (e) {
    $q.notify({ type: 'negative', message: errorMessage(e) });
  } finally {
    savingDraft.value = false;
  }
}

function discard() {
  compose.close();
}
</script>

<style scoped>
.compose-bar {
  background: linear-gradient(90deg, #0f6cbd, #2b88d8);
  height: 40px;
  font-weight: 600;
}
.compose-body {
  flex: 1 1 auto;
  min-height: 0;
  max-height: 55vh;
}
.subject-input :deep(input) {
  font-weight: 600;
}
</style>
