<template>
  <q-page class="contacts-page row no-wrap q-gutter-x-md">
    <div class="mail-pane list-pane col-auto">
      <div class="q-pa-md">
        <q-btn
          color="primary"
          unelevated
          no-caps
          icon="person_add"
          :label="t('contacts.newContact')"
          class="full-width new-mail-btn"
          @click="openNew"
        />
        <q-input
          v-model="query"
          dense
          outlined
          rounded
          class="q-mt-sm"
          :placeholder="t('contacts.search')"
          clearable
          debounce="200"
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>
      </div>
      <q-separator />
      <div class="mail-scroll">
        <q-linear-progress v-if="loading" indeterminate color="primary" size="2px" />
        <div v-if="!loading && !filtered.length" class="text-grey text-center q-pa-xl">
          {{ t('contacts.none') }}
        </div>
        <template v-for="group in grouped" :key="group.letter">
          <div class="letter-head">{{ group.letter }}</div>
          <div
            v-for="c in group.items"
            :key="c.id"
            class="mail-list-item row items-center no-wrap"
            :class="{ 'is-selected': selected?.id === c.id }"
            @click="selected = c"
          >
            <q-avatar
              size="36px"
              text-color="white"
              class="q-mr-sm text-caption text-weight-bold"
              :style="{ background: avatarColor(c.emails[0]?.value ?? c.name) }"
              >{{ initials({ name: c.name, email: c.emails[0]?.value ?? '' }) }}</q-avatar
            >
            <div class="col" style="min-width: 0">
              <div class="mail-list-from">{{ c.name }}</div>
              <div class="mail-list-preview" dir="ltr">{{ c.emails[0]?.value || c.org }}</div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <div class="mail-pane col detail-pane">
      <template v-if="selected">
        <q-toolbar class="q-px-sm soft-toolbar" style="min-height: 52px">
          <q-btn
            flat
            dense
            no-caps
            icon="mail"
            :label="t('contacts.sendMail')"
            :disable="!selected.emails.length"
            @click="mailTo(selected)"
          />
          <q-btn
            flat
            dense
            no-caps
            icon="edit"
            :label="t('contacts.edit')"
            @click="openEdit(selected)"
          />
          <q-space />
          <q-btn flat dense round icon="delete" color="negative" @click="remove(selected)" />
        </q-toolbar>
        <q-separator />
        <div class="mail-scroll q-pa-lg">
          <div class="row items-center q-mb-lg">
            <q-avatar
              size="72px"
              text-color="white"
              class="text-h5 text-weight-bold"
              :style="{ background: avatarColor(selected.emails[0]?.value ?? selected.name) }"
              >{{
                initials({ name: selected.name, email: selected.emails[0]?.value ?? '' })
              }}</q-avatar
            >
            <div class="q-ml-md">
              <div class="text-h5 text-weight-bold">{{ selected.name }}</div>
              <div class="text-grey">
                {{ [selected.title, selected.org].filter(Boolean).join(' · ') }}
              </div>
            </div>
          </div>
          <q-list>
            <q-item
              v-for="e in selected.emails"
              :key="e.value"
              clickable
              @click="mailTo(selected, e.value)"
            >
              <q-item-section avatar><q-icon name="alternate_email" /></q-item-section>
              <q-item-section
                ><q-item-label dir="ltr">{{ e.value }}</q-item-label
                ><q-item-label caption>{{ e.type }}</q-item-label></q-item-section
              >
            </q-item>
            <q-item
              v-for="p in selected.phones"
              :key="p.value"
              clickable
              :href="`tel:${p.value}`"
              tag="a"
            >
              <q-item-section avatar><q-icon name="phone" /></q-item-section>
              <q-item-section
                ><q-item-label dir="ltr">{{ p.value }}</q-item-label
                ><q-item-label caption>{{ p.type }}</q-item-label></q-item-section
              >
            </q-item>
            <q-item v-if="selected.note">
              <q-item-section avatar><q-icon name="notes" /></q-item-section>
              <q-item-section
                ><q-item-label class="pre-wrap">{{ selected.note }}</q-item-label></q-item-section
              >
            </q-item>
          </q-list>
        </div>
      </template>
      <div v-else class="column flex-center text-grey full-height q-pa-xl">
        <div class="empty-hero"><q-icon name="people" size="44px" /></div>
        <div class="text-subtitle1 text-weight-medium q-mt-md">{{ t('contacts.select') }}</div>
      </div>
    </div>

    <contact-dialog v-model="dialog" :contact="editing" :books="books" @saved="onSaved" />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { addressBookApi, errorMessage } from '@/api';
import { useComposeStore } from '@/stores/compose';
import { avatarColor, initials } from '@/utils/format';
import type { AddressBook, Contact } from '@/types/api';
import ContactDialog from '@/components/contacts/ContactDialog.vue';

const { t } = useI18n();
const $q = useQuasar();
const router = useRouter();
const compose = useComposeStore();

const contacts = ref<Contact[]>([]);
const books = ref<AddressBook[]>([]);
const loading = ref(false);
const query = ref('');
const selected = ref<Contact | null>(null);
const dialog = ref(false);
const editing = ref<Contact | null>(null);

async function load() {
  loading.value = true;
  try {
    const result = await addressBookApi.contacts();
    contacts.value = result.data;
    books.value = result.books;
  } catch (e) {
    $q.notify({ type: 'negative', message: errorMessage(e) });
  } finally {
    loading.value = false;
  }
}
onMounted(load);

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return contacts.value;
  return contacts.value.filter((c) =>
    [c.name, c.org, ...c.emails.map((e) => e.value), ...c.phones.map((p) => p.value)]
      .join(' ')
      .toLowerCase()
      .includes(q),
  );
});

const grouped = computed(() => {
  const groups = new Map<string, Contact[]>();
  for (const c of filtered.value) {
    const letter = (c.name.trim()[0] ?? '#').toUpperCase();
    groups.set(letter, [...(groups.get(letter) ?? []), c]);
  }
  return [...groups.entries()].map(([letter, items]) => ({ letter, items }));
});

function mailTo(c: Contact, email?: string) {
  const to = email ?? c.emails[0]?.value;
  if (!to) return;
  compose.start({ mode: 'new', to: [to] });
  void router.push({ name: 'mail' });
}

function openNew() {
  editing.value = null;
  dialog.value = true;
}
function openEdit(c: Contact) {
  editing.value = c;
  dialog.value = true;
}
function onSaved(c: Contact) {
  const idx = contacts.value.findIndex((x) => x.id === c.id);
  if (idx >= 0) contacts.value[idx] = c;
  else contacts.value.push(c);
  contacts.value.sort((a, b) => a.name.localeCompare(b.name));
  selected.value = c;
}
function remove(c: Contact) {
  $q.dialog({
    title: t('contacts.delete'),
    message: c.name,
    cancel: true,
    ok: t('mail.delete'),
  }).onOk(() => {
    addressBookApi.delete(c.id).then(
      () => {
        contacts.value = contacts.value.filter((x) => x.id !== c.id);
        if (selected.value?.id === c.id) selected.value = null;
      },
      (e) => $q.notify({ type: 'negative', message: errorMessage(e) }),
    );
  });
}
</script>

<style scoped lang="scss">
.contacts-page {
  height: calc(100vh - 56px);
  overflow: hidden;
  padding: 16px 16px 16px 0;
}
html[dir='rtl'] .contacts-page {
  padding: 16px 0 16px 16px;
}
.list-pane {
  width: 360px;
}
.detail-pane {
  min-width: 0;
}
.new-mail-btn {
  border-radius: 12px;
  height: 42px;
  font-weight: 600;
}
.letter-head {
  font-size: 12px;
  font-weight: 700;
  color: var(--mail-primary);
  padding: 8px 16px 2px;
}
.pre-wrap {
  white-space: pre-wrap;
}
.empty-hero {
  width: 96px;
  height: 96px;
  border-radius: 28px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--mail-selected), var(--mail-surface-2));
  color: var(--mail-primary);
}
</style>
