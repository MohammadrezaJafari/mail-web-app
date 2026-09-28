<template>
  <q-page class="mail-page row no-wrap">
    <!-- Folder pane -->
    <folder-pane
      class="col-auto folder-pane"
      :class="{ 'lt-md-hidden': $q.screen.lt.md && (mail.current || mobileView !== 'folders') }"
    />

    <!-- Message list pane -->
    <message-list
      class="col-auto list-pane"
      :class="{ 'lt-md-hidden': $q.screen.lt.md && (mail.current || mobileView === 'folders') }"
      @open="openMessage"
    />

    <!-- Reading pane -->
    <reading-pane
      class="col reading-pane"
      :class="{ 'lt-md-hidden': $q.screen.lt.md && !mail.current }"
      @back="mail.current = null"
    />
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

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const mail = useMailStore();
const mobileView = ref<'folders' | 'list'>('list');

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
  height: calc(100vh - 48px);
  overflow: hidden;
}
.folder-pane {
  width: 240px;
  background: var(--mail-folder-bg);
}
.list-pane {
  width: 380px;
  background: var(--mail-list-bg);
}
.reading-pane {
  min-width: 0;
  background: var(--mail-list-bg);
}
@media (max-width: 1023px) {
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
