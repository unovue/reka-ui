<script setup lang="ts">
import { Icon } from '@iconify/vue'
import {
  DropdownMenuArrow,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIndicator,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from 'reka-ui'
import { ref } from 'vue'
import './styles.css'

const toggleState = ref(false)
const checkboxOne = ref(false)
const checkboxTwo = ref(false)
const person = ref('pedro')

function handleSelect() {
  // eslint-disable-next-line no-alert
  alert('hello!')
}
</script>

<template>
  <DropdownMenuRoot v-model:open="toggleState">
    <DropdownMenuTrigger
      class="IconButton"
      aria-label="Customise options"
    >
      <Icon icon="radix-icons:hamburger-menu" />
    </DropdownMenuTrigger>

    <DropdownMenuPortal>
      <DropdownMenuContent
        class="DropdownMenuContent"
        :side-offset="5"
      >
        <DropdownMenuItem
          value="New Tab"
          class="DropdownMenuItem"
          @select="handleSelect"
        >
          New Tab
          <div
            class="RightSlot"
          >
            ⌘+T
          </div>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger
            value="more toolsz"
            class="DropdownMenuSubTrigger"
          >
            More Tools
            <div
              class="RightSlot"
            >
              <Icon icon="radix-icons:chevron-right" />
            </div>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent
              class="DropdownMenuContent"
              :side-offset="2"
              :align-offset="-5"
            >
              <DropdownMenuItem
                class="DropdownMenuItem"
              >
                Save Page As…
                <div
                  class="RightSlot"
                >
                  ⌘+S
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                class="DropdownMenuItem"
              >
                Create Shortcut…
              </DropdownMenuItem>
              <DropdownMenuItem
                class="DropdownMenuItem"
              >
                Name Window…
              </DropdownMenuItem>
              <DropdownMenuSeparator class="DropdownMenuSeparator" />
              <DropdownMenuItem
                class="DropdownMenuItem"
              >
                Developer Tools
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuItem
          value="New Window"
          class="DropdownMenuItem"
        >
          New Window
          <div
            class="RightSlot"
          >
            ⌘+N
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          value="New Private Window"
          class="DropdownMenuItem"
          disabled
        >
          New Private Window
          <div
            class="RightSlot"
          >
            ⇧+⌘+N
          </div>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger
            value="more tools"
            class="DropdownMenuSubTrigger"
          >
            More Tools
            <div
              class="RightSlot"
            >
              <Icon icon="radix-icons:chevron-right" />
            </div>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent
              class="DropdownMenuContent"
              :side-offset="2"
              :align-offset="-5"
            >
              <DropdownMenuItem
                class="DropdownMenuItem"
              >
                Save Page As…
                <div
                  class="RightSlot"
                >
                  ⌘+S
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                class="DropdownMenuItem"
              >
                Create Shortcut…
              </DropdownMenuItem>
              <DropdownMenuItem
                class="DropdownMenuItem"
              >
                Name Window…
              </DropdownMenuItem>
              <DropdownMenuSeparator class="DropdownMenuSeparator" />
              <DropdownMenuItem
                class="DropdownMenuItem"
              >
                Developer Tools
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger
                  value="more toolsz"
                  class="DropdownMenuSubTrigger"
                >
                  More Tools
                  <div
                    class="RightSlot"
                  >
                    <Icon icon="radix-icons:chevron-right" />
                  </div>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent
                    class="DropdownMenuContent"
                    :side-offset="2"
                    :align-offset="-5"
                  >
                    <DropdownMenuItem
                      class="DropdownMenuItem"
                    >
                      Save Page As…
                      <div
                        class="RightSlot"
                      >
                        ⌘+S
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      class="DropdownMenuItem"
                    >
                      Create Shortcut…
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      class="DropdownMenuItem"
                    >
                      Name Window…
                    </DropdownMenuItem>
                    <DropdownMenuSeparator class="DropdownMenuSeparator" />
                    <DropdownMenuItem
                      class="DropdownMenuItem"
                    >
                      Developer Tools
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger
                        value="more toolsz"
                        class="DropdownMenuSubTrigger"
                      >
                        More Tools
                        <div
                          class="RightSlot"
                        >
                          <Icon icon="radix-icons:chevron-right" />
                        </div>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent
                          class="DropdownMenuContent"
                          :side-offset="2"
                          :align-offset="-5"
                        >
                          <DropdownMenuItem
                            class="DropdownMenuItem"
                          >
                            Save Page As…
                            <div
                              class="RightSlot"
                            >
                              ⌘+S
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            class="DropdownMenuItem"
                          >
                            Create Shortcut…
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            class="DropdownMenuItem"
                          >
                            Name Window…
                          </DropdownMenuItem>
                          <DropdownMenuSeparator class="DropdownMenuSeparator" />
                          <DropdownMenuItem
                            class="DropdownMenuItem"
                          >
                            Developer Tools
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuItem
                class="DropdownMenuItem"
              >
                Developer Tools
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSeparator class="DropdownMenuSeparator" />
        <DropdownMenuCheckboxItem
          v-model="checkboxOne"
          class="DropdownMenuItem"
        >
          <DropdownMenuItemIndicator class="DropdownMenuItemIndicator">
            <Icon icon="radix-icons:check" />
          </DropdownMenuItemIndicator>
          Show Bookmarks
          <div
            class="RightSlot"
          >
            ⌘+B
          </div>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          v-model="checkboxTwo"
          class="DropdownMenuItem"
        >
          <DropdownMenuItemIndicator class="DropdownMenuItemIndicator">
            <Icon icon="radix-icons:check" />
          </DropdownMenuItemIndicator>
          Show Full URLs
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator class="DropdownMenuSeparator" />

        <DropdownMenuLabel class="DropdownMenuLabel">
          People
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup v-model="person">
          <DropdownMenuRadioItem
            class="DropdownMenuItem"
            value="pedro"
          >
            <DropdownMenuItemIndicator class="DropdownMenuItemIndicator">
              <Icon icon="radix-icons:dot-filled" />
            </DropdownMenuItemIndicator>
            Pedro Duarte
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            class="DropdownMenuItem"
            value="colm"
          >
            <DropdownMenuItemIndicator class="DropdownMenuItemIndicator">
              <Icon icon="radix-icons:dot-filled" />
            </DropdownMenuItemIndicator>
            Colm Tuite
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuArrow class="DropdownMenuArrow" />
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
