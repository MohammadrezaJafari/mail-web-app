<template>
  <q-btn flat dense round size="sm" icon="tune" :color="mail.hasCriteria ? 'primary' : 'grey-7'">
    <q-tooltip>{{ t('search.advanced') }}</q-tooltip>
    <q-menu class="rounded-menu" anchor="bottom right" self="top right" @before-show="load">
      <q-card flat style="width: 340px" class="q-pa-md">
        <div class="text-subtitle2 text-weight-semibold q-mb-sm">{{ t('search.advanced') }}</div>
        <q-input
          v-model="form.from"
          dense
          outlined
          :label="t('mail.from')"
          class="q-mb-sm"
          dir="ltr"
        />
        <q-input v-model="form.to" dense outlined :label="t('mail.to')" class="q-mb-sm" dir="ltr" />
        <q-input v-model="form.subject" dense outlined :label="t('mail.subject')" class="q-mb-sm" />
        <div class="row q-col-gutter-sm">
          <q-input
            v-model="form.since"
            dense
            outlined
            type="date"
            class="col-6"
            :label="t('search.since')"
            stack-label
          />
          <q-input
            v-model="form.before"
            dense
            outlined
            type="date"
            class="col-6"
            :label="t('search.before')"
            stack-label
          />
        </div>
        <div class="row q-mt-md">
          <q-btn
            flat
            no-caps
            :label="t('search.clear')"
            v-close-popup
            @click="mail.clearCriteria()"
          />
          <q-space />
          <q-btn
            color="primary"
            unelevated
            no-caps
            icon="search"
            :label="t('search.apply')"
            v-close-popup
            @click="mail.setCriteria(form)"
          />
        </div>
      </q-card>
    </q-menu>
  </q-btn>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMailStore } from '@/stores/mail';

const { t } = useI18n();
const mail = useMailStore();
const form = reactive({ from: '', to: '', subject: '', since: '', before: '' });

function load() {
  Object.assign(form, mail.criteria);
}
</script>
