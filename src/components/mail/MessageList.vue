<template>
  <div class="mail-pane">
    <div class="q-px-md q-pt-md">
      <q-input
        v-model="search"
        dense
        outlined
        rounded
        bg-color="grey-1"
        :placeholder="t('mail.search')"
        debounce="400"
        clearable
        class="search-input"
        @update:model-value="onSearch"
      >
        <template #prepend><q-icon name="search" /></template>
      </q-input>
      <div class="row items-center q-py-sm no-wrap">
        <q-btn-toggle
          v-model="filter"
          dense
          unelevated
          no-caps
          rounded
          toggle-color="primary"
          color="grey-2"
          text-color="grey-8"
          class="filter-toggle"
          :options="[
            { label: t('mail.all'), value: null },
            { label: t('mail.unread'), value: 'unread' },
            { label: t('mail.flagged'), value: 'flagged' },
          ]"
          @update:model-value="(v) => mail.setFilter(v)"
        />
        <q-space />
        <template v-if="mail.selectedUids.length > 1 && !mail.threadKey">
          <span class="text-caption text-grey q-mr-xs">{{
            t('mail.selected', { n: mail.selectedUids.length })
          }}</span>
          <q-btn
            flat
            dense
            round
            size="sm"
            icon="mark_email_read"
            @click="mail.markSeen(mail.selectedUids, true)"
            ><q-tooltip>{{ t('mail.markRead') }}</q-tooltip></q-btn
          >
          <q-btn flat dense round size="sm" icon="delete" @click="deleteSelected"
            ><q-tooltip>{{ t('mail.delete') }}</q-tooltip></q-btn
          >
          <q-btn flat dense round size="sm" icon="close" @click="mail.selectedUids = []"
            ><q-tooltip>{{ t('mail.clearSelection') }}</q-tooltip></q-btn
          >
        </template>
        <q-btn
          flat
          dense
          round
          size="sm"
          :icon="mail.conversationView ? 'forum' : 'view_agenda'"
          :color="mail.conversationView ? 'primary' : 'grey-7'"
          @click="mail.setConversationView(!mail.conversationView)"
        >
          <q-tooltip>{{
            mail.conversationView ? t('mail.conversationOn') : t('mail.conversationOff')
          }}</q-tooltip>
        </q-btn>
      </div>
    </div>
    <q-separator />

    <div class="mail-scroll q-py-xs" @scroll.passive="onScroll" ref="scroller">
      <q-linear-progress
        v-if="mail.listLoading && !mail.messages.length"
        indeterminate
        color="primary"
      />

      <div
        v-if="!mail.listLoading && !mail.messages.length"
        class="column flex-center text-grey q-pa-xl empty-state"
      >
        <div class="empty-icon"><q-icon name="inbox" size="30px" /></div>
        <div class="text-subtitle1 text-weight-medium q-mt-md">{{ t('mail.empty') }}</div>
        <div class="text-caption">{{ t('mail.emptyHint') }}</div>
      </div>

      <!-- Conversation rows -->
      <template v-if="mail.conversationView">
        <div
          v-for="th in mail.threads"
          :key="th.key"
          class="mail-list-item row no-wrap items-start"
          :class="{ 'is-selected': mail.threadKey === th.key, 'is-unread': th.unread > 0 }"
          draggable="true"
          @dragstart="
            onDragStart(
              $event,
              th.messages.map((m) => m.uid),
            )
          "
          @click="emit('openThread', th)"
        >
          <row-context-menu
            :seen="th.unread === 0"
            :flagged="th.flagged"
            :folders="moveTargets"
            @open="emit('openThread', th)"
            @reply="(mode) => replyFrom(th.latest.uid, mode)"
            @seen="
              (v) =>
                mail.markSeen(
                  th.messages.map((m) => m.uid),
                  v,
                )
            "
            @flag="mail.toggleFlag(th.latest.uid)"
            @move="
              (to) =>
                moveTo(
                  th.messages.map((m) => m.uid),
                  to,
                )
            "
            @delete="confirmDelete(th.messages.map((m) => m.uid))"
          />
          <thread-avatars :participants="th.participants" class="q-mr-sm q-mt-xs" />
          <div class="col" style="min-width: 0">
            <div class="row no-wrap items-center">
              <div class="mail-list-from col">{{ participantNames(th) }}</div>
              <q-badge
                v-if="th.messages.length > 1"
                outline
                color="grey-7"
                class="q-mr-xs count-chip"
                >{{ th.messages.length }}</q-badge
              >
              <div class="mail-list-date">{{ listDate(th.latest.date, locale) }}</div>
            </div>
            <div class="row no-wrap items-center q-mt-xs">
              <span v-if="th.unread" class="unread-dot q-mr-xs" />
              <div class="mail-list-subject col">{{ th.subject || t('mail.noSubject') }}</div>
              <q-icon
                v-if="th.has_attachments"
                name="attach_file"
                size="15px"
                class="text-grey q-ml-xs"
              />
              <q-icon
                v-if="th.latest.answered"
                name="reply"
                size="15px"
                class="text-grey q-ml-xs"
              />
              <q-icon
                :name="th.flagged ? 'flag' : 'outlined_flag'"
                size="16px"
                class="q-ml-xs flag-icon"
                :class="th.flagged ? 'text-negative' : 'text-grey-5'"
                @click.stop="mail.toggleFlag(th.latest.uid)"
              />
            </div>
            <div class="mail-list-preview q-mt-xs" v-if="th.latest.preview">
              {{ th.latest.preview }}
            </div>
          </div>
        </div>
      </template>

      <!-- Flat rows -->
      <template v-else>
        <div
          v-for="m in mail.messages"
          :key="m.uid"
          class="mail-list-item row no-wrap items-start"
          :class="{ 'is-selected': mail.selectedUids.includes(m.uid), 'is-unread': !m.seen }"
          draggable="true"
          @dragstart="onDragStart($event, mail.targetUids(m.uid))"
          @click="onClick($event, m.uid)"
        >
          <row-context-menu
            :seen="m.seen"
            :flagged="m.flagged"
            :folders="moveTargets"
            @open="emit('open', m.uid)"
            @reply="(mode) => replyFrom(m.uid, mode)"
            @seen="(v) => mail.markSeen(mail.targetUids(m.uid), v)"
            @flag="mail.toggleFlag(m.uid)"
            @move="(to) => moveTo(mail.targetUids(m.uid), to)"
            @delete="confirmDelete(mail.targetUids(m.uid))"
          />
          <q-checkbox
            dense
            size="xs"
            :model-value="mail.selectedUids.includes(m.uid)"
            class="q-mr-xs q-mt-xs select-box"
            @update:model-value="(v) => toggleSelect(m.uid, v)"
            @click.stop
          />
          <q-avatar
            size="38px"
            text-color="white"
            class="q-mr-sm text-caption text-weight-bold"
            :style="{ background: avatarColor(m.from?.email ?? '') }"
          >
            {{ initials(m.from) }}
          </q-avatar>
          <div class="col" style="min-width: 0">
            <div class="row no-wrap items-center">
              <div class="mail-list-from col">{{ displayName(m.from) }}</div>
              <div class="mail-list-date q-ml-sm">{{ listDate(m.date, locale) }}</div>
            </div>
            <div class="row no-wrap items-center q-mt-xs">
              <span v-if="!m.seen" class="unread-dot q-mr-xs" />
              <div class="mail-list-subject col">{{ m.subject || t('mail.noSubject') }}</div>
              <q-icon
                v-if="m.has_attachments"
                name="attach_file"
                size="15px"
                class="text-grey q-ml-xs"
              />
              <q-icon v-if="m.answered" name="reply" size="15px" class="text-grey q-ml-xs" />
              <q-icon
                :name="m.flagged ? 'flag' : 'outlined_flag'"
                size="16px"
                class="q-ml-xs flag-icon"
                :class="m.flagged ? 'text-negative' : 'text-grey-5'"
                @click.stop="mail.toggleFlag(m.uid)"
              />
            </div>
            <div class="mail-list-preview q-mt-xs" v-if="m.preview">{{ m.preview }}</div>
          </div>
        </div>
      </template>

      <div v-if="mail.hasMore" class="q-pa-sm text-center">
        <q-btn
          flat
          no-caps
          dense
          color="primary"
          :label="t('mail.loadMore')"
          :loading="mail.listLoading"
          @click="mail.loadMore()"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar, type QInput } from 'quasar';
import { useMailStore } from '@/stores/mail';
import { useComposeStore, type ComposeMode } from '@/stores/compose';
import { avatarColor, displayName, initials, listDate } from '@/utils/format';
import { errorMessage } from '@/api';
import type { MessageFilter, Thread } from '@/types/api';
import ThreadAvatars from '@/components/mail/ThreadAvatars.vue';
import RowContextMenu from '@/components/mail/RowContextMenu.vue';

const emit = defineEmits<{ open: [uid: number]; openThread: [thread: Thread] }>();
const { t, locale } = useI18n();
const $q = useQuasar();
const mail = useMailStore();
const compose = useComposeStore();

const search = ref('');
const searchInput = ref<QInput | null>(null);
const moveTargets = computed(() => mail.folders.filter((f) => f.path !== mail.currentFolder));

defineExpose({ focusSearch: () => searchInput.value?.focus() });

export interface DragPayload {
  uids: number[];
  folder: string;
}

function onDragStart(event: DragEvent, uids: number[]) {
  const payload: DragPayload = { uids, folder: mail.currentFolder };
  event.dataTransfer?.setData('application/x-mail-uids', JSON.stringify(payload));
  event.dataTransfer?.setData('text/plain', `${uids.length} message(s)`);
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
}

async function replyFrom(uid: number, mode: ComposeMode) {
  try {
    compose.start({ mode, source: await mail.detail(uid) });
  } catch (e) {
    $q.notify({ type: 'negative', message: errorMessage(e) });
  }
}

async function moveTo(uids: number[], to: string) {
  try {
    await mail.move(uids, to);
    $q.notify({ type: 'positive', message: t('mail.moved') });
  } catch (e) {
    $q.notify({ type: 'negative', message: errorMessage(e) });
  }
}

function confirmDelete(uids: number[]) {
  $q.dialog({
    title: t('mail.delete'),
    message: t('common.deleteConfirm', { n: uids.length }, uids.length),
    cancel: true,
    ok: t('mail.delete'),
  }).onOk(() => {
    mail.remove(uids).then(
      () => $q.notify({ type: 'positive', message: t('mail.deleted') }),
      (e) => $q.notify({ type: 'negative', message: errorMessage(e) }),
    );
  });
}
const filter = ref<MessageFilter>(null);
const scroller = ref<HTMLElement | null>(null);

function participantNames(th: Thread): string {
  const names = th.participants.map((p) => (p.name?.trim() || p.email).split(/\s+/)[0] ?? '');
  return names.length > 3
    ? `${names.slice(0, 3).join(', ')} +${names.length - 3}`
    : names.join(', ');
}

function onSearch(value: string | number | null) {
  void mail.setSearch(String(value ?? ''));
}

function onClick(event: MouseEvent, uid: number) {
  if (event.ctrlKey || event.metaKey) {
    toggleSelect(uid, !mail.selectedUids.includes(uid));
    return;
  }
  emit('open', uid);
}

function toggleSelect(uid: number, selected: boolean) {
  if (selected && !mail.selectedUids.includes(uid)) mail.selectedUids.push(uid);
  if (!selected) mail.selectedUids = mail.selectedUids.filter((u) => u !== uid);
}

function deleteSelected() {
  const uids = [...mail.selectedUids];
  $q.dialog({
    title: t('mail.delete'),
    message: t('common.deleteConfirm', { n: uids.length }, uids.length),
    cancel: true,
    ok: t('mail.delete'),
  }).onOk(() => {
    mail.remove(uids).then(
      () => $q.notify({ type: 'positive', message: t('mail.deleted') }),
      (e) => $q.notify({ type: 'negative', message: errorMessage(e) }),
    );
  });
}

function onScroll() {
  const el = scroller.value;
  if (!el || mail.listLoading || !mail.hasMore) return;
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 120) void mail.loadMore();
}
</script>

<style scoped lang="scss">
.search-input :deep(.q-field__control) {
  border-radius: 12px;
}
.filter-toggle :deep(.q-btn) {
  font-size: 12.5px;
  padding: 2px 12px;
  font-weight: 500;
}
.select-box {
  opacity: 0;
}
.mail-list-item:hover .select-box,
.mail-list-item.is-selected .select-box {
  opacity: 1;
}
.flag-icon {
  cursor: pointer;
}
.mail-list-item[draggable='true'] {
  user-select: none;
}
.count-chip {
  font-size: 11px;
  padding: 1px 6px;
}
.empty-state {
  min-height: 300px;
}
.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  display: grid;
  place-items: center;
  background: var(--mail-surface-2);
  color: var(--mail-muted);
}
</style>
