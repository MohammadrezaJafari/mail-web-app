<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { contactsApi } from '@/api';

const auth = useAuthStore();

onMounted(async () => {
  if (auth.isAuthenticated && !auth.loaded) {
    try {
      await auth.loadMe();
      contactsApi.sync().catch(() => undefined);
    } catch {
      /* interceptor handles 401 */
    }
  }
});
</script>
