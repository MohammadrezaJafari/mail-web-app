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
        <template v-if="mail.selectedUids.length > 1">
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

      <div
        v-for="m in mail.messages"
        :key="m.uid"
        class="mail-list-item row no-wrap items-start"
        :class="{ 'is-selected': mail.selectedUids.includes(m.uid), 'is-unread': !m.seen }"
        @click="onClick($event, m.uid)"
      >
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
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useMailStore } from '@/stores/mail';
import { avatarColor, displayName, initials, listDate } from '@/utils/format';
import { errorMessage } from '@/api';
import type { MessageFilter } from '@/types/api';

const emit = defineEmits<{ open: [uid: number] }>();
const { t, locale } = useI18n();
const $q = useQuasar();
const mail = useMailStore();

const search = ref('');
const filter = ref<MessageFilter>(null);
const scroller = ref<HTMLElement | null>(null);

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
