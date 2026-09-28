<template>
  <div class="mail-pane">
    <div class="q-pa-md">
      <q-btn
        color="primary"
        unelevated
        no-caps
        icon="edit"
        :label="t('mail.newMail')"
        class="full-width new-mail-btn"
        size="md"
        @click="compose.start({ mode: 'new' })"
      />
    </div>

    <div class="row items-center q-px-md q-pb-xs">
      <span class="pane-title">{{ t('mail.folders') }}</span>
      <q-space />
      <q-btn
        flat
        dense
        round
        size="sm"
        icon="create_new_folder"
        class="text-grey-6"
        @click="newFolder"
      >
        <q-tooltip>{{ t('mail.newFolder') }}</q-tooltip>
      </q-btn>
      <q-btn
        flat
        dense
        round
        size="sm"
        icon="refresh"
        class="text-grey-6"
        :loading="mail.foldersLoading"
        @click="mail.refresh()"
      >
        <q-tooltip>{{ t('mail.refresh') }}</q-tooltip>
      </q-btn>
    </div>

    <div class="mail-scroll q-px-sm q-pb-sm">
      <q-list dense>
        <q-item
          v-for="folder in mail.folders"
          :key="folder.path"
          clickable
          :active="folder.path === mail.currentFolder"
          active-class="folder-active"
          class="folder-item"
          @click="mail.openFolder(folder.path)"
        >
          <q-item-section avatar style="min-width: 34px">
            <q-icon :name="iconFor(folder.role)" size="20px" />
          </q-item-section>
          <q-item-section>
            <q-item-label
              :class="{ 'text-weight-bold': folder.unread > 0 }"
              class="ellipsis folder-label"
              >{{ labelFor(folder) }}</q-item-label
            >
          </q-item-section>
          <q-item-section
            side
            v-if="folder.unread > 0 && folder.role !== 'trash' && folder.role !== 'junk'"
          >
            <q-badge color="primary" rounded class="count-badge">{{ folder.unread }}</q-badge>
          </q-item-section>
          <q-item-section side v-else-if="folder.role === 'drafts' && folder.total > 0">
            <span class="text-grey text-caption">{{ folder.total }}</span>
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <q-separator />
    <div class="q-pa-md">
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
.new-mail-btn {
  border-radius: 12px;
  height: 42px;
  font-weight: 600;
  box-shadow: 0 6px 16px rgba(15, 108, 189, 0.28);
}
.folder-item {
  border-radius: 10px;
  margin: 1px 0;
  min-height: 38px;
  color: var(--mail-text);
}
.folder-label {
  font-size: 14px;
}
.folder-active {
  background: var(--mail-selected);
  color: var(--mail-primary);
  font-weight: 600;
}
.count-badge {
  font-size: 11px;
  padding: 3px 7px;
}
</style>
