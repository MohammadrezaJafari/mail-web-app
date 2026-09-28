<template>
  <q-card flat class="settings-card">
    <q-card-section class="card-head row items-center no-wrap">
      <div class="card-icon"><q-icon name="rule" size="20px" /></div>
      <div class="col">
        <div class="text-subtitle1 text-weight-semibold">{{ t('rules.title') }}</div>
        <div class="text-caption text-grey">{{ t('rules.hint') }}</div>
      </div>
      <q-btn
        color="primary"
        unelevated
        no-caps
        dense
        icon="add"
        :label="t('rules.add')"
        class="q-px-sm"
        @click="edit(null)"
      />
    </q-card-section>
    <q-separator />
    <q-list separator v-if="rules.length">
      <q-item v-for="(rule, i) in rules" :key="rule.id ?? i">
        <q-item-section side
          ><q-toggle
            :model-value="rule.enabled"
            dense
            @update:model-value="(v) => toggleRule(i, v)"
        /></q-item-section>
        <q-item-section>
          <q-item-label class="text-weight-medium">{{ rule.name }}</q-item-label>
          <q-item-label caption>{{ describe(rule) }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <div class="row no-wrap">
            <q-btn flat dense round icon="edit" color="grey" @click="edit(i)" />
            <q-btn flat dense round icon="delete" color="grey" @click="remove(i)" />
          </div>
        </q-item-section>
      </q-item>
    </q-list>
    <q-card-section v-else class="text-caption text-grey">{{ t('rules.empty') }}</q-card-section>

    <rule-editor-dialog v-model="dialog" :rule="editing" :folders="folders" @save="onSave" />
  </q-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { accountApi, errorMessage, mailApi } from '@/api';
import type { Folder, MailRule } from '@/types/api';
import RuleEditorDialog from '@/components/settings/RuleEditorDialog.vue';

const { t } = useI18n();
const $q = useQuasar();
const rules = ref<MailRule[]>([]);
const folders = ref<Folder[]>([]);
const dialog = ref(false);
const editing = ref<MailRule | null>(null);
let editingIndex: number | null = null;

onMounted(async () => {
  try {
    rules.value = await accountApi.rules();
  } catch (e) {
    $q.notify({ type: 'negative', message: errorMessage(e) });
  }
  mailApi
    .folders()
    .then((f) => (folders.value = f))
    .catch(() => undefined);
});

function describe(rule: MailRule): string {
  const cond = rule.conditions
    .map((c) => `${t(`rules.fields.${c.field}`)} ${t(`rules.ops.${c.operator}`)} "${c.value}"`)
    .join(rule.match === 'any' ? ` ${t('rules.or')} ` : ` ${t('rules.and')} `);
  const act = rule.actions
    .map((a) => `${t(`rules.actions.${a.type}`)}${a.value ? ` ${a.value}` : ''}`)
    .join(', ');
  return `${cond} → ${act}`;
}

function edit(index: number | null) {
  editingIndex = index;
  editing.value = index === null ? null : rules.value[index]!;
  dialog.value = true;
}

async function persist(next: MailRule[]) {
  try {
    rules.value = await accountApi.saveRules(next);
    $q.notify({ type: 'positive', message: t('settings.saved') });
  } catch (e) {
    $q.notify({ type: 'negative', message: errorMessage(e) });
  }
}

function onSave(rule: MailRule) {
  const next = [...rules.value];
  if (editingIndex === null) next.push(rule);
  else next[editingIndex] = rule;
  void persist(next);
}

function toggleRule(index: number, enabled: boolean) {
  const next = rules.value.map((r, i) => (i === index ? { ...r, enabled } : r));
  void persist(next);
}

function remove(index: number) {
  $q.dialog({ title: t('rules.remove'), message: rules.value[index]!.name, cancel: true }).onOk(
    () => {
      void persist(rules.value.filter((_, i) => i !== index));
    },
  );
}
</script>
