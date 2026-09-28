<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(v) => emit('update:modelValue', v)"
    @before-show="reset"
  >
    <q-card style="width: 560px; max-width: 95vw" class="rounded-card">
      <q-card-section class="row items-center">
        <div class="text-subtitle1 text-weight-semibold">
          {{ contact ? t('contacts.edit') : t('contacts.newContact') }}
        </div>
        <q-space />
        <q-btn flat dense round icon="close" v-close-popup />
      </q-card-section>
      <q-separator />
      <q-card-section class="q-gutter-y-sm">
        <div class="row q-col-gutter-sm">
          <q-input
            v-model="form.first_name"
            dense
            outlined
            class="col-6"
            :label="t('contacts.firstName')"
            autofocus
          />
          <q-input
            v-model="form.last_name"
            dense
            outlined
            class="col-6"
            :label="t('contacts.lastName')"
          />
        </div>
        <q-select
          v-if="!contact && books.length > 1"
          v-model="form.book_id"
          dense
          outlined
          emit-value
          map-options
          :options="books.map((b) => ({ label: b.name, value: b.id }))"
          :label="t('contacts.book')"
        />
        <div v-for="(e, i) in form.emails" :key="'e' + i" class="row q-col-gutter-xs items-center">
          <q-input
            v-model="e.value"
            dense
            outlined
            type="email"
            class="col"
            :label="t('contacts.email')"
            dir="ltr"
          />
          <q-select
            v-model="e.type"
            dense
            outlined
            class="col-3"
            :options="['work', 'home', 'other']"
          />
          <q-btn
            flat
            dense
            round
            icon="remove_circle_outline"
            color="grey"
            @click="form.emails.splice(i, 1)"
          />
        </div>
        <q-btn
          flat
          dense
          no-caps
          icon="add"
          color="primary"
          :label="t('contacts.addEmail')"
          @click="form.emails.push({ value: '', type: 'work' })"
        />
        <div v-for="(p, i) in form.phones" :key="'p' + i" class="row q-col-gutter-xs items-center">
          <q-input
            v-model="p.value"
            dense
            outlined
            type="tel"
            class="col"
            :label="t('contacts.phone')"
            dir="ltr"
          />
          <q-select
            v-model="p.type"
            dense
            outlined
            class="col-3"
            :options="['cell', 'work', 'home', 'other']"
          />
          <q-btn
            flat
            dense
            round
            icon="remove_circle_outline"
            color="grey"
            @click="form.phones.splice(i, 1)"
          />
        </div>
        <q-btn
          flat
          dense
          no-caps
          icon="add"
          color="primary"
          :label="t('contacts.addPhone')"
          @click="form.phones.push({ value: '', type: 'cell' })"
        />
        <div class="row q-col-gutter-sm">
          <q-input v-model="form.org" dense outlined class="col-6" :label="t('contacts.org')" />
          <q-input
            v-model="form.title"
            dense
            outlined
            class="col-6"
            :label="t('contacts.jobTitle')"
          />
        </div>
        <q-input
          v-model="form.note"
          type="textarea"
          outlined
          autogrow
          :label="t('contacts.note')"
        />
      </q-card-section>
      <q-separator />
      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat no-caps :label="t('common.cancel')" v-close-popup />
        <q-btn
          color="primary"
          unelevated
          no-caps
          :label="t('settings.save')"
          :loading="busy"
          :disable="!valid"
          @click="save"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { addressBookApi, errorMessage } from '@/api';
import type { AddressBook, Contact, ContactPayload } from '@/types/api';

const props = defineProps<{ modelValue: boolean; contact: Contact | null; books: AddressBook[] }>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; saved: [contact: Contact] }>();
const { t } = useI18n();
const $q = useQuasar();
const busy = ref(false);

const form = reactive<ContactPayload>({
  name: '',
  first_name: '',
  last_name: '',
  emails: [],
  phones: [],
  org: '',
  title: '',
  note: '',
  book_id: '',
});

function reset() {
  const c = props.contact;
  Object.assign(form, {
    name: c?.name ?? '',
    first_name: c?.first_name ?? '',
    last_name: c?.last_name ?? '',
    emails: c ? c.emails.map((e) => ({ ...e })) : [{ value: '', type: 'work' }],
    phones: c ? c.phones.map((p) => ({ ...p })) : [],
    org: c?.org ?? '',
    title: c?.title ?? '',
    note: c?.note ?? '',
    book_id: c?.book_id ?? props.books[0]?.id ?? '',
  });
}

const valid = computed(
  () =>
    (form.first_name.trim() || form.last_name.trim()) &&
    form.emails.every((e) => !e.value || /\S+@\S+\.\S+/.test(e.value)),
);

async function save() {
  busy.value = true;
  try {
    const payload: ContactPayload = {
      ...form,
      name: `${form.first_name} ${form.last_name}`.trim(),
      emails: form.emails.filter((e) => e.value.trim()),
      phones: form.phones.filter((p) => p.value.trim()),
    };
    const saved = props.contact
      ? await addressBookApi.update(props.contact.id, payload)
      : await addressBookApi.create(payload);
    emit('saved', saved);
    emit('update:modelValue', false);
  } catch (e) {
    $q.notify({ type: 'negative', message: errorMessage(e) });
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.rounded-card {
  border-radius: 14px;
}
</style>
