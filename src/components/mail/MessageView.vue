<template>
  <div class="message-view" :class="{ 'is-collapsed': collapsed }">
    <div class="row no-wrap items-start q-pa-md cursor-pointer" @click="collapsed = !collapsed">
      <q-avatar
        size="40px"
        text-color="white"
        class="q-mr-sm text-weight-bold"
        :style="{ background: avatarColor(message.from?.email ?? '') }"
      >
        {{ initials(message.from) }}
      </q-avatar>
      <div class="col" style="min-width: 0">
        <div class="row items-baseline no-wrap">
          <span class="text-weight-medium ellipsis">{{ displayName(message.from) }}</span>
          <span class="text-caption text-grey q-ml-sm ellipsis" dir="ltr"
            >&lt;{{ message.from?.email }}&gt;</span
          >
          <q-space />
          <span class="text-caption text-grey">{{
            collapsed ? listDate(message.date, locale) : fullDate(message.date, locale)
          }}</span>
        </div>
        <div v-if="collapsed" class="text-caption text-grey ellipsis bidi-auto">
          {{ message.preview }}
        </div>
        <template v-else>
          <div class="text-caption text-grey ellipsis">
            <b>{{ t('mail.to') }}:</b> {{ addressLine(message.to) }}
          </div>
          <div v-if="message.cc.length" class="text-caption text-grey ellipsis">
            <b>{{ t('mail.cc') }}:</b> {{ addressLine(message.cc) }}
          </div>
        </template>
      </div>
      <q-btn
        v-if="!collapsed"
        flat
        dense
        round
        size="sm"
        icon="reply"
        class="q-ml-xs"
        @click.stop="emit('reply', message)"
        ><q-tooltip>{{ t('mail.reply') }}</q-tooltip></q-btn
      >
    </div>

    <div v-if="!collapsed" class="q-px-md q-pb-md">
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
        v-if="message.html"
        ref="frame"
        class="mail-body-frame"
        sandbox="allow-same-origin allow-popups"
        referrerpolicy="no-referrer"
        :srcdoc="htmlDoc"
        @load="resizeFrame"
      />
      <pre v-else class="plain-body">{{ message.text }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import DOMPurify from 'dompurify';
import { errorMessage, mailApi } from '@/api';
import {
  addressLine,
  avatarColor,
  displayName,
  fileSize,
  fullDate,
  initials,
  listDate,
} from '@/utils/format';
import type { Attachment, MessageDetail } from '@/types/api';

const props = defineProps<{ message: MessageDetail; startCollapsed?: boolean }>();
const emit = defineEmits<{ reply: [message: MessageDetail] }>();
const { t, locale } = useI18n();
const $q = useQuasar();
const collapsed = ref(props.startCollapsed ?? false);
const frame = ref<HTMLIFrameElement | null>(null);

const visibleAttachments = computed(() =>
  props.message.attachments.filter((a) => !a.inline || !a.content_id),
);

const htmlDoc = computed(() => {
  const clean = DOMPurify.sanitize(props.message.html ?? '', {
    WHOLE_DOCUMENT: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
  });
  const dir = locale.value === 'fa-IR' ? 'rtl' : 'ltr';
  return `<!doctype html><html dir="${dir}"><head><meta charset="utf-8"><base target="_blank">
<style>body{font-family:'Vazirmatn','Segoe UI',Roboto,Tahoma,sans-serif;font-size:14px;line-height:1.6;margin:0;padding:4px;color:#1f1f1f;word-break:break-word}p,li,div,td,blockquote{unicode-bidi:plaintext;text-align:start}img{max-width:100%;height:auto}a{color:#0f6cbd}blockquote{border-left:3px solid #ddd;margin:8px 0;padding-left:10px;color:#555}</style>
</head><body>${clean}</body></html>`;
});

function resizeFrame() {
  const el = frame.value;
  const body = el?.contentDocument?.body;
  if (el && body) el.style.height = `${Math.max(120, body.scrollHeight + 24)}px`;
}

async function download(a: Attachment) {
  try {
    const res = await mailApi.downloadAttachment(props.message.folder, props.message.uid, a.id);
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
.message-view {
  border: 1px solid var(--mail-border);
  border-radius: 12px;
  background: var(--mail-surface);
  margin-bottom: 10px;
}
.is-collapsed {
  background: var(--mail-surface-2);
}
.plain-body {
  white-space: pre-wrap;
  font-family: inherit;
  margin: 0;
  unicode-bidi: plaintext;
  text-align: start;
}
</style>
