<template>
  <q-menu context-menu touch-position class="rounded-menu" @before-show="emit('before-show')">
    <q-list dense style="min-width: 220px" class="q-py-xs">
      <q-item clickable v-close-popup @click="emit('open')">
        <q-item-section avatar><q-icon name="open_in_full" size="18px" /></q-item-section>
        <q-item-section>{{ t('context.open') }}</q-item-section>
      </q-item>
      <q-separator class="q-my-xs" />
      <q-item clickable v-close-popup @click="emit('reply', 'reply')">
        <q-item-section avatar><q-icon name="reply" size="18px" /></q-item-section>
        <q-item-section>{{ t('mail.reply') }}</q-item-section>
      </q-item>
      <q-item clickable v-close-popup @click="emit('reply', 'replyAll')">
        <q-item-section avatar><q-icon name="reply_all" size="18px" /></q-item-section>
        <q-item-section>{{ t('mail.replyAll') }}</q-item-section>
      </q-item>
      <q-item clickable v-close-popup @click="emit('reply', 'forward')">
        <q-item-section avatar><q-icon name="forward" size="18px" /></q-item-section>
        <q-item-section>{{ t('mail.forward') }}</q-item-section>
      </q-item>
      <q-separator class="q-my-xs" />
      <q-item clickable v-close-popup @click="emit('seen', !seen)">
        <q-item-section avatar
          ><q-icon :name="seen ? 'mark_email_unread' : 'mark_email_read'" size="18px"
        /></q-item-section>
        <q-item-section>{{ seen ? t('mail.markUnread') : t('mail.markRead') }}</q-item-section>
      </q-item>
      <q-item clickable v-close-popup @click="emit('flag')">
        <q-item-section avatar
          ><q-icon
            :name="flagged ? 'flag' : 'outlined_flag'"
            size="18px"
            :color="flagged ? 'negative' : undefined"
        /></q-item-section>
        <q-item-section>{{ flagged ? t('mail.unflag') : t('mail.flag') }}</q-item-section>
      </q-item>
      <q-item clickable>
        <q-item-section avatar><q-icon name="drive_file_move" size="18px" /></q-item-section>
        <q-item-section>{{ t('mail.moveTo') }}</q-item-section>
        <q-item-section side><q-icon name="chevron_right" size="18px" /></q-item-section>
        <q-menu anchor="top end" self="top start" class="rounded-menu">
          <q-list dense style="min-width: 200px" class="q-py-xs">
            <q-item
              v-for="f in folders"
              :key="f.path"
              clickable
              v-close-popup
              @click="emit('move', f.path)"
            >
              <q-item-section avatar><q-icon :name="iconFor(f.role)" size="18px" /></q-item-section>
              <q-item-section>{{ f.role ? t(`mail.${f.role}`) : f.name }}</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-item>
      <q-separator class="q-my-xs" />
      <q-item clickable v-close-popup class="text-negative" @click="emit('delete')">
        <q-item-section avatar><q-icon name="delete" size="18px" /></q-item-section>
        <q-item-section>{{ t('mail.delete') }}</q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { Folder, FolderRole } from '@/types/api';
import type { ComposeMode } from '@/stores/compose';

defineProps<{ seen: boolean; flagged: boolean; folders: Folder[] }>();
const emit = defineEmits<{
  open: [];
  reply: [mode: ComposeMode];
  seen: [seen: boolean];
  flag: [];
  move: [path: string];
  delete: [];
  'before-show': [];
}>();
const { t } = useI18n();

const ICONS: Record<string, string> = {
  inbox: 'inbox',
  drafts: 'drafts',
  sent: 'send',
  junk: 'report',
  trash: 'delete',
  archive: 'archive',
};

function iconFor(role: FolderRole): string {
  return (role && ICONS[role]) || 'folder';
}
</script>
