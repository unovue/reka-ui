<script lang="ts">
// A port of the UI SDK agent benchmark's reka-ui settings screen
// (benchmarks/agent/src/screens/VueRekaUi.vue), used as a test fixture.
export interface Member { id: string, name: string, role: 'admin' | 'member' }
export interface Settings {
  name: string
  visibility: string
  members: Member[]
  email: Record<string, boolean>
  slack: Record<string, boolean>
}

export const visibilities = [
  { value: 'public', label: 'Public' },
  { value: 'internal', label: 'Internal' },
  { value: 'private', label: 'Private' },
]

export const channels = [
  {
    value: 'email' as const,
    label: 'Email',
    notifications: [
      { value: 'deploy-failures', label: 'Deploy failures' },
      { value: 'weekly-digest', label: 'Weekly digest' },
      { value: 'mentions', label: 'Mentions' },
    ],
  },
  {
    value: 'slack' as const,
    label: 'Slack',
    notifications: [
      { value: 'deploy-failures', label: 'Deploy failures' },
      { value: 'new-members', label: 'New members' },
    ],
  },
]

const names = [
  'Ada Okafor',
  'Ben Carter',
  'Chloe Martin',
  'Diego Alvarez',
  'Elena Petrova',
  'Farah Khan',
  'Gabriel Silva',
  'Hana Suzuki',
  'Ivan Horvat',
  'Jonas Berg',
  'Kira Novak',
  'Liam Walsh',
  'Maya Cohen',
  'Noah Fischer',
  'Olivia Brown',
  'Priya Shah',
  'Quinn Taylor',
  'Rosa Romero',
  'Samir Haddad',
  'Tom Becker',
  'Uma Iyer',
  'Victor Dubois',
  'Wen Li',
  'Yara Haddad',
]

export function initialSettings(): Settings {
  return {
    name: 'Orion',
    visibility: 'public',
    members: names.map(name => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      role: name === 'Ada Okafor' ? 'admin' : 'member',
    })),
    email: { 'deploy-failures': false, 'weekly-digest': true, 'mentions': true },
    slack: { 'deploy-failures': true, 'new-members': false },
  }
}
</script>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import {
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionRoot,
  AccordionTrigger,
} from '@/Accordion'
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
} from '@/AlertDialog'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '@/DropdownMenu'
import { Label } from '@/Label'
import {
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from '@/Select'
import { SwitchRoot, SwitchThumb } from '@/Switch'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '@/Tabs'

const emit = defineEmits<{ save: [settings: Settings] }>()

const settings = reactive(initialSettings())
const removing = ref<Member | null>(null)
const isConfirming = ref(false)

function confirmRemoval(member: Member) {
  removing.value = member
  isConfirming.value = true
}

function toggleRole(member: Member) {
  member.role = member.role === 'admin' ? 'member' : 'admin'
}

function remove() {
  settings.members = settings.members.filter(member => member.id !== removing.value?.id)
}

function save() {
  emit('save', JSON.parse(JSON.stringify(settings)))
}
</script>

<template>
  <main class="screen">
    <h1>Project settings</h1>
    <TabsRoot default-value="general">
      <TabsList
        class="row"
        aria-label="Settings"
      >
        <TabsTrigger value="general">
          General
        </TabsTrigger>
        <TabsTrigger value="members">
          Members
        </TabsTrigger>
        <TabsTrigger value="notifications">
          Notifications
        </TabsTrigger>
      </TabsList>

      <TabsContent
        value="general"
        class="screen"
      >
        <div class="field">
          <Label for="project-name">Project name</Label>
          <input
            id="project-name"
            v-model="settings.name"
          >
        </div>
        <div class="field">
          <Label for="visibility">Visibility</Label>
          <SelectRoot v-model="settings.visibility">
            <SelectTrigger
              id="visibility"
              class="trigger"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectPortal>
              <SelectContent
                class="popup"
                position="popper"
                :side-offset="4"
              >
                <SelectViewport>
                  <SelectItem
                    v-for="item in visibilities"
                    :key="item.value"
                    :value="item.value"
                    class="item"
                  >
                    <SelectItemText>{{ item.label }}</SelectItemText>
                  </SelectItem>
                </SelectViewport>
              </SelectContent>
            </SelectPortal>
          </SelectRoot>
        </div>
      </TabsContent>

      <TabsContent value="members">
        <ul class="members">
          <li
            v-for="member in settings.members"
            :key="member.id"
            class="row"
          >
            <span class="name">{{ member.name }}</span>
            <span>{{ member.role === "admin" ? "Admin" : "Member" }}</span>
            <DropdownMenuRoot>
              <DropdownMenuTrigger
                class="button"
                :aria-label="`Actions for ${member.name}`"
              >
                ⋯
              </DropdownMenuTrigger>
              <DropdownMenuPortal>
                <DropdownMenuContent
                  class="popup"
                  :side-offset="4"
                >
                  <DropdownMenuItem
                    class="item"
                    @select="toggleRole(member)"
                  >
                    {{ member.role === "admin" ? "Make member" : "Make admin" }}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    class="item"
                    @select="confirmRemoval(member)"
                  >
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenuRoot>
          </li>
        </ul>
      </TabsContent>

      <TabsContent value="notifications">
        <AccordionRoot
          type="single"
          collapsible
        >
          <AccordionItem
            v-for="channel in channels"
            :key="channel.value"
            :value="channel.value"
          >
            <AccordionHeader>
              <AccordionTrigger class="button">
                {{ channel.label }}
              </AccordionTrigger>
            </AccordionHeader>
            <AccordionContent class="screen">
              <label
                v-for="item in channel.notifications"
                :key="item.value"
                class="choice"
              >
                <SwitchRoot
                  v-model="settings[channel.value][item.value]"
                  class="switch"
                >
                  <SwitchThumb class="switch-thumb" />
                </SwitchRoot>
                {{ item.label }}
              </label>
            </AccordionContent>
          </AccordionItem>
        </AccordionRoot>
      </TabsContent>
    </TabsRoot>

    <AlertDialogRoot v-model:open="isConfirming">
      <AlertDialogPortal>
        <AlertDialogOverlay class="backdrop" />
        <AlertDialogContent class="dialog">
          <AlertDialogTitle>Remove {{ removing?.name }}?</AlertDialogTitle>
          <AlertDialogDescription>
            They lose access to this project right away.
          </AlertDialogDescription>
          <div class="row">
            <AlertDialogCancel class="button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              class="button"
              @click="remove"
            >
              Remove
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialogPortal>
    </AlertDialogRoot>

    <button
      type="button"
      class="button"
      @click="save"
    >
      Save settings
    </button>
  </main>
</template>
