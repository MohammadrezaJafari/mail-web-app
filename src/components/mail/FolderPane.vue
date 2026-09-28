<template>
  <div class="mail-pane">
    <div class="q-pa-md">
      <q-btn
        color="primary"
        unelevated
        no-caps
        icon="edit"
        :label="t('mail.newMail')"
        class="full-width"
        @click="compose.start({ mode: 'new' })"
      />
    </div>

    <div class="mail-scroll">
      <q-list dense padding>
        <q-item-label header class="row items-center">
          <span>{{ t('mail.folders') }}</span>
          <q-space />
          <q-btn flat dense round size="sm" icon="create_new_folder" @click="newFolder">
            <q-tooltip>{{ t('mail.newFolder') }}</q-tooltip>
          </q-btn>
          <q-btn
            flat
            dense
            round
            size="sm"
            icon="refresh"
            :loading="mail.foldersLoading"
            @click="mail.refresh()"
          >
            <q-tooltip>{{ t('mail.refresh') }}</q-tooltip>
          </q-btn>
        </q-item-label>

        <q-item
          v-for="folder in mail.folders"
          :key="folder.path"
          clickable
          :active="folder.path === mail.currentFolder"
          active-class="folder-active"
          class="folder-item"
          @click="mail.openFolder(folder.path)"
        >
          <q-item-section avatar style="min-width: 36px">
            <q-icon :name="iconFor(folder.role)" size="20px" />
          </q-item-section>
          <q-item-section>
            <q-item-label :class="{ 'text-weight-bold': folder.unread > 0 }" class="ellipsis">{{
              labelFor(folder)
            }}</q-item-label>
          </q-item-section>
          <q-item-section
            side
            v-if="folder.unread > 0 && folder.role !== 'trash' && folder.role !== 'junk'"
          >
            <span class="text-primary text-weight-bold text-caption">{{ folder.unread }}</span>
          </q-item-section>
          <q-item-section side v-else-if="folder.role === 'drafts' && folder.total > 0">
            <span class="text-grey text-caption">{{ folder.total }}</span>
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <q-separator />
    <div class="q-pa-sm">
      <storage-meter compact />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useMailStore } from '@/stores/mail';
import { useComposeStore } from '@/stores/compose';
import { errorMessage, mailApi } from '@/api';
import type { Folder, FolderRole } from '@/types/api';
import StorageMeter from '@/components/settings/StorageMeter.vue';

const { t } = useI18n();
const $q = useQuasar();
const mail = useMailStore();
const compose = useComposeStore();

function iconFor(role: FolderRole): string {
  switch (role) {
    case 'inbox':
      return 'inbox';
    case 'drafts':
      return 'drafts';
    case 'sent':
      return 'send';
    case 'junk':
      return 'report';
    case 'trash':
      return 'delete';
    case 'archive':
      return 'archive';
    default:
      return 'folder';
  }
}

function labelFor(folder: Folder): string {
  return folder.role ? t(`mail.${folder.role}`) : folder.name;
}

function newFolder() {
  $q.dialog({
    title: t('mail.newFolder'),
    prompt: { model: '', type: 'text', label: t('mail.folderName') },
    cancel: true,
    ok: t('common.create'),
  }).onOk((name: string) => {
    if (!name?.trim()) return;
    mailApi.createFolder(name.trim()).then(
      (folders) => (mail.folders = folders),
      (e) => $q.notify({ type: 'negative', message: errorMessage(e) }),
    );
  });
}
</script>

<style scoped lang="scss">
.folder-item {
  border-radius: 6px;
  margin: 0 6px;
  min-height: 34px;
}
.folder-active {
  background: var(--mail-selected);
  color: $primary;
}
</style>
