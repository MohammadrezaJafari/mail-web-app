<template>
  <q-page class="mail-page row no-wrap q-gutter-x-md">
    <folder-pane
      class="col-auto folder-pane"
      :class="{ 'lt-md-hidden': $q.screen.lt.md && (mail.current || mobileView !== 'folders') }"
    />
    <message-list
      ref="listRef"
      class="col-auto list-pane"
      :class="{ 'lt-md-hidden': $q.screen.lt.md && (mail.current || mobileView === 'folders') }"
      @open="openMessage"
      @open-thread="openThread"
    />
    <reading-pane
      class="col reading-pane"
      :class="{ 'lt-md-hidden': $q.screen.lt.md && !mail.current }"
      @back="mail.current = null"
    />
    <shortcuts-dialog v-model="helpOpen" />
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import { useMailStore } from '@/stores/mail';
import { errorMessage } from '@/api';
import FolderPane from '@/components/mail/FolderPane.vue';
import MessageList from '@/components/mail/MessageList.vue';
import ReadingPane from '@/components/mail/ReadingPane.vue';
import type { Thread } from '@/types/api';
import ShortcutsDialog from '@/components/mail/ShortcutsDialog.vue';
import { useMailShortcuts } from '@/composables/useMailShortcuts';
import { useI18n } from 'vue-i18n';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const mail = useMailStore();
const { t } = useI18n();
const mobileView = ref<'folders' | 'list'>('list');
const listRef = ref<{ focusSearch: () => void } | null>(null);

const { helpOpen } = useMailShortcuts({
  openThread,
  openMessage,
  focusSearch: () => listRef.value?.focusSearch(),
  remove: () => {
    if (!mail.current) return;
    const uids = mail.threadKey
      ? [mail.current.uid, ...mail.thread.map((m) => m.uid)]
      : [mail.current.uid];
    mail.remove(uids).then(
      () => $q.notify({ type: 'positive', message: t('mail.deleted') }),
      (e) => $q.notify({ type: 'negative', message: errorMessage(e) }),
    );
  },
  archive: () => {
    if (!mail.current) return;
    const uids = mail.threadKey
      ? [mail.current.uid, ...mail.thread.map((m) => m.uid)]
      : [mail.current.uid];
    mail.archive(uids).then(
      (ok) =>
        $q.notify({
          type: ok ? 'positive' : 'warning',
          message: ok ? t('mail.moved') : t('mail.noArchive'),
        }),
      (e) => $q.notify({ type: 'negative', message: errorMessage(e) }),
    );
  },
});

async function boot() {
  try {
    await mail.loadFolders();
    const folder =
      typeof route.params.folder === 'string' && route.params.folder
        ? route.params.folder
        : mail.currentFolder;
    await mail.openFolder(folder);
  } catch (e) {
    $q.notify({ type: 'negative', message: errorMessage(e) });
  }
}

onMounted(boot);

watch(
  () => route.params.folder,
  async (folder) => {
    if (typeof folder === 'string' && folder && folder !== mail.currentFolder) {
      await mail.openFolder(folder);
    }
  },
);

watch(
  () => mail.currentFolder,
  (folder) => {
    if (folder && route.params.folder !== folder) {
      void router.replace({ name: 'mail.folder', params: { folder } });
    }
  },
);

async function openThread(thread: Thread) {
  try {
    await mail.openThread(thread);
  } catch (e) {
    $q.notify({ type: 'negative', message: errorMessage(e) });
  }
}

async function openMessage(uid: number) {
  try {
    await mail.open(uid);
  } catch (e) {
    $q.notify({ type: 'negative', message: errorMessage(e) });
  }
}
</script>

<style scoped lang="scss">
.mail-page {
  height: calc(100vh - 56px);
  overflow: hidden;
  padding: 16px 16px 16px 0;
}
html[dir='rtl'] .mail-page {
  padding: 16px 0 16px 16px;
}
.folder-pane {
  width: 250px;
}
.list-pane {
  width: 400px;
}
.reading-pane {
  min-width: 0;
}
@media (max-width: 1023px) {
  .mail-page {
    padding: 8px;
  }
  .folder-pane,
  .list-pane,
  .reading-pane {
    width: 100%;
    flex: 1 1 100%;
  }
  .lt-md-hidden {
    display: none !important;
  }
}
</style>
