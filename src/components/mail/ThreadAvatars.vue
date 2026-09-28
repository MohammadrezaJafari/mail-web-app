<template>
  <div class="thread-avatars" :class="{ 'is-stack': participants.length > 1 }">
    <q-avatar
      v-for="(p, i) in participants.slice(0, 2)"
      :key="p.email + i"
      :size="participants.length > 1 ? '28px' : '38px'"
      text-color="white"
      class="text-caption text-weight-bold avatar"
      :style="{ background: avatarColor(p.email) }"
    >
      {{ participants.length > 1 ? initials(p).charAt(0) : initials(p) }}
    </q-avatar>
  </div>
</template>

<script setup lang="ts">
import type { Address } from '@/types/api';
import { avatarColor, initials } from '@/utils/format';

defineProps<{ participants: Address[] }>();
</script>

<style scoped>
.thread-avatars {
  position: relative;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
}
.is-stack .avatar {
  position: absolute;
  border: 2px solid var(--mail-surface);
}
.is-stack .avatar:nth-child(1) {
  top: 0;
  inset-inline-start: 0;
  z-index: 2;
}
.is-stack .avatar:nth-child(2) {
  bottom: 0;
  inset-inline-end: 0;
}
</style>
