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
        @click="newFolder(null)"
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
          v-for="node in visibleNodes"
          :key="node.path"
          clickable
          :active="node.path === mail.currentFolder"
          active-class="folder-active"
          class="folder-item"
          :class="{ 'drop-hover': dropTarget === node.path }"
          :style="{ paddingInlineStart: `${8 + node.depth * 16}px` }"
          @click="mail.openFolder(node.path)"
          @dragover="onDragOver($event, node.path)"
          @dragleave="dropTarget === node.path && (dropTarget = null)"
          @drop="onDrop($event, node.path)"
        >
          <q-item-section side class="expander" style="min-width: 20px; padding-inline-end: 2px">
            <q-icon
              v-if="node.children.length"
              :name="collapsed.has(node.path) ? 'chevron_right' : 'expand_more'"
              size="18px"
              class="rtl-flip"
              @click.stop="toggle(node.path)"
            />
          </q-item-section>
          <q-item-section avatar style="min-width: 30px">
            <q-icon :name="iconFor(node.role)" size="20px" />
          </q-item-section>
          <q-item-section>
            <q-item-label
              :class="{ 'text-weight-bold': node.unread > 0 }"
              class="ellipsis folder-label"
              >{{ labelFor(node) }}</q-item-label
            >
          </q-item-section>
          <q-item-section
            side
            v-if="node.unread > 0 && node.role !== 'trash' && node.role !== 'junk'"
          >
            <q-badge color="primary" rounded class="count-badge">{{ node.unread }}</q-badge>
          </q-item-section>
          <q-item-section side v-else-if="node.role === 'drafts' && node.total > 0">
            <span class="text-grey text-caption">{{ node.total }}</span>
          </q-item-section>

          <q-menu context-menu touch-position class="rounded-menu">
            <q-list dense style="min-width: 200px" class="q-py-xs">
              <q-item clickable v-close-popup @click="newFolder(node.path)">
                <q-item-section avatar
                  ><q-icon name="create_new_folder" size="18px"
                /></q-item-section>
                <q-item-section>{{ t('mail.newSubfolder') }}</q-item-section>
              </q-item>
              <q-item
                clickable
                v-close-popup
                :disable="node.role !== null"
                @click="renameFolder(node)"
              >
                <q-item-section avatar
                  ><q-icon name="drive_file_rename_outline" size="18px"
                /></q-item-section>
                <q-item-section>{{ t('mail.renameFolder') }}</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="markAllRead(node)">
                <q-item-section avatar
                  ><q-icon name="mark_email_read" size="18px"
                /></q-item-section>
                <q-item-section>{{ t('mail.markRead') }}</q-item-section>
              </q-item>
              <q-separator class="q-my-xs" />
              <q-item
                clickable
                v-close-popup
                :disable="node.role !== null || node.children.length > 0"
                class="text-negative"
                @click="deleteFolder(node)"
              >
                <q-item-section avatar><q-icon name="delete" size="18px" /></q-item-section>
                <q-item-section>{{ t('mail.deleteFolder') }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
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
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { LocalStorage, useQuasar } from 'quasar';
import { useMailStore } from '@/stores/mail';
import { useComposeStore } from '@/stores/compose';
import { errorMessage, mailApi } from '@/api';
import type { Folder, FolderNode, FolderRole } from '@/types/api';
import { flattenTree } from '@/utils/folderTree';
import StorageMeter from '@/components/settings/StorageMeter.vue';

const COLLAPSED_KEY = 'mail.collapsedFolders';

const { t } = useI18n();
const $q = useQuasar();
const mail = useMailStore();
const compose = useComposeStore();
const dropTarget = ref<string | null>(null);
const collapsed = ref(new Set<string>(LocalStorage.getItem<string[]>(COLLAPSED_KEY) ?? []));

const visibleNodes = computed(() => flattenTree(mail.folderTree, collapsed.value));

function toggle(path: string) {
  const next = new Set(collapsed.value);
  if (next.has(path)) next.delete(path);
  else next.add(path);
  collapsed.value = next;
  LocalStorage.set(COLLAPSED_KEY, [...next]);
}

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

function labelFor(node: FolderNode): string {
  return node.role ? t(`mail.${node.role}`) : node.label;
}

function prompt(title: string, label: string, initial = '') {
  return $q.dialog({
    title,
    prompt: {
      model: initial,
      type: 'text',
      label,
      isValid: (v: string) => /^[^/\\]+$/.test(v.trim()),
    },
    cancel: true,
    ok: t('common.ok'),
  });
}

function applyFolders(folders: Folder[]) {
  mail.folders = folders;
}

function newFolder(parent: string | null) {
  prompt(parent ? t('mail.newSubfolder') : t('mail.newFolder'), t('mail.folderName')).onOk(
    (name: string) => {
      mailApi
        .createFolder(name.trim(), parent)
        .then(applyFolders, (e) => $q.notify({ type: 'negative', message: errorMessage(e) }));
    },
  );
}

function renameFolder(node: FolderNode) {
  prompt(t('mail.renameFolder'), t('mail.folderName'), node.label).onOk((name: string) => {
    mailApi.renameFolder(node.path, name.trim()).then(
      (folders) => {
        applyFolders(folders);
        if (mail.currentFolder === node.path)
          void mail.openFolder(
            folders.find((f) => f.name === name.trim())?.path ?? folders[0]!.path,
          );
      },
      (e) => $q.notify({ type: 'negative', message: errorMessage(e) }),
    );
  });
}

function deleteFolder(node: FolderNode) {
  $q.dialog({
    title: t('mail.deleteFolder'),
    message: t('mail.deleteFolderConfirm', { name: node.label, n: node.total }),
    cancel: true,
    ok: t('mail.delete'),
  }).onOk(() => {
    mailApi.deleteFolder(node.path).then(
      (folders) => {
        applyFolders(folders);
        if (mail.currentFolder === node.path)
          void mail.openFolder(mail.folderByRole('inbox')?.path ?? folders[0]!.path);
      },
      (e) => $q.notify({ type: 'negative', message: errorMessage(e) }),
    );
  });
}

function markAllRead(node: FolderNode) {
  if (node.path !== mail.currentFolder) {
    void mail.openFolder(node.path).then(() => markAllRead(node));
    return;
  }
  const uids = mail.messages.filter((m) => !m.seen).map((m) => m.uid);
  if (uids.length) void mail.markSeen(uids, true);
}

function onDragOver(event: DragEvent, path: string) {
  if (!event.dataTransfer?.types.includes('application/x-mail-uids') || path === mail.currentFolder)
    return;
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  dropTarget.value = path;
}

async function onDrop(event: DragEvent, path: string) {
  dropTarget.value = null;
  const raw = event.dataTransfer?.getData('application/x-mail-uids');
  if (!raw) return;
  event.preventDefault();
  try {
    const payload = JSON.parse(raw) as { uids: number[]; folder: string };
    if (
      payload.folder !== mail.currentFolder ||
      path === mail.currentFolder ||
      !payload.uids.length
    )
      return;
    await mail.move(payload.uids, path);
    $q.notify({ type: 'positive', message: t('mail.moved') });
  } catch (e) {
    $q.notify({ type: 'negative', message: errorMessage(e) });
  }
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
.drop-hover {
  outline: 2px dashed var(--mail-primary);
  outline-offset: -2px;
  background: var(--mail-hover);
}
.expander .q-icon {
  cursor: pointer;
  color: var(--mail-muted);
}
html[dir='rtl'] .rtl-flip {
  transform: scaleX(-1);
}
</style>
