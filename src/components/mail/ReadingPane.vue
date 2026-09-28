<template>
  <div class="mail-pane reading">
    <template v-if="mail.current">
      <!-- Toolbar -->
      <q-toolbar class="reading-toolbar">
        <q-btn flat dense round icon="arrow_back" class="lt-md" @click="emit('back')" />
        <q-btn
          flat
          dense
          no-caps
          icon="reply"
          :label="t('mail.reply')"
          @click="compose.start({ mode: 'reply', source: mail.current })"
        />
        <q-btn
          flat
          dense
          no-caps
          icon="reply_all"
          :label="t('mail.replyAll')"
          @click="compose.start({ mode: 'replyAll', source: mail.current })"
        />
        <q-btn
          flat
          dense
          no-caps
          icon="forward"
          :label="t('mail.forward')"
          @click="compose.start({ mode: 'forward', source: mail.current })"
        />
        <q-separator vertical inset class="q-mx-xs" />
        <q-btn flat dense round icon="delete" @click="remove"
          ><q-tooltip>{{ t('mail.delete') }}</q-tooltip></q-btn
        >
        <q-btn flat dense round icon="drive_file_move">
          <q-tooltip>{{ t('mail.moveTo') }}</q-tooltip>
          <q-menu>
            <q-list dense style="min-width: 200px">
              <q-item
                v-for="f in moveTargets"
                :key="f.path"
                clickable
                v-close-popup
                @click="move(f.path)"
              >
                <q-item-section>{{ f.role ? t(`mail.${f.role}`) : f.name }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
        <q-btn
          flat
          dense
          round
          :icon="mail.current.flagged ? 'flag' : 'outlined_flag'"
          :color="mail.current.flagged ? 'negative' : undefined"
          @click="mail.toggleFlag(mail.current.uid)"
        >
          <q-tooltip>{{ mail.current.flagged ? t('mail.unflag') : t('mail.flag') }}</q-tooltip>
        </q-btn>
        <q-btn
          flat
          dense
          round
          icon="mark_email_unread"
          @click="mail.markSeen([mail.current.uid], false)"
          ><q-tooltip>{{ t('mail.markUnread') }}</q-tooltip></q-btn
        >
      </q-toolbar>
      <q-separator />

      <div class="mail-scroll q-pa-md">
        <div class="text-h6 q-mb-sm">{{ mail.current.subject || t('mail.noSubject') }}</div>

        <div class="row no-wrap items-start q-mb-md">
          <q-avatar
            size="40px"
            text-color="white"
            class="q-mr-sm text-weight-bold"
            :style="{ background: avatarColor(mail.current.from?.email ?? '') }"
          >
            {{ initials(mail.current.from) }}
          </q-avatar>
          <div class="col" style="min-width: 0">
            <div class="row items-baseline no-wrap">
              <span class="text-weight-medium ellipsis">{{ displayName(mail.current.from) }}</span>
              <span class="text-caption text-grey q-ml-sm ellipsis" dir="ltr"
                >&lt;{{ mail.current.from?.email }}&gt;</span
              >
              <q-space />
              <span class="text-caption text-grey">{{ fullDate(mail.current.date, locale) }}</span>
            </div>
            <div class="text-caption text-grey ellipsis">
              <b>{{ t('mail.to') }}:</b> {{ addressLine(mail.current.to) }}
            </div>
            <div v-if="mail.current.cc.length" class="text-caption text-grey ellipsis">
              <b>{{ t('mail.cc') }}:</b> {{ addressLine(mail.current.cc) }}
            </div>
          </div>
        </div>

        <div v-if="visibleAttachments.length" class="row q-gutter-sm q-mb-md">
          <q-chip
            v-for="a in visibleAttachments"
            :key="a.id"
            clickable
            icon="attach_file"
            outline
            color="primary"
            @click="download(a)"
          >
            {{ a.name }} <span class="text-grey q-ml-xs">({{ fileSize(a.size) }})</span>
          </q-chip>
        </div>

        <iframe
          v-if="mail.current.html"
          ref="frame"
          class="mail-body-frame"
          sandbox="allow-same-origin allow-popups"
          referrerpolicy="no-referrer"
          :srcdoc="htmlDoc"
          @load="resizeFrame"
        />
        <pre v-else class="plain-body">{{ mail.current.text }}</pre>
      </div>
    </template>

    <div v-else class="column flex-center text-grey full-height q-pa-xl">
      <q-inner-loading :showing="mail.currentLoading" />
      <q-icon name="drafts" size="64px" />
      <div class="text-subtitle1 q-mt-sm">{{ t('mail.noSelection') }}</div>
      <div class="text-caption">{{ t('mail.noSelectionHint') }}</div>
    </div>
    <q-inner-loading :showing="mail.currentLoading && !!mail.current" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import DOMPurify from 'dompurify';
import { useMailStore } from '@/stores/mail';
import { useComposeStore } from '@/stores/compose';
import { errorMessage, mailApi } from '@/api';
import {
  addressLine,
  avatarColor,
  displayName,
  fileSize,
  fullDate,
  initials,
} from '@/utils/format';
import type { Attachment } from '@/types/api';

const emit = defineEmits<{ back: [] }>();
const { t, locale } = useI18n();
const $q = useQuasar();
const mail = useMailStore();
const compose = useComposeStore();
const frame = ref<HTMLIFrameElement | null>(null);

const visibleAttachments = computed(() =>
  (mail.current?.attachments ?? []).filter((a) => !a.inline || !a.content_id),
);
const moveTargets = computed(() => mail.folders.filter((f) => f.path !== mail.currentFolder));

const htmlDoc = computed(() => {
  const clean = DOMPurify.sanitize(mail.current?.html ?? '', {
    WHOLE_DOCUMENT: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
  });
  const dir = locale.value === 'fa-IR' ? 'rtl' : 'ltr';
  return `<!doctype html><html dir="${dir}"><head><meta charset="utf-8"><base target="_blank">
<style>body{font-family:'Segoe UI',Roboto,Vazirmatn,Tahoma,sans-serif;font-size:14px;line-height:1.5;margin:0;padding:4px;color:#1f1f1f;word-break:break-word}img{max-width:100%;height:auto}a{color:#0f6cbd}blockquote{border-left:3px solid #ddd;margin:8px 0;padding-left:10px;color:#555}</style>
</head><body>${clean}</body></html>`;
});

function resizeFrame() {
  const el = frame.value;
  const body = el?.contentDocument?.body;
  if (el && body) el.style.height = `${Math.max(320, body.scrollHeight + 24)}px`;
}

function remove() {
  if (!mail.current) return;
  const uid = mail.current.uid;
  mail.remove([uid]).then(
    () => $q.notify({ type: 'positive', message: t('mail.deleted') }),
    (e) => $q.notify({ type: 'negative', message: errorMessage(e) }),
  );
}

async function move(to: string) {
  if (!mail.current) return;
  try {
    await mail.move([mail.current.uid], to);
    $q.notify({ type: 'positive', message: t('mail.moved') });
  } catch (e) {
    $q.notify({ type: 'negative', message: errorMessage(e) });
  }
}

async function download(a: Attachment) {
  if (!mail.current) return;
  try {
    const res = await mailApi.downloadAttachment(mail.current.folder, mail.current.uid, a.id);
    const url = URL.createObjectURL(res.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = a.name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch (e) {
    $q.notify({ type: 'negative', message: errorMessage(e) });
  }
}
</script>

<style scoped lang="scss">
.reading {
  border-inline-end: 0;
  position: relative;
}
.reading-toolbar {
  min-height: 44px;
}
.plain-body {
  white-space: pre-wrap;
  font-family: inherit;
  margin: 0;
}
</style>
