<template>
  <div class="mail-pane reading">
    <template v-if="mail.current">
      <q-toolbar class="reading-toolbar soft-toolbar q-px-sm">
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
        <div class="row items-center q-mb-md">
          <div class="text-h6 bidi-auto col">{{ mail.current.subject || t('mail.noSubject') }}</div>
          <q-badge v-if="conversationCount > 1" outline color="grey-7" class="q-ml-sm">{{
            t('mail.messagesInThread', { n: conversationCount })
          }}</q-badge>
        </div>

        <template v-if="mail.thread.length">
          <message-view
            v-for="m in mail.thread"
            :key="m.uid"
            :message="m"
            start-collapsed
            @reply="replyTo"
          />
        </template>
        <message-view :key="mail.current.uid" :message="mail.current" @reply="replyTo" />
      </div>
    </template>

    <div v-else class="column flex-center text-grey full-height q-pa-xl">
      <q-inner-loading :showing="mail.currentLoading" />
      <div class="empty-hero"><q-icon name="drafts" size="44px" /></div>
      <div class="text-subtitle1 text-weight-medium q-mt-md">{{ t('mail.noSelection') }}</div>
      <div class="text-caption">{{ t('mail.noSelectionHint') }}</div>
    </div>
    <q-inner-loading :showing="mail.currentLoading && !!mail.current" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useMailStore } from '@/stores/mail';
import { useComposeStore } from '@/stores/compose';
import { errorMessage } from '@/api';
import MessageView from '@/components/mail/MessageView.vue';
import type { MessageDetail } from '@/types/api';

const emit = defineEmits<{ back: [] }>();
const { t } = useI18n();
const $q = useQuasar();
const mail = useMailStore();
const compose = useComposeStore();

const moveTargets = computed(() => mail.folders.filter((f) => f.path !== mail.currentFolder));
const conversationCount = computed(() => mail.thread.length + 1);

function replyTo(message: MessageDetail) {
  compose.start({ mode: 'reply', source: message });
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
</script>

<style scoped lang="scss">
.reading {
  position: relative;
}
.reading-toolbar {
  min-height: 52px;
  gap: 2px;
}
.empty-hero {
  width: 96px;
  height: 96px;
  border-radius: 28px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--mail-selected), var(--mail-surface-2));
  color: var(--mail-primary);
}
</style>
