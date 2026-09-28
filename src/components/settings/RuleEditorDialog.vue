<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(v) => emit('update:modelValue', v)"
    @before-show="reset"
  >
    <q-card style="width: 640px; max-width: 95vw" class="rounded-card">
      <q-card-section class="row items-center">
        <div class="text-subtitle1 text-weight-semibold">
          {{ rule ? t('rules.edit') : t('rules.add') }}
        </div>
        <q-space />
        <q-btn flat dense round icon="close" v-close-popup />
      </q-card-section>
      <q-separator />
      <q-card-section class="q-gutter-y-md">
        <q-input
          v-model="form.name"
          dense
          outlined
          :label="t('rules.name')"
          :rules="[(v) => !!v?.trim() || '']"
        />

        <div>
          <div class="row items-center q-mb-xs">
            <span class="text-caption text-grey text-weight-medium">{{ t('rules.when') }}</span>
            <q-btn-toggle
              v-model="form.match"
              dense
              flat
              no-caps
              toggle-color="primary"
              class="q-ml-sm"
              :options="[
                { label: t('rules.all'), value: 'all' },
                { label: t('rules.any'), value: 'any' },
              ]"
            />
          </div>
          <div
            v-for="(c, i) in form.conditions"
            :key="i"
            class="row q-col-gutter-xs items-center q-mb-xs"
          >
            <q-select
              v-model="c.field"
              dense
              outlined
              emit-value
              map-options
              :options="fieldOptions"
              class="col-4"
            />
            <q-select
              v-if="!isUnary(c.field)"
              v-model="c.operator"
              dense
              outlined
              emit-value
              map-options
              :options="opOptions"
              class="col-3"
            />
            <q-input
              v-if="!isUnary(c.field)"
              v-model="c.value"
              dense
              outlined
              class="col"
              :type="c.field === 'size_over' ? 'number' : 'text'"
              :suffix="c.field === 'size_over' ? 'KB' : undefined"
            />
            <div v-else class="col text-caption text-grey q-pl-sm">—</div>
            <q-btn
              flat
              dense
              round
              icon="remove_circle_outline"
              color="grey"
              :disable="form.conditions.length === 1"
              @click="form.conditions.splice(i, 1)"
            />
          </div>
          <q-btn
            flat
            dense
            no-caps
            icon="add"
            :label="t('rules.addCondition')"
            color="primary"
            @click="form.conditions.push({ field: 'subject', operator: 'contains', value: '' })"
          />
        </div>

        <div>
          <div class="text-caption text-grey text-weight-medium q-mb-xs">{{ t('rules.then') }}</div>
          <div
            v-for="(a, i) in form.actions"
            :key="i"
            class="row q-col-gutter-xs items-center q-mb-xs"
          >
            <q-select
              v-model="a.type"
              dense
              outlined
              emit-value
              map-options
              :options="actionOptions"
              class="col-4"
            />
            <q-select
              v-if="a.type === 'move'"
              v-model="a.value"
              dense
              outlined
              emit-value
              map-options
              :options="folderOptions"
              class="col"
            />
            <q-input
              v-else-if="a.type === 'forward'"
              v-model="a.value"
              dense
              outlined
              type="email"
              class="col"
              dir="ltr"
            />
            <div v-else class="col" />
            <q-btn
              flat
              dense
              round
              icon="remove_circle_outline"
              color="grey"
              :disable="form.actions.length === 1"
              @click="form.actions.splice(i, 1)"
            />
          </div>
          <q-btn
            flat
            dense
            no-caps
            icon="add"
            :label="t('rules.addAction')"
            color="primary"
            @click="form.actions.push({ type: 'move', value: '' })"
          />
        </div>
      </q-card-section>
      <q-separator />
      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat no-caps :label="t('common.cancel')" v-close-popup />
        <q-btn
          color="primary"
          unelevated
          no-caps
          :label="t('settings.save')"
          :disable="!valid"
          @click="save"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Folder, MailRule, RuleField } from '@/types/api';

const props = defineProps<{ modelValue: boolean; rule: MailRule | null; folders: Folder[] }>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; save: [rule: MailRule] }>();
const { t } = useI18n();

const form = reactive<MailRule>(blank());

function blank(): MailRule {
  return {
    name: '',
    enabled: true,
    match: 'all',
    conditions: [{ field: 'from', operator: 'contains', value: '' }],
    actions: [{ type: 'move', value: '' }],
  };
}

function reset() {
  const source = props.rule ? JSON.parse(JSON.stringify(props.rule)) : blank();
  Object.assign(form, blank(), source);
}

const isUnary = (field: RuleField) => field === 'has_attachment';

const fieldOptions = computed(() =>
  (['from', 'to', 'subject', 'body', 'size_over', 'has_attachment'] as RuleField[]).map((f) => ({
    label: t(`rules.fields.${f}`),
    value: f,
  })),
);
const opOptions = computed(() =>
  ['contains', 'not_contains', 'is', 'starts', 'ends'].map((o) => ({
    label: t(`rules.ops.${o}`),
    value: o,
  })),
);
const actionOptions = computed(() =>
  ['move', 'flag', 'mark_read', 'forward', 'discard', 'stop'].map((a) => ({
    label: t(`rules.actions.${a}`),
    value: a,
  })),
);
const folderOptions = computed(() =>
  props.folders.map((f) => ({ label: f.role ? t(`mail.${f.role}`) : f.path, value: f.path })),
);

const valid = computed(
  () =>
    form.name.trim() !== '' &&
    form.conditions.every((c) => isUnary(c.field) || c.value.trim() !== '') &&
    form.actions.every((a) =>
      a.type === 'move' || a.type === 'forward' ? a.value.trim() !== '' : true,
    ),
);

function save() {
  const rule: MailRule = JSON.parse(JSON.stringify(form));
  rule.conditions = rule.conditions.map((c) => (isUnary(c.field) ? { ...c, value: '' } : c));
  rule.actions = rule.actions.map((a) =>
    a.type === 'move' || a.type === 'forward' ? a : { ...a, value: '' },
  );
  emit('save', rule);
  emit('update:modelValue', false);
}
</script>

<style scoped>
.rounded-card {
  border-radius: 14px;
}
</style>
